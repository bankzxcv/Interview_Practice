# Azure Functions with Go (Custom Handlers)

Azure Functions supports Go through Custom Handlers, allowing you to write functions in Go while leveraging the Azure Functions runtime.

## How Custom Handlers Work

```
Azure Functions Runtime → HTTP Request → Go Custom Handler → HTTP Response → Azure Functions Runtime
```

Custom handlers are lightweight web servers that receive events from the Functions host via HTTP.

## Prerequisites

```bash
# Install Go 1.21+
go version

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Install Azure CLI
az --version
```

## Project Setup

```bash
# Create Functions project
func init azure-functions-go --worker-runtime custom

cd azure-functions-go

# Initialize Go module
go mod init github.com/yourusername/azure-functions-go

# Install dependencies
go get github.com/gorilla/mux
```

## Project Structure

```
azure-functions-go/
├── cmd/
│   └── server/
│       └── main.go
├── handlers/
│   ├── http_handler.go
│   ├── timer_handler.go
│   └── queue_handler.go
├── HttpTrigger/
│   └── function.json
├── TimerTrigger/
│   └── function.json
├── host.json
├── local.settings.json
└── go.mod
```

## Custom Handler Server

```go
// cmd/server/main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/yourusername/azure-functions-go/handlers"
)

type InvokeRequest struct {
	Data     map[string]interface{} `json:"Data"`
	Metadata map[string]interface{} `json:"Metadata"`
}

type InvokeResponse struct {
	Outputs     map[string]interface{} `json:"Outputs"`
	Logs        []string               `json:"Logs"`
	ReturnValue interface{}            `json:"ReturnValue"`
}

func main() {
	customHandlerPort := os.Getenv("FUNCTIONS_CUSTOMHANDLER_PORT")
	if customHandlerPort == "" {
		customHandlerPort = "8080"
	}

	mux := http.NewServeMux()

	// Register function handlers
	mux.HandleFunc("/HttpTrigger", handlers.HttpTriggerHandler)
	mux.HandleFunc("/TimerTrigger", handlers.TimerTriggerHandler)
	mux.HandleFunc("/QueueTrigger", handlers.QueueTriggerHandler)

	addr := fmt.Sprintf(":%s", customHandlerPort)
	log.Printf("Starting custom handler server on %s", addr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
```

## HTTP Trigger Handler

```go
// handlers/http_handler.go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type HttpRequest struct {
	Method  string            `json:"Method"`
	Query   map[string]string `json:"Query"`
	Headers map[string]string `json:"Headers"`
	Body    string            `json:"Body"`
}

type HttpResponse struct {
	StatusCode int               `json:"StatusCode"`
	Headers    map[string]string `json:"Headers"`
	Body       interface{}       `json:"Body"`
}

type InvokeRequest struct {
	Data     map[string]interface{} `json:"Data"`
	Metadata map[string]interface{} `json:"Metadata"`
}

type InvokeResponse struct {
	Outputs     map[string]interface{} `json:"Outputs"`
	Logs        []string               `json:"Logs"`
	ReturnValue interface{}            `json:"ReturnValue"`
}

type HelloResponse struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Method    string `json:"method"`
}

func HttpTriggerHandler(w http.ResponseWriter, r *http.Request) {
	var invokeReq InvokeRequest
	if err := json.NewDecoder(r.Body).Decode(&invokeReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Extract HTTP request data
	httpReq := invokeReq.Data["req"].(map[string]interface{})
	query := make(map[string]string)
	if q, ok := httpReq["Query"].(map[string]interface{}); ok {
		for k, v := range q {
			query[k] = fmt.Sprintf("%v", v)
		}
	}

	name := "World"
	if n, ok := query["name"]; ok {
		name = n
	}

	// Create response
	response := HelloResponse{
		Message:   fmt.Sprintf("Hello, %s!", name),
		Timestamp: time.Now().Format(time.RFC3339),
		Method:    httpReq["Method"].(string),
	}

	httpResponse := HttpResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: response,
	}

	invokeResp := InvokeResponse{
		Outputs: map[string]interface{}{
			"res": httpResponse,
		},
		Logs: []string{
			"Processing HTTP request in Go",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invokeResp)
}
```

## REST API with CRUD Operations

```go
// handlers/users_handler.go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var (
	users = map[string]User{
		"1": {ID: "1", Name: "John Doe", Email: "john@example.com"},
		"2": {ID: "2", Name: "Jane Smith", Email: "jane@example.com"},
	}
	usersMux sync.RWMutex
)

func UsersHandler(w http.ResponseWriter, r *http.Request) {
	var invokeReq InvokeRequest
	if err := json.NewDecoder(r.Body).Decode(&invokeReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	httpReq := invokeReq.Data["req"].(map[string]interface{})
	method := httpReq["Method"].(string)

	var httpResponse HttpResponse

	switch method {
	case "GET":
		httpResponse = getUsers()
	case "POST":
		httpResponse = createUser(httpReq)
	case "PUT":
		httpResponse = updateUser(httpReq)
	case "DELETE":
		httpResponse = deleteUser(httpReq)
	default:
		httpResponse = HttpResponse{
			StatusCode: 405,
			Body:       map[string]string{"error": "Method not allowed"},
		}
	}

	invokeResp := InvokeResponse{
		Outputs: map[string]interface{}{"res": httpResponse},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invokeResp)
}

func getUsers() HttpResponse {
	usersMux.RLock()
	defer usersMux.RUnlock()

	userList := make([]User, 0, len(users))
	for _, user := range users {
		userList = append(userList, user)
	}

	return HttpResponse{
		StatusCode: 200,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       map[string]interface{}{"users": userList},
	}
}

func createUser(httpReq map[string]interface{}) HttpResponse {
	var user User
	body := httpReq["Body"].(string)

	if err := json.Unmarshal([]byte(body), &user); err != nil {
		return HttpResponse{
			StatusCode: 400,
			Body:       map[string]string{"error": "Invalid request body"},
		}
	}

	usersMux.Lock()
	defer usersMux.Unlock()

	user.ID = fmt.Sprintf("%d", len(users)+1)
	users[user.ID] = user

	return HttpResponse{
		StatusCode: 201,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       user,
	}
}

func updateUser(httpReq map[string]interface{}) HttpResponse {
	params := httpReq["Params"].(map[string]interface{})
	userID := params["id"].(string)

	usersMux.Lock()
	defer usersMux.Unlock()

	user, exists := users[userID]
	if !exists {
		return HttpResponse{
			StatusCode: 404,
			Body:       map[string]string{"error": "User not found"},
		}
	}

	var updates User
	body := httpReq["Body"].(string)
	if err := json.Unmarshal([]byte(body), &updates); err != nil {
		return HttpResponse{
			StatusCode: 400,
			Body:       map[string]string{"error": "Invalid request body"},
		}
	}

	if updates.Name != "" {
		user.Name = updates.Name
	}
	if updates.Email != "" {
		user.Email = updates.Email
	}

	users[userID] = user

	return HttpResponse{
		StatusCode: 200,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       user,
	}
}

func deleteUser(httpReq map[string]interface{}) HttpResponse {
	params := httpReq["Params"].(map[string]interface{})
	userID := params["id"].(string)

	usersMux.Lock()
	defer usersMux.Unlock()

	if _, exists := users[userID]; !exists {
		return HttpResponse{
			StatusCode: 404,
			Body:       map[string]string{"error": "User not found"},
		}
	}

	delete(users, userID)

	return HttpResponse{
		StatusCode: 204,
	}
}
```

## Timer Trigger

```go
// handlers/timer_handler.go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type TimerInfo struct {
	Schedule       string    `json:"Schedule"`
	ScheduleStatus string    `json:"ScheduleStatus"`
	IsPastDue      bool      `json:"IsPastDue"`
	Last           time.Time `json:"Last"`
	Next           time.Time `json:"Next"`
}

func TimerTriggerHandler(w http.ResponseWriter, r *http.Request) {
	var invokeReq InvokeRequest
	if err := json.NewDecoder(r.Body).Decode(&invokeReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Timer trigger executed at: %s", time.Now().Format(time.RFC3339))

	// Generate daily report
	report := generateDailyReport()

	log.Printf("Daily report generated: %+v", report)

	invokeResp := InvokeResponse{
		Logs: []string{
			"Timer trigger executed",
			"Daily report generated successfully",
		},
		ReturnValue: report,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invokeResp)
}

type DailyReport struct {
	Date    string `json:"date"`
	Metrics struct {
		TotalOrders  int     `json:"totalOrders"`
		Revenue      float64 `json:"revenue"`
		NewCustomers int     `json:"newCustomers"`
	} `json:"metrics"`
}

func generateDailyReport() DailyReport {
	var report DailyReport
	report.Date = time.Now().Format("2006-01-02")
	report.Metrics.TotalOrders = 150
	report.Metrics.Revenue = 15000.00
	report.Metrics.NewCustomers = 25

	return report
}
```

## Queue Trigger

```go
// handlers/queue_handler.go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

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

func QueueTriggerHandler(w http.ResponseWriter, r *http.Request) {
	var invokeReq InvokeRequest
	if err := json.NewDecoder(r.Body).Decode(&invokeReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Extract queue message
	queueData := invokeReq.Data["queueMessage"].(string)

	var order OrderMessage
	if err := json.Unmarshal([]byte(queueData), &order); err != nil {
		log.Printf("Error parsing queue message: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Processing order: %s", order.OrderID)
	log.Printf("Customer: %s, Total: $%.2f", order.CustomerID, order.TotalAmount)

	// Process the order
	if err := processOrder(order); err != nil {
		log.Printf("Error processing order: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Order %s processed successfully", order.OrderID)

	invokeResp := InvokeResponse{
		Logs: []string{
			"Queue message processed successfully",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invokeResp)
}

func processOrder(order OrderMessage) error {
	// Business logic
	log.Printf("Processing %d items", len(order.Items))

	// Update inventory
	// Send confirmation
	// etc.

	return nil
}
```

## Function Configuration

### HttpTrigger/function.json

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

### TimerTrigger/function.json

```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 9 * * *"
    }
  ]
}
```

### host.json

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "customHandler": {
    "description": {
      "defaultExecutablePath": "handler",
      "workingDirectory": "",
      "arguments": []
    },
    "enableForwardingHttpRequest": false
  }
}
```

## Build Script

```bash
#!/bin/bash
# build.sh

GOOS=linux GOARCH=amd64 go build -o handler cmd/server/main.go

chmod +x handler

echo "Build complete!"
```

## Local Development

```bash
# Build the handler
./build.sh

# Start Functions locally
func start
```

## Deployment

```bash
# Build for Linux
GOOS=linux GOARCH=amd64 go build -o handler cmd/server/main.go

# Create function app
az functionapp create \
  --name my-go-functions \
  --resource-group rg-functions \
  --storage-account stfunctions \
  --consumption-plan-location eastus \
  --functions-version 4 \
  --os-type Linux

# Deploy
func azure functionapp publish my-go-functions
```

## Best Practices

1. **Use goroutines carefully** - Functions should complete quickly
2. **Implement proper error handling** with logging
3. **Use sync.Pool** for object reuse
4. **Keep binaries small** - only include necessary dependencies
5. **Handle timeouts gracefully**
6. **Use context for cancellation**
7. **Monitor memory usage** and optimize accordingly
8. **Cache connections** to external services
