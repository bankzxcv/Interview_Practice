# Google Cloud Functions with Go

Build high-performance serverless functions on Google Cloud using Go.

## Prerequisites

```bash
# Install Go 1.21+
go version

# Install Google Cloud SDK
gcloud --version

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Project Setup

```bash
mkdir gcf-go
cd gcf-go
go mod init example.com/gcf-go

# Install dependencies
go get cloud.google.com/go/storage
go get cloud.google.com/go/firestore
go get cloud.google.com/go/pubsub
```

## HTTP Function

```go
// cmd/http/main.go
package hellohttp

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Response struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Method    string `json:"method"`
}

func HelloHTTP(w http.ResponseWriter, r *http.Request) {
	var name string

	// Parse query parameter or JSON body
	if r.Method == "GET" {
		name = r.URL.Query().Get("name")
	} else {
		var d struct {
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&d); err == nil {
			name = d.Name
		}
	}

	if name == "" {
		name = "World"
	}

	response := Response{
		Message:   fmt.Sprintf("Hello, %s!", name),
		Timestamp: time.Now().Format(time.RFC3339),
		Method:    r.Method,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
```

## Firestore Integration

```go
// cmd/firestore/main.go
package firestorehandler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"
)

var client *firestore.Client

func init() {
	projectID := os.Getenv("GCP_PROJECT")
	var err error
	client, err = firestore.NewClient(context.Background(), projectID)
	if err != nil {
		panic(err)
	}
}

type User struct {
	UserID    string `json:"userId" firestore:"userId"`
	Name      string `json:"name" firestore:"name"`
	Email     string `json:"email" firestore:"email"`
	CreatedAt string `json:"createdAt" firestore:"createdAt"`
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	_, err := client.Collection("users").Doc(user.UserID).Set(ctx, user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteStatus(201)
	json.NewEncoder(w).Encode(user)
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")

	ctx := context.Background()
	doc, err := client.Collection("users").Doc(userID).Get(ctx)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var user User
	doc.DataTo(&user)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
```

## Cloud Storage Trigger

```go
// cmd/storage/main.go
package storagehandler

import (
	"context"
	"fmt"
	"log"

	"cloud.google.com/go/storage"
)

type StorageEvent struct {
	Bucket string `json:"bucket"`
	Name   string `json:"name"`
	Size   int64  `json:"size"`
}

func ProcessFile(ctx context.Context, e StorageEvent) error {
	log.Printf("Processing file: %s from bucket: %s (%d bytes)", e.Name, e.Bucket, e.Size)

	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("storage.NewClient: %v", err)
	}
	defer client.Close()

	bucket := client.Bucket(e.Bucket)
	obj := bucket.Object(e.Name)

	reader, err := obj.NewReader(ctx)
	if err != nil {
		return fmt.Errorf("Object(%q).NewReader: %v", e.Name, err)
	}
	defer reader.Close()

	// Read content
	buf := make([]byte, e.Size)
	n, err := reader.Read(buf)
	if err != nil {
		return fmt.Errorf("Reader.Read: %v", err)
	}

	log.Printf("Read %d bytes", n)
	log.Printf("Content preview: %s", string(buf[:min(100, n)]))

	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
```

## Pub/Sub Trigger

```go
// cmd/pubsub/main.go
package pubsubhandler

import (
	"context"
	"encoding/json"
	"log"
)

type PubSubMessage struct {
	Data       []byte            `json:"data"`
	Attributes map[string]string `json:"attributes"`
}

type OrderMessage struct {
	OrderID      string  `json:"orderId"`
	CustomerID   string  `json:"customerId"`
	Items        []Item  `json:"items"`
	TotalAmount  float64 `json:"totalAmount"`
}

type Item struct {
	ProductID string  `json:"productId"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

func ProcessOrder(ctx context.Context, m PubSubMessage) error {
	var order OrderMessage
	if err := json.Unmarshal(m.Data, &order); err != nil {
		return err
	}

	log.Printf("Processing order: %s", order.OrderID)
	log.Printf("Customer: %s, Total: $%.2f", order.CustomerID, order.TotalAmount)

	// Process order
	if err := handleOrder(ctx, order); err != nil {
		return err
	}

	log.Printf("Order %s processed successfully", order.OrderID)
	return nil
}

func handleOrder(ctx context.Context, order OrderMessage) error {
	log.Printf("Processing %d items", len(order.Items))

	// Business logic
	// Update inventory
	// Send confirmation
	// etc.

	return nil
}
```

## Scheduled Function

```go
// cmd/scheduled/main.go
package scheduledhandler

import (
	"context"
	"log"
	"time"
)

type PubSubMessage struct {
	Data []byte `json:"data"`
}

type DailyReport struct {
	Date    string `json:"date"`
	Metrics struct {
		TotalOrders  int     `json:"totalOrders"`
		Revenue      float64 `json:"revenue"`
		NewCustomers int     `json:"newCustomers"`
	} `json:"metrics"`
}

func DailyReport(ctx context.Context, m PubSubMessage) error {
	log.Printf("Running daily report at: %s", time.Now().Format(time.RFC3339))

	report := generateReport()
	log.Printf("Report generated: %+v", report)

	// Send report
	if err := sendReport(ctx, report); err != nil {
		return err
	}

	log.Println("Report sent successfully")
	return nil
}

func generateReport() DailyReport {
	var report DailyReport
	report.Date = time.Now().Format("2006-01-02")
	report.Metrics.TotalOrders = 150
	report.Metrics.Revenue = 15000.00
	report.Metrics.NewCustomers = 25

	return report
}

func sendReport(ctx context.Context, report DailyReport) error {
	log.Println("Sending report...")
	// Implementation
	return nil
}
```

## Deployment

```bash
# Deploy HTTP function
gcloud functions deploy hello-http \
  --gen2 \
  --runtime=go121 \
  --region=us-central1 \
  --entry-point=HelloHTTP \
  --trigger-http \
  --allow-unauthenticated

# Deploy Storage trigger
gcloud functions deploy process-file \
  --gen2 \
  --runtime=go121 \
  --region=us-central1 \
  --entry-point=ProcessFile \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=my-bucket"

# Deploy Pub/Sub trigger
gcloud functions deploy process-order \
  --gen2 \
  --runtime=go121 \
  --region=us-central1 \
  --entry-point=ProcessOrder \
  --trigger-topic=orders
```

## Best Practices

1. Initialize clients in init() for reuse
2. Use context for cancellation and timeouts
3. Handle errors gracefully with proper logging
4. Keep binaries small
5. Use goroutines carefully
6. Implement proper cleanup with defer
7. Use structured logging
8. Cache external connections
