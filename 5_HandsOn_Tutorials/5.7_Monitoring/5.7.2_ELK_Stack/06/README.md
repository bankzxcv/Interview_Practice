# Tutorial 06: Index Management - ILM, Templates, and Optimization

## Learning Objectives
- Implement Index Lifecycle Management (ILM)
- Create and manage index templates
- Configure retention policies
- Optimize index performance
- Manage index rollover

## Index Lifecycle Management (ILM)

ILM automates index management through phases:
- **Hot**: Actively writing and querying
- **Warm**: No longer writing, still querying
- **Cold**: Rarely queried, compressed
- **Frozen**: Very rarely queried, searchable snapshot
- **Delete**: Remove index

## Step 1: Create ILM Policy

```json
PUT _ilm/policy/logs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb",
            "max_docs": 10000000
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "forcemerge": {
            "max_num_segments": 1
          },
          "shrink": {
            "number_of_shards": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {},
          "allocate": {
            "require": {
              "data": "cold"
            }
          },
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## Step 2: Index Templates

```json
PUT _index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "index.lifecycle.name": "logs_policy",
      "index.lifecycle.rollover_alias": "logs",
      "refresh_interval": "30s",
      "codec": "best_compression"
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "level": {
          "type": "keyword"
        },
        "message": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "service": {
          "type": "keyword"
        },
        "host": {
          "properties": {
            "name": {"type": "keyword"},
            "ip": {"type": "ip"}
          }
        },
        "duration_ms": {
          "type": "long"
        },
        "status_code": {
          "type": "integer"
        },
        "user_id": {
          "type": "keyword"
        },
        "geo": {
          "properties": {
            "location": {"type": "geo_point"}
          }
        }
      }
    }
  },
  "priority": 500,
  "composed_of": [],
  "version": 1,
  "_meta": {
    "description": "Template for application logs"
  }
}
```

## Step 3: Create Bootstrap Index

```json
PUT logs-000001
{
  "aliases": {
    "logs": {
      "is_write_index": true
    }
  }
}
```

## Step 4: Component Templates

```json
PUT _component_template/logs_settings
{
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "refresh_interval": "30s"
    }
  }
}

PUT _component_template/logs_mappings
{
  "template": {
    "mappings": {
      "properties": {
        "@timestamp": {"type": "date"},
        "level": {"type": "keyword"},
        "message": {"type": "text"}
      }
    }
  }
}

PUT _index_template/composed_logs_template
{
  "index_patterns": ["logs-*"],
  "composed_of": ["logs_settings", "logs_mappings"],
  "priority": 500
}
```

## Step 5: Data Stream Configuration

```json
PUT _index_template/logs_data_stream
{
  "index_patterns": ["logs-*"],
  "data_stream": {},
  "template": {
    "settings": {
      "index.lifecycle.name": "logs_policy"
    },
    "mappings": {
      "properties": {
        "@timestamp": {"type": "date"}
      }
    }
  }
}

# Create data stream
PUT _data_stream/logs-default

# Index to data stream
POST logs-default/_doc
{
  "@timestamp": "2024-01-15T10:30:00Z",
  "message": "Test log"
}
```

## Step 6: Rollover API

```json
# Manual rollover
POST /logs/_rollover
{
  "conditions": {
    "max_age": "7d",
    "max_docs": 1000000,
    "max_size": "50gb"
  }
}

# Check rollover status
GET logs-*/_ilm/explain
```

## Step 7: Index Settings Optimization

### For Write-Heavy Indices

```json
PUT logs-write-heavy/_settings
{
  "index": {
    "refresh_interval": "30s",
    "number_of_replicas": 0,
    "translog": {
      "durability": "async",
      "sync_interval": "30s"
    }
  }
}
```

### For Search-Heavy Indices

```json
PUT logs-search-heavy/_settings
{
  "index": {
    "number_of_replicas": 2,
    "refresh_interval": "1s",
    "priority": 100
  }
}
```

## Step 8: Shard Sizing

```json
# Optimal shard size: 10-50GB
# Calculate shards needed
{
  "daily_data": "100GB",
  "target_shard_size": "30GB",
  "shards_needed": 4
}

PUT _index_template/optimal_shards
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 4,
      "number_of_replicas": 1
    }
  }
}
```

## Step 9: Force Merge

```json
# Force merge to 1 segment (for old indices)
POST logs-2024.01.01/_forcemerge?max_num_segments=1

# Check segments
GET logs-2024.01.01/_segments
```

## Step 10: Monitoring Index Health

```bash
# Cluster health
GET _cluster/health?filter_path=status,*_shards

# Index stats
GET logs-*/_stats

# Index settings
GET logs-*/_settings

# Shard allocation
GET _cat/shards/logs-*?v

# Disk usage
GET _cat/allocation?v

# Index size
GET _cat/indices/logs-*?v&h=index,docs.count,store.size,pri,rep

# ILM status
GET logs-*/_ilm/explain
```

## Step 11: Curator for Old Versions

```yaml
# curator_config.yml
client:
  hosts:
    - elasticsearch
  port: 9200

# curator_actions.yml
actions:
  1:
    action: delete_indices
    description: Delete logs older than 90 days
    options:
      ignore_empty_list: True
    filters:
    - filtertype: pattern
      kind: prefix
      value: logs-
    - filtertype: age
      source: name
      direction: older
      timestring: '%Y.%m.%d'
      unit: days
      unit_count: 90

  2:
    action: forcemerge
    description: Force merge old indices
    options:
      max_num_segments: 1
    filters:
    - filtertype: age
      source: name
      direction: older
      timestring: '%Y.%m.%d'
      unit: days
      unit_count: 7
```

## Step 12: Index Aliases

```json
# Create alias
POST _aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-2024.01.15",
        "alias": "logs-current"
      }
    }
  ]
}

# Filtered alias
POST _aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-*",
        "alias": "logs-errors",
        "filter": {
          "term": {
            "level": "ERROR"
          }
        }
      }
    }
  ]
}

# Routing alias
POST _aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-*",
        "alias": "logs-api",
        "routing": "api",
        "search_routing": "api,web"
      }
    }
  ]
}
```

## Step 13: Snapshot and Restore

```json
# Register repository
PUT _snapshot/backup_repository
{
  "type": "fs",
  "settings": {
    "location": "/mount/backups",
    "compress": true
  }
}

# Create snapshot
PUT _snapshot/backup_repository/snapshot_1
{
  "indices": "logs-*",
  "ignore_unavailable": true,
  "include_global_state": false
}

# Restore snapshot
POST _snapshot/backup_repository/snapshot_1/_restore
{
  "indices": "logs-2024.01.*",
  "ignore_unavailable": true,
  "include_global_state": false
}

# Snapshot lifecycle policy
PUT _slm/policy/daily_snapshots
{
  "schedule": "0 1 * * *",
  "name": "<daily-snap-{now/d}>",
  "repository": "backup_repository",
  "config": {
    "indices": ["logs-*"],
    "ignore_unavailable": true,
    "include_global_state": false
  },
  "retention": {
    "expire_after": "30d",
    "min_count": 5,
    "max_count": 50
  }
}
```

## Step 14: Performance Best Practices

### 1. Bulk Indexing

```python
from elasticsearch import Elasticsearch, helpers

es = Elasticsearch(['http://localhost:9200'])

actions = [
    {
        "_index": "logs",
        "_source": {
            "@timestamp": "2024-01-15T10:30:00Z",
            "message": f"Log message {i}"
        }
    }
    for i in range(10000)
]

helpers.bulk(es, actions, chunk_size=500, request_timeout=30)
```

### 2. Disable Refresh During Bulk

```json
PUT logs/_settings
{
  "index": {
    "refresh_interval": "-1"
  }
}

# Do bulk indexing...

# Re-enable refresh
PUT logs/_settings
{
  "index": {
    "refresh_interval": "30s"
  }
}

# Explicit refresh
POST logs/_refresh
```

### 3. Use _source Filtering

```json
GET logs/_search
{
  "_source": ["@timestamp", "level", "message"],
  "query": {
    "match_all": {}
  }
}
```

## Exercises

1. **Create ILM Policy**: Implement hot-warm-cold-delete policy
2. **Index Template**: Build template with optimized settings
3. **Data Stream**: Set up data stream for time-series data
4. **Force Merge**: Optimize old indices
5. **Snapshot**: Configure automated backups

## Key Takeaways

- ✅ ILM automates index lifecycle
- ✅ Templates ensure consistent configuration
- ✅ Proper shard sizing critical for performance
- ✅ Rollover prevents indices from getting too large
- ✅ Force merge optimizes search performance
- ✅ Snapshots essential for disaster recovery

## Next Steps

Continue to **Tutorial 07: Alerting** to learn about:
- ElastAlert configuration
- Kibana alerting
- Watcher (X-Pack)
- Alert routing and notifications

## Additional Resources

- [ILM Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)
- [Index Templates](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-templates.html)
- [Data Streams](https://www.elastic.co/guide/en/elasticsearch/reference/current/data-streams.html)
- [Performance Tuning](https://www.elastic.co/guide/en/elasticsearch/reference/current/tune-for-indexing-speed.html)
