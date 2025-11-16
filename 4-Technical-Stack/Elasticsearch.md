# Elasticsearch Cheatsheet - Quick Reference

Distributed search and analytics engine.

---

## Basics

```bash
# Index document
PUT /users/_doc/1
{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}

# Get document
GET /users/_doc/1

# Update
POST /users/_update/1
{
  "doc": {
    "age": 31
  }
}

# Delete
DELETE /users/_doc/1

# Search
GET /users/_search
{
  "query": {
    "match": {
      "name": "John"
    }
  }
}

# Bulk operations
POST /_bulk
{"index":{"_index":"users","_id":"1"}}
{"name":"Alice","age":25}
{"index":{"_index":"users","_id":"2"}}
{"name":"Bob","age":30}
```

## Queries

```json
// Match query
{
  "query": {
    "match": {
      "title": "elasticsearch"
    }
  }
}

// Multi-match
{
  "query": {
    "multi_match": {
      "query": "search",
      "fields": ["title", "content"]
    }
  }
}

// Bool query (AND, OR, NOT)
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "elasticsearch" } }
      ],
      "filter": [
        { "range": { "age": { "gte": 18 } } }
      ],
      "must_not": [
        { "match": { "status": "deleted" } }
      ],
      "should": [
        { "match": { "tags": "featured" } }
      ]
    }
  }
}

// Aggregations
{
  "aggs": {
    "age_groups": {
      "range": {
        "field": "age",
        "ranges": [
          { "to": 18 },
          { "from": 18, "to": 65 },
          { "from": 65 }
        ]
      }
    },
    "avg_age": {
      "avg": { "field": "age" }
    }
  }
}
```

## Mappings & Settings

```json
PUT /users
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 2
  },
  "mappings": {
    "properties": {
      "name": { "type": "text" },
      "age": { "type": "integer" },
      "email": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

---

**Last updated:** 2025-11-15
