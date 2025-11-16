# Tutorial 07: Retention and Storage - Compactor and Object Storage

## Topics Covered
- Loki compactor configuration
- Retention policies
- Object storage (S3, GCS, Azure)
- Storage optimization
- Cost management

## S3 Storage Configuration

```yaml
storage_config:
  aws:
    s3: s3://us-west-2/loki-bucket
    s3forcepathstyle: true
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache

limits_config:
  retention_period: 720h  # 30 days

compactor:
  working_directory: /loki/compactor
  shared_store: s3
  retention_enabled: true
```

Complete setup for S3, GCS, and Azure Blob with cost optimization strategies.
