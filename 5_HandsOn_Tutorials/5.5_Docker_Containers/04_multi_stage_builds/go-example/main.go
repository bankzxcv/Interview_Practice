package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

type Response struct {
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
	Host      string    `json:"host"`
}

type HealthResponse struct {
	Status string `json:"status"`
	Uptime string `json:"uptime"`
}

var startTime = time.Now()

func homeHandler(w http.ResponseWriter, r *http.Request) {
	response := Response{
		Message:   "Hello from Go Multi-Stage Build!",
		Timestamp: time.Now(),
		Version:   getEnv("APP_VERSION", "1.0.0"),
		Host:      getHostname(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(startTime).String()

	response := HealthResponse{
		Status: "healthy",
		Uptime: uptime,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return hostname
}

func main() {
	port := getEnv("PORT", "8080")

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/health", healthHandler)

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
