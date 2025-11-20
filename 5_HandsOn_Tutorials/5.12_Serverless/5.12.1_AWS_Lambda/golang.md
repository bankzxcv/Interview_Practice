# AWS Lambda with Go

Complete guide to building high-performance serverless functions with AWS Lambda using Go.

## Why Go for Lambda?

- **Fast cold starts**: Compiled binary, minimal runtime overhead
- **Low memory footprint**: Efficient resource usage
- **High performance**: Native execution speed
- **Cost-effective**: Lower execution time = lower costs
- **Type safety**: Strong typing prevents runtime errors

## Prerequisites

```bash
# Install Go (1.21+)
go version

# Install AWS CLI
aws --version

# Install AWS SAM CLI
sam --version
```

## Project Setup

```bash
mkdir aws-lambda-go
cd aws-lambda-go
go mod init github.com/yourusername/aws-lambda-go

# Install AWS Lambda Go SDK
go get github.com/aws/aws-lambda-go/lambda
go get github.com/aws/aws-lambda-go/events

# Install AWS SDK v2
go get github.com/aws/aws-sdk-go-v2/config
go get github.com/aws/aws-sdk-go-v2/service/dynamodb
go get github.com/aws/aws-sdk-go-v2/service/s3
go get github.com/aws/aws-sdk-go-v2/service/sqs
```

## Basic Lambda Function

### Simple Handler

```go
// cmd/hello/main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	RequestID string `json:"requestId"`
}

func HandleRequest(ctx context.Context, event interface{}) (Response, error) {
	// Get request ID from context
	lambdaContext, _ := lambdacontext.FromContext(ctx)

	response := Response{
		Message:   "Hello from Lambda with Go!",
		Timestamp: time.Now().Format(time.RFC3339),
		RequestID: lambdaContext.AwsRequestID,
	}

	return response, nil
}

func main() {
	lambda.Start(HandleRequest)
}
```

### API Gateway Handler

```go
// cmd/api-hello/main.go
package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
	Message string `json:"message"`
	Path    string `json:"path"`
	Method  string `json:"method"`
}

func HandleAPIGatewayRequest(
	ctx context.Context,
	request events.APIGatewayProxyRequest,
) (events.APIGatewayProxyResponse, error) {
	response := Response{
		Message: "Hello from API Gateway",
		Path:    request.Path,
		Method:  request.HTTPMethod,
	}

	body, err := json.Marshal(response)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       `{"error": "Internal server error"}`,
		}, err
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(HandleAPIGatewayRequest)
}
```

## REST API with CRUD Operations

```go
// cmd/users-api/main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// In-memory store (use DynamoDB in production)
var users = map[string]User{
	"1": {ID: "1", Name: "John Doe", Email: "john@example.com"},
	"2": {ID: "2", Name: "Jane Smith", Email: "jane@example.com"},
}

func HandleRequest(
	ctx context.Context,
	request events.APIGatewayProxyRequest,
) (events.APIGatewayProxyResponse, error) {
	switch request.HTTPMethod {
	case "GET":
		if id, ok := request.PathParameters["id"]; ok {
			return getUser(id)
		}
		return listUsers()
	case "POST":
		return createUser(request)
	case "PUT":
		return updateUser(request)
	case "DELETE":
		if id, ok := request.PathParameters["id"]; ok {
			return deleteUser(id)
		}
	}

	return errorResponse(http.StatusMethodNotAllowed, "Method not allowed"), nil
}

func getUser(id string) (events.APIGatewayProxyResponse, error) {
	user, exists := users[id]
	if !exists {
		return errorResponse(http.StatusNotFound, "User not found"), nil
	}

	return jsonResponse(http.StatusOK, user), nil
}

func listUsers() (events.APIGatewayProxyResponse, error) {
	userList := make([]User, 0, len(users))
	for _, user := range users {
		userList = append(userList, user)
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{
		"users": userList,
	}), nil
}

func createUser(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var user User
	if err := json.Unmarshal([]byte(request.Body), &user); err != nil {
		return errorResponse(http.StatusBadRequest, "Invalid request body"), nil
	}

	if user.Name == "" || user.Email == "" {
		return errorResponse(http.StatusBadRequest, "Name and email are required"), nil
	}

	user.ID = fmt.Sprintf("%d", len(users)+1)
	users[user.ID] = user

	return jsonResponse(http.StatusCreated, user), nil
}

func updateUser(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id, ok := request.PathParameters["id"]
	if !ok {
		return errorResponse(http.StatusBadRequest, "User ID is required"), nil
	}

	existingUser, exists := users[id]
	if !exists {
		return errorResponse(http.StatusNotFound, "User not found"), nil
	}

	var updates User
	if err := json.Unmarshal([]byte(request.Body), &updates); err != nil {
		return errorResponse(http.StatusBadRequest, "Invalid request body"), nil
	}

	if updates.Name != "" {
		existingUser.Name = updates.Name
	}
	if updates.Email != "" {
		existingUser.Email = updates.Email
	}

	users[id] = existingUser
	return jsonResponse(http.StatusOK, existingUser), nil
}

func deleteUser(id string) (events.APIGatewayProxyResponse, error) {
	if _, exists := users[id]; !exists {
		return errorResponse(http.StatusNotFound, "User not found"), nil
	}

	delete(users, id)
	return jsonResponse(http.StatusNoContent, nil), nil
}

func jsonResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body := ""
	if data != nil {
		bodyBytes, _ := json.Marshal(data)
		body = string(bodyBytes)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: body,
	}
}

func errorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	return jsonResponse(statusCode, ErrorResponse{Error: message})
}

func main() {
	lambda.Start(HandleRequest)
}
```

## DynamoDB Integration

```go
// cmd/dynamodb-handler/main.go
package main

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type UserItem struct {
	UserID    string `json:"userId" dynamodbav:"userId"`
	Name      string `json:"name" dynamodbav:"name"`
	Email     string `json:"email" dynamodbav:"email"`
	CreatedAt string `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt string `json:"updatedAt" dynamodbav:"updatedAt"`
}

var (
	dynamoClient *dynamodb.Client
	tableName    string
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic("unable to load SDK config, " + err.Error())
	}

	dynamoClient = dynamodb.NewFromConfig(cfg)
	tableName = os.Getenv("TABLE_NAME")
	if tableName == "" {
		tableName = "Users"
	}
}

func HandleRequest(
	ctx context.Context,
	request events.APIGatewayProxyRequest,
) (events.APIGatewayProxyResponse, error) {
	switch request.HTTPMethod {
	case "GET":
		return getItem(ctx, request)
	case "POST":
		return createItem(ctx, request)
	case "PUT":
		return updateItem(ctx, request)
	case "DELETE":
		return deleteItem(ctx, request)
	default:
		return errorResponse(405, "Method not allowed"), nil
	}
}

func createItem(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var user UserItem
	if err := json.Unmarshal([]byte(request.Body), &user); err != nil {
		return errorResponse(400, "Invalid request body"), nil
	}

	now := time.Now().Format(time.RFC3339)
	user.CreatedAt = now
	user.UpdatedAt = now

	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return errorResponse(500, "Failed to marshal item"), nil
	}

	_, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return errorResponse(500, "Failed to create item"), nil
	}

	return jsonResponse(201, user), nil
}

func getItem(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userId, ok := request.PathParameters["userId"]
	if !ok {
		return errorResponse(400, "User ID is required"), nil
	}

	result, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
		},
	})
	if err != nil {
		return errorResponse(500, "Failed to get item"), nil
	}

	if result.Item == nil {
		return errorResponse(404, "User not found"), nil
	}

	var user UserItem
	if err := attributevalue.UnmarshalMap(result.Item, &user); err != nil {
		return errorResponse(500, "Failed to unmarshal item"), nil
	}

	return jsonResponse(200, user), nil
}

func updateItem(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userId, ok := request.PathParameters["userId"]
	if !ok {
		return errorResponse(400, "User ID is required"), nil
	}

	var updates map[string]string
	if err := json.Unmarshal([]byte(request.Body), &updates); err != nil {
		return errorResponse(400, "Invalid request body"), nil
	}

	result, err := dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
		},
		UpdateExpression: aws.String("SET #name = :name, email = :email, updatedAt = :updatedAt"),
		ExpressionAttributeNames: map[string]string{
			"#name": "name",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":name":      &types.AttributeValueMemberS{Value: updates["name"]},
			":email":     &types.AttributeValueMemberS{Value: updates["email"]},
			":updatedAt": &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		return errorResponse(500, "Failed to update item"), nil
	}

	var user UserItem
	if err := attributevalue.UnmarshalMap(result.Attributes, &user); err != nil {
		return errorResponse(500, "Failed to unmarshal item"), nil
	}

	return jsonResponse(200, user), nil
}

func deleteItem(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userId, ok := request.PathParameters["userId"]
	if !ok {
		return errorResponse(400, "User ID is required"), nil
	}

	_, err := dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
		},
	})
	if err != nil {
		return errorResponse(500, "Failed to delete item"), nil
	}

	return jsonResponse(204, nil), nil
}

func jsonResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body := ""
	if data != nil {
		bodyBytes, _ := json.Marshal(data)
		body = string(bodyBytes)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: body,
	}
}

func errorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	return jsonResponse(statusCode, map[string]string{"error": message})
}

func main() {
	lambda.Start(HandleRequest)
}
```

## S3 Event Processing

```go
// cmd/s3-processor/main.go
package main

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var s3Client *s3.Client

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic("unable to load SDK config, " + err.Error())
	}
	s3Client = s3.NewFromConfig(cfg)
}

func HandleS3Event(ctx context.Context, s3Event events.S3Event) error {
	for _, record := range s3Event.Records {
		bucket := record.S3.Bucket.Name
		key := record.S3.Object.Key
		size := record.S3.Object.Size

		fmt.Printf("Processing file: %s from bucket: %s (%d bytes)\n", key, bucket, size)

		// Get object from S3
		result, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
			Bucket: &bucket,
			Key:    &key,
		})
		if err != nil {
			fmt.Printf("Error getting object: %v\n", err)
			return err
		}
		defer result.Body.Close()

		// Read content
		content, err := io.ReadAll(result.Body)
		if err != nil {
			fmt.Printf("Error reading content: %v\n", err)
			return err
		}

		// Process content
		if err := processContent(ctx, bucket, key, content); err != nil {
			fmt.Printf("Error processing content: %v\n", err)
			return err
		}

		fmt.Printf("Successfully processed: %s\n", key)
	}

	return nil
}

func processContent(ctx context.Context, bucket, key string, content []byte) error {
	// Example: Count lines in text file
	lines := strings.Count(string(content), "\n")
	fmt.Printf("File %s has %d lines\n", key, lines)

	// Example processing based on file type
	if strings.HasSuffix(key, ".json") {
		return processJSON(content)
	} else if strings.HasSuffix(key, ".csv") {
		return processCSV(content)
	}

	return nil
}

func processJSON(content []byte) error {
	fmt.Println("Processing JSON file")
	// Parse and process JSON
	return nil
}

func processCSV(content []byte) error {
	fmt.Println("Processing CSV file")
	// Parse and process CSV
	return nil
}

func main() {
	lambda.Start(HandleS3Event)
}
```

## SQS Message Processing

```go
// cmd/sqs-processor/main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type OrderMessage struct {
	OrderID      string `json:"orderId"`
	CustomerID   string `json:"customerId"`
	Items        []Item `json:"items"`
	TotalAmount  float64 `json:"totalAmount"`
}

type Item struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

func HandleSQSEvent(ctx context.Context, sqsEvent events.SQSEvent) error {
	fmt.Printf("Processing %d messages\n", len(sqsEvent.Records))

	for _, record := range sqsEvent.Records {
		if err := processMessage(ctx, record); err != nil {
			fmt.Printf("Error processing message %s: %v\n", record.MessageId, err)
			// Return error to retry or send to DLQ
			return err
		}
	}

	fmt.Println("All messages processed successfully")
	return nil
}

func processMessage(ctx context.Context, record events.SQSMessage) error {
	var order OrderMessage
	if err := json.Unmarshal([]byte(record.Body), &order); err != nil {
		return fmt.Errorf("failed to unmarshal message: %w", err)
	}

	fmt.Printf("Processing order: %s\n", order.OrderID)
	fmt.Printf("Customer: %s, Total: $%.2f\n", order.CustomerID, order.TotalAmount)

	// Business logic here
	if err := processOrder(ctx, order); err != nil {
		return fmt.Errorf("failed to process order: %w", err)
	}

	fmt.Printf("Order %s processed successfully\n", order.OrderID)
	return nil
}

func processOrder(ctx context.Context, order OrderMessage) error {
	// Validate order
	// Update inventory
	// Send confirmation email
	// etc.
	return nil
}

func main() {
	lambda.Start(HandleSQSEvent)
}
```

## Scheduled Events

```go
// cmd/scheduled/main.go
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Report struct {
	Date    string `json:"date"`
	Metrics struct {
		TotalOrders  int     `json:"totalOrders"`
		Revenue      float64 `json:"revenue"`
		NewCustomers int     `json:"newCustomers"`
	} `json:"metrics"`
}

func HandleScheduledEvent(ctx context.Context, event events.CloudWatchEvent) error {
	fmt.Printf("Running scheduled job at: %s\n", time.Now().Format(time.RFC3339))
	fmt.Printf("Event: %+v\n", event)

	report, err := generateDailyReport(ctx)
	if err != nil {
		return fmt.Errorf("failed to generate report: %w", err)
	}

	fmt.Printf("Report generated: %+v\n", report)

	// Send report (email, S3, etc.)
	if err := sendReport(ctx, report); err != nil {
		return fmt.Errorf("failed to send report: %w", err)
	}

	return nil
}

func generateDailyReport(ctx context.Context) (*Report, error) {
	report := &Report{
		Date: time.Now().Format("2006-01-02"),
	}

	// Fetch data from database
	report.Metrics.TotalOrders = 150
	report.Metrics.Revenue = 15000.00
	report.Metrics.NewCustomers = 25

	return report, nil
}

func sendReport(ctx context.Context, report *Report) error {
	// Send to S3, email, etc.
	fmt.Println("Report sent successfully")
	return nil
}

func main() {
	lambda.Start(HandleScheduledEvent)
}
```

## Build Script

```bash
#!/bin/bash
# build.sh

set -e

echo "Building Lambda functions..."

# Build each function
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dist/hello cmd/hello/main.go
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dist/api-hello cmd/api-hello/main.go
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dist/users-api cmd/users-api/main.go
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dist/dynamodb-handler cmd/dynamodb-handler/main.go
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dist/s3-processor cmd/s3-processor/main.go
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o dist/sqs-processor cmd/sqs-processor/main.go

# Zip for deployment
cd dist
for binary in *; do
  zip "${binary}.zip" "${binary}"
done
cd ..

echo "Build complete!"
```

## SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AWS Lambda Go Functions

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: provided.al2
    Architectures:
      - x86_64

Resources:
  HelloFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/hello.zip
      Handler: hello
      Events:
        HelloApi:
          Type: Api
          Properties:
            Path: /hello
            Method: get

  UsersAPIFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/users-api.zip
      Handler: users-api
      Events:
        ListUsers:
          Type: Api
          Properties:
            Path: /users
            Method: get
        GetUser:
          Type: Api
          Properties:
            Path: /users/{id}
            Method: get
        CreateUser:
          Type: Api
          Properties:
            Path: /users
            Method: post

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/'
```

## Deployment

```bash
# Build
chmod +x build.sh
./build.sh

# Deploy with SAM
sam deploy --guided

# Or deploy with AWS CLI
aws lambda create-function \
  --function-name hello-go \
  --runtime provided.al2 \
  --handler hello \
  --zip-file fileb://dist/hello.zip \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role
```

## Testing

```go
// cmd/hello/main_test.go
package main

import (
	"context"
	"testing"
)

func TestHandleRequest(t *testing.T) {
	ctx := context.Background()
	response, err := HandleRequest(ctx, nil)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if response.Message != "Hello from Lambda with Go!" {
		t.Errorf("Expected 'Hello from Lambda with Go!', got '%s'", response.Message)
	}
}
```

```bash
# Run tests
go test ./...

# With coverage
go test -cover ./...
```

## Performance Optimization

```go
// Reuse connections (initialize outside handler)
var (
	dynamoClient *dynamodb.Client
	s3Client     *s3.Client
)

func init() {
	cfg, _ := config.LoadDefaultConfig(context.TODO())
	dynamoClient = dynamodb.NewFromConfig(cfg)
	s3Client = s3.NewFromConfig(cfg)
}

// Use sync.Pool for object reuse
var bufferPool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

func handler() {
	buf := bufferPool.Get().(*bytes.Buffer)
	defer bufferPool.Put(buf)
	buf.Reset()

	// Use buffer
}
```

## Best Practices

1. **Use provided.al2 runtime** for custom Go runtime
2. **Build for Linux AMD64**: `GOOS=linux GOARCH=amd64`
3. **Disable CGO**: `CGO_ENABLED=0` for static binaries
4. **Initialize SDK clients outside handler** to reuse connections
5. **Use context properly** for cancellation and timeouts
6. **Handle errors gracefully** with proper logging
7. **Keep binaries small** - only include necessary dependencies
8. **Use structured logging** with JSON format
