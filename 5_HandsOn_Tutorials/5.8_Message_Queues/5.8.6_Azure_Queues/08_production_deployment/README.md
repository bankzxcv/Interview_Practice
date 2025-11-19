# Tutorial 08: Production Deployment and Monitoring

## Overview

This tutorial covers production-ready deployment of Azure messaging services using Infrastructure as Code (IaC), monitoring, security, high availability, and cost optimization. Learn to deploy robust, scalable messaging infrastructure for enterprise applications.

**Topics Covered**:
- ARM templates and Bicep
- Geo-disaster recovery
- Premium tier features
- Azure Monitor and metrics
- Application Insights integration
- Managed Identity security
- Cost optimization
- Best practices

## Architecture (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Subscription                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Primary Region (East US)                  │    │
│  │                                                        │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │  Service Bus Premium Namespace               │     │    │
│  │  │  - VNet Integration                          │     │    │
│  │  │  - Private Endpoints                         │     │    │
│  │  │  - Managed Identity                          │     │    │
│  │  │  - Geo-DR Pairing                            │◄────┼────┼─┐
│  │  └──────────────────────────────────────────────┘     │    │ │
│  │                                                        │    │ │
│  │  ┌──────────────────────────────────────────────┐     │    │ │
│  │  │  Application Insights                        │     │    │ │
│  │  │  - Monitoring & Logging                      │     │    │ │
│  │  │  - Alerts & Metrics                          │     │    │ │
│  │  └──────────────────────────────────────────────┘     │    │ │
│  └────────────────────────────────────────────────────────┘    │ │
│                                                                 │ │
│  ┌────────────────────────────────────────────────────────┐    │ │
│  │           Secondary Region (West US) - DR              │    │ │
│  │                                                        │    │ │
│  │  ┌──────────────────────────────────────────────┐     │    │ │
│  │  │  Service Bus Premium Namespace (Paired)      │     │    │ │
│  │  │  - Metadata replication                      │◄────┼────┘ │
│  │  │  - Automatic failover                        │     │      │
│  │  └──────────────────────────────────────────────┘     │      │
│  └────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Part 1: Infrastructure as Code

### Bicep Template - Service Bus Namespace

```bicep
// servicebus.bicep
@description('Name of the Service Bus namespace')
param namespaceName string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Pricing tier (Basic, Standard, Premium)')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param sku string = 'Standard'

@description('Enable zone redundancy (Premium only)')
param zoneRedundant bool = false

@description('Messaging units (Premium only, 1-16)')
@minValue(1)
@maxValue(16)
param capacity int = 1

@description('Tags for resources')
param tags object = {
  environment: 'production'
  project: 'messaging'
}

// Service Bus Namespace
resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
    capacity: sku == 'Premium' ? capacity : null
  }
  properties: {
    zoneRedundant: sku == 'Premium' ? zoneRedundant : false
    disableLocalAuth: false // Set to true to require Managed Identity
  }
}

// Queue
resource queue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'orders'
  properties: {
    lockDuration: 'PT1M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    requiresSession: false
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 10
    enableBatchedOperations: true
  }
}

// Topic
resource topic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'events'
  properties: {
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: true
    enableBatchedOperations: true
  }
}

// Subscription
resource subscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: topic
  name: 'all-events'
  properties: {
    lockDuration: 'PT1M'
    requiresSession: false
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
  }
}

// Outputs
output namespaceId string = serviceBusNamespace.id
output namespaceName string = serviceBusNamespace.name
output primaryConnectionString string = listKeys('${serviceBusNamespace.id}/AuthorizationRules/RootManageSharedAccessKey', serviceBusNamespace.apiVersion).primaryConnectionString
```

### Bicep Template - Storage Account

```bicep
// storage.bicep
@description('Storage account name')
param storageAccountName string

@description('Location')
param location string = resourceGroup().location

@description('Storage account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_ZRS'
])
param sku string = 'Standard_LRS'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: sku
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

// Queue Service
resource queueService 'Microsoft.Storage/storageAccounts/queueServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

// Queue
resource queue 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-01-01' = {
  parent: queueService
  name: 'orders'
  properties: {
    metadata: {
      environment: 'production'
    }
  }
}

output storageAccountId string = storageAccount.id
output primaryEndpoints object = storageAccount.properties.primaryEndpoints
```

### Bicep Parameters File

```json
// parameters.prod.json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "namespaceName": {
      "value": "sb-prod-messaging"
    },
    "location": {
      "value": "eastus"
    },
    "sku": {
      "value": "Premium"
    },
    "zoneRedundant": {
      "value": true
    },
    "capacity": {
      "value": 2
    },
    "tags": {
      "value": {
        "environment": "production",
        "project": "messaging",
        "owner": "platform-team"
      }
    }
  }
}
```

### Deploy with Bicep

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-ID"

# Create resource group
az group create \
  --name rg-prod-messaging \
  --location eastus

# Deploy Bicep template
az deployment group create \
  --resource-group rg-prod-messaging \
  --template-file servicebus.bicep \
  --parameters parameters.prod.json

# Get outputs
az deployment group show \
  --resource-group rg-prod-messaging \
  --name servicebus \
  --query properties.outputs
```

## Part 2: Geo-Disaster Recovery

### Setup Geo-DR Pairing

```bash
# Variables
PRIMARY_NAMESPACE="sb-prod-east"
SECONDARY_NAMESPACE="sb-prod-west"
ALIAS="sb-prod-messaging"
RESOURCE_GROUP="rg-prod-messaging"

# Create primary namespace (East US)
az servicebus namespace create \
  --name $PRIMARY_NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --location eastus \
  --sku Premium \
  --capacity 1

# Create secondary namespace (West US)
az servicebus namespace create \
  --name $SECONDARY_NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --location westus \
  --sku Premium \
  --capacity 1

# Create Geo-DR pairing
az servicebus georecovery-alias create \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $PRIMARY_NAMESPACE \
  --alias $ALIAS \
  --partner-namespace $(az servicebus namespace show \
    --name $SECONDARY_NAMESPACE \
    --resource-group $RESOURCE_GROUP \
    --query id -o tsv)

# Check pairing status
az servicebus georecovery-alias show \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $PRIMARY_NAMESPACE \
  --alias $ALIAS \
  --query "{status:provisioningState, role:role}"
```

### Bicep Template - Geo-DR

```bicep
// geodr.bicep
param primaryNamespaceName string
param secondaryNamespaceName string
param aliasName string
param primaryLocation string = 'eastus'
param secondaryLocation string = 'westus'

// Primary namespace
resource primaryNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: primaryNamespaceName
  location: primaryLocation
  sku: {
    name: 'Premium'
    tier: 'Premium'
    capacity: 1
  }
  properties: {
    zoneRedundant: true
  }
}

// Secondary namespace
resource secondaryNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: secondaryNamespaceName
  location: secondaryLocation
  sku: {
    name: 'Premium'
    tier: 'Premium'
    capacity: 1
  }
  properties: {
    zoneRedundant: true
  }
}

// Geo-DR alias
resource geoRecoveryAlias 'Microsoft.ServiceBus/namespaces/disasterRecoveryConfigs@2022-10-01-preview' = {
  parent: primaryNamespace
  name: aliasName
  properties: {
    partnerNamespace: secondaryNamespace.id
  }
}

output aliasConnectionString string = listKeys('${primaryNamespace.id}/disasterRecoveryConfigs/${aliasName}/AuthorizationRules/RootManageSharedAccessKey', primaryNamespace.apiVersion).primaryConnectionString
```

### Failover Management

```python
# geodr_management.py
from azure.mgmt.servicebus import ServiceBusManagementClient
from azure.identity import DefaultAzureCredential
import os

SUBSCRIPTION_ID = os.getenv("AZURE_SUBSCRIPTION_ID")
RESOURCE_GROUP = "rg-prod-messaging"
PRIMARY_NAMESPACE = "sb-prod-east"
ALIAS_NAME = "sb-prod-messaging"

def check_georecovery_status():
    """Check Geo-DR status"""
    credential = DefaultAzureCredential()
    client = ServiceBusManagementClient(credential, SUBSCRIPTION_ID)

    alias = client.disaster_recovery_configs.get(
        resource_group_name=RESOURCE_GROUP,
        namespace_name=PRIMARY_NAMESPACE,
        alias=ALIAS_NAME
    )

    print(f"Alias: {alias.name}")
    print(f"Role: {alias.role}")  # Primary or Secondary
    print(f"Provisioning State: {alias.provisioning_state}")
    print(f"Partner Namespace: {alias.partner_namespace}")

def initiate_failover():
    """Initiate failover to secondary region"""
    credential = DefaultAzureCredential()
    client = ServiceBusManagementClient(credential, SUBSCRIPTION_ID)

    print("Initiating failover...")
    print("WARNING: This will make secondary namespace primary")

    # Break pairing (fails over to secondary)
    client.disaster_recovery_configs.fail_over(
        resource_group_name=RESOURCE_GROUP,
        namespace_name=PRIMARY_NAMESPACE,
        alias=ALIAS_NAME
    )

    print("Failover initiated")
    print("Applications should now connect to former secondary namespace")

if __name__ == "__main__":
    check_georecovery_status()
    # Uncomment to test failover
    # initiate_failover()
```

## Part 3: Premium Tier Features

### Premium Tier Benefits

```yaml
Premium Tier Features:
  - Messaging Units: 1, 2, 4, 8, or 16 MUs
  - Throughput: 1000 msg/sec per MU
  - Storage: 1 GB per MU
  - Zone Redundancy: Available
  - VNet Integration: Private endpoints
  - Geo-DR: Metadata replication
  - Larger Messages: Up to 1 MB
  - Predictable Performance: Isolated resources
  - No operation charges: Fixed monthly cost

Cost Comparison:
  Standard: $10/month base + $0.05 per million operations
  Premium: $677/month per MU (all-inclusive)

When to use Premium:
  - High throughput (>100 msg/sec)
  - Predictable costs
  - VNet integration required
  - Geo-DR needed
  - Compliance requirements
```

### VNet Integration

```bicep
// vnet-integration.bicep
param namespaceName string
param vnetName string
param subnetName string
param location string = resourceGroup().location

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.0.1.0/24'
          serviceEndpoints: [
            {
              service: 'Microsoft.ServiceBus'
            }
          ]
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

// Premium Service Bus
resource namespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  sku: {
    name: 'Premium'
    tier: 'Premium'
    capacity: 1
  }
  properties: {
    zoneRedundant: true
    publicNetworkAccess: 'Disabled'
  }
}

// Private Endpoint
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: '${namespaceName}-pe'
  location: location
  properties: {
    subnet: {
      id: vnet.properties.subnets[0].id
    }
    privateLinkServiceConnections: [
      {
        name: '${namespaceName}-plsc'
        properties: {
          privateLinkServiceId: namespace.id
          groupIds: [
            'namespace'
          ]
        }
      }
    ]
  }
}
```

## Part 4: Security with Managed Identity

### Managed Identity Setup

```bicep
// managed-identity.bicep
param namespaceName string
param functionAppName string
param location string = resourceGroup().location

// Service Bus Namespace
resource namespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    disableLocalAuth: true // Require Managed Identity
  }
}

// Function App with System-Assigned Managed Identity
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    // Function app properties
  }
}

// Role Assignment (Azure Service Bus Data Owner)
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(namespace.id, functionApp.id, 'ServiceBusDataOwner')
  scope: namespace
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '090c5cfd-751d-490a-894a-3ce6f1109419')
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

### Python Code with Managed Identity

```python
# managed_identity_client.py
from azure.servicebus import ServiceBusClient
from azure.identity import DefaultAzureCredential
import json

NAMESPACE_FQDN = "sb-prod-messaging.servicebus.windows.net"
QUEUE_NAME = "orders"

def create_client_with_managed_identity():
    """Create Service Bus client using Managed Identity"""
    # DefaultAzureCredential automatically uses:
    # - Managed Identity in Azure
    # - Azure CLI locally
    # - Environment variables
    credential = DefaultAzureCredential()

    client = ServiceBusClient(
        fully_qualified_namespace=NAMESPACE_FQDN,
        credential=credential
    )

    return client

def send_message_with_mi():
    """Send message using Managed Identity"""
    client = create_client_with_managed_identity()

    with client:
        sender = client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            message = json.dumps({
                "order_id": "ORD-001",
                "amount": 99.99
            })

            sender.send_message(message)
            print("Message sent using Managed Identity")

if __name__ == "__main__":
    send_message_with_mi()
```

## Part 5: Monitoring and Alerting

### Application Insights Integration

```python
# app_insights_logging.py
from opencensus.ext.azure import metrics_exporter
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace.samplers import ProbabilitySampler
from opencensus.trace.tracer import Tracer
import logging
import os

INSTRUMENTATION_KEY = os.getenv("APPINSIGHTS_INSTRUMENTATION_KEY")

# Configure logging
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string=f'InstrumentationKey={INSTRUMENTATION_KEY}'
))
logger.setLevel(logging.INFO)

# Configure tracing
tracer = Tracer(
    exporter=AzureExporter(
        connection_string=f'InstrumentationKey={INSTRUMENTATION_KEY}'
    ),
    sampler=ProbabilitySampler(1.0)
)

def process_message_with_monitoring(message):
    """Process message with Application Insights monitoring"""
    with tracer.span(name="process_message"):
        # Log message processing
        logger.info(
            "Processing message",
            extra={
                'custom_dimensions': {
                    'message_id': message.message_id,
                    'delivery_count': message.delivery_count
                }
            }
        )

        try:
            # Process message
            result = process(message)

            # Log success
            logger.info("Message processed successfully")

            return result

        except Exception as e:
            # Log failure
            logger.error(
                f"Message processing failed: {e}",
                extra={
                    'custom_dimensions': {
                        'message_id': message.message_id,
                        'error': str(e)
                    }
                }
            )
            raise

def process(message):
    """Actual message processing"""
    import time
    time.sleep(0.1)
    return {"status": "success"}
```

### Azure Monitor Alerts

```bash
# Create alert for dead letter queue
az monitor metrics alert create \
  --name "high-deadletter-count" \
  --resource-group rg-prod-messaging \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-prod-messaging/providers/Microsoft.ServiceBus/namespaces/$NAMESPACE" \
  --condition "avg DeadletteredMessages > 10" \
  --description "Alert when dead letter queue exceeds 10 messages" \
  --evaluation-frequency 5m \
  --window-size 15m \
  --severity 2

# Create alert for processing latency
az monitor metrics alert create \
  --name "high-processing-time" \
  --resource-group rg-prod-messaging \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-prod-messaging/providers/Microsoft.ServiceBus/namespaces/$NAMESPACE" \
  --condition "avg ServerSendLatency > 1000" \
  --description "Alert when send latency exceeds 1 second" \
  --evaluation-frequency 5m \
  --window-size 15m \
  --severity 3
```

### Custom Metrics Dashboard

```python
# custom_metrics.py
from opencensus.stats import aggregation as aggregation_module
from opencensus.stats import measure as measure_module
from opencensus.stats import stats as stats_module
from opencensus.stats import view as view_module
from opencensus.ext.azure import metrics_exporter
import time

# Create measures
message_count_measure = measure_module.MeasureInt(
    "messages_processed",
    "Number of messages processed",
    "messages"
)

processing_time_measure = measure_module.MeasureFloat(
    "processing_time",
    "Message processing time",
    "ms"
)

# Create views
message_count_view = view_module.View(
    "messages_processed_view",
    "Total messages processed",
    [],
    message_count_measure,
    aggregation_module.CountAggregation()
)

processing_time_view = view_module.View(
    "processing_time_view",
    "Average processing time",
    [],
    processing_time_measure,
    aggregation_module.LastValueAggregation()
)

# Register views
stats = stats_module.stats
view_manager = stats.view_manager
view_manager.register_view(message_count_view)
view_manager.register_view(processing_time_view)

# Export to Application Insights
exporter = metrics_exporter.new_metrics_exporter(
    connection_string=f'InstrumentationKey={INSTRUMENTATION_KEY}'
)
view_manager.register_exporter(exporter)

def track_message_processing(message):
    """Track custom metrics"""
    start_time = time.time()

    # Process message
    process_message(message)

    # Record metrics
    duration = (time.time() - start_time) * 1000  # ms
    mmap = stats.stats_recorder.new_measurement_map()
    mmap.measure_int_put(message_count_measure, 1)
    mmap.measure_float_put(processing_time_measure, duration)
    mmap.record()
```

## Part 6: Cost Optimization

### Cost Analysis

```python
# cost_analysis.py
from azure.mgmt.costmanagement import CostManagementClient
from azure.identity import DefaultAzureCredential
from datetime import datetime, timedelta

def analyze_servicebus_costs():
    """Analyze Service Bus costs"""
    credential = DefaultAzureCredential()
    client = CostManagementClient(credential)

    # Define time period
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    # Query costs
    scope = f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/rg-prod-messaging"

    query = {
        "type": "Usage",
        "timeframe": "Custom",
        "time_period": {
            "from": start_date.isoformat(),
            "to": end_date.isoformat()
        },
        "dataset": {
            "granularity": "Daily",
            "aggregation": {
                "totalCost": {
                    "name": "Cost",
                    "function": "Sum"
                }
            },
            "grouping": [
                {
                    "type": "Dimension",
                    "name": "ResourceType"
                }
            ],
            "filter": {
                "dimensions": {
                    "name": "ResourceType",
                    "operator": "In",
                    "values": [
                        "microsoft.servicebus/namespaces"
                    ]
                }
            }
        }
    }

    result = client.query.usage(scope, query)

    print("Service Bus Costs (Last 30 days):")
    for row in result.rows:
        print(f"  Date: {row[0]}, Cost: ${row[1]:.2f}")
```

### Optimization Strategies

```yaml
Cost Optimization Strategies:

1. Right-size Premium Capacity:
   - Monitor throughput metrics
   - Scale messaging units based on load
   - Start with 1 MU, scale up as needed

2. Use Standard for Low Volume:
   - < 100 msg/sec: Use Standard tier
   - Pay-per-operation more cost-effective

3. Message Size Optimization:
   - Keep messages small (< 64 KB for Queue Storage)
   - Store large data in Blob, reference in message
   - Reduces storage and transfer costs

4. Batch Operations:
   - Send/receive in batches
   - Reduces operation count
   - Improves throughput

5. Message TTL:
   - Set appropriate TTL
   - Remove expired messages automatically
   - Reduces storage costs

6. Dead Letter Management:
   - Monitor and clean up DLQ regularly
   - Avoid accumulating messages
   - Set up automated cleanup

7. Reserved Capacity:
   - Consider reserved capacity for Premium
   - Up to 65% savings with 1-year commitment

8. Shared Access Policies:
   - Create granular SAS policies
   - Avoid using RootManageSharedAccessKey
   - Limit permissions to minimum required
```

## Part 7: High Availability Checklist

### Production Readiness Checklist

```yaml
Infrastructure:
  ☐ Use Premium tier for mission-critical workloads
  ☐ Enable zone redundancy
  ☐ Configure Geo-DR for disaster recovery
  ☐ Use VNet integration for network isolation
  ☐ Set up private endpoints

Security:
  ☐ Use Managed Identity (disable local auth)
  ☐ Implement RBAC with least privilege
  ☐ Enable TLS 1.2+ only
  ☐ Use Azure Key Vault for secrets
  ☐ Configure network security groups
  ☐ Enable diagnostic logs

Reliability:
  ☐ Configure dead letter queues
  ☐ Set appropriate max delivery count (3-10)
  ☐ Implement retry logic with exponential backoff
  ☐ Use duplicate detection
  ☐ Enable sessions for FIFO requirements
  ☐ Set message TTL appropriately

Monitoring:
  ☐ Enable Application Insights
  ☐ Configure Azure Monitor alerts
  ☐ Set up dead letter queue monitoring
  ☐ Track processing latency
  ☐ Monitor queue depth
  ☐ Set up custom dashboards
  ☐ Configure log analytics

Performance:
  ☐ Use batch operations
  ☐ Enable prefetch for high throughput
  ☐ Reuse client connections
  ☐ Use async operations
  ☐ Optimize message size
  ☐ Configure appropriate lock duration

Cost Management:
  ☐ Right-size Premium capacity
  ☐ Monitor cost trends
  ☐ Set up cost alerts
  ☐ Clean up unused resources
  ☐ Implement message lifecycle policies

Documentation:
  ☐ Document architecture
  ☐ Create runbooks for operations
  ☐ Document failover procedures
  ☐ Maintain disaster recovery plan
  ☐ Document security policies
```

## Part 8: Operational Runbooks

### Runbook: Handle High Dead Letter Count

```bash
#!/bin/bash
# runbook_dlq_investigation.sh

echo "=== Dead Letter Queue Investigation ==="

NAMESPACE="sb-prod-messaging"
QUEUE="orders"
RESOURCE_GROUP="rg-prod-messaging"

# 1. Check DLQ count
echo "1. Checking DLQ count..."
DLQ_COUNT=$(az servicebus queue show \
  --name $QUEUE \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --query "countDetails.deadLetterMessageCount" \
  -o tsv)

echo "Dead letter count: $DLQ_COUNT"

# 2. If count > threshold, investigate
if [ "$DLQ_COUNT" -gt 10 ]; then
    echo "⚠️  High DLQ count detected!"

    # 3. Check common reasons
    echo "2. Common causes to investigate:"
    echo "   - Check Application Insights for errors"
    echo "   - Review recent code deployments"
    echo "   - Check external service availability"
    echo "   - Verify message format changes"

    # 4. Sample DLQ messages
    echo "3. Sampling DLQ messages (use Python script)..."
    python3 - << EOF
from azure.servicebus import ServiceBusClient
import os

CONNECTION_STRING = os.getenv("SERVICEBUS_CONNECTION_STRING")
client = ServiceBusClient.from_connection_string(CONNECTION_STRING)

with client:
    receiver = client.get_queue_receiver(
        queue_name="$QUEUE",
        sub_queue="deadletter"
    )
    with receiver:
        messages = receiver.peek_messages(max_message_count=5)
        for msg in messages:
            print(f"Message ID: {msg.id}")
            print(f"Reason: {msg.dead_letter_reason}")
            print(f"Error: {msg.dead_letter_error_description}")
            print("---")
EOF

    # 5. Notify team
    echo "4. Notifying operations team..."
    # Send alert via email, Slack, PagerDuty, etc.

fi
```

### Runbook: Geo-DR Failover

```bash
#!/bin/bash
# runbook_geodr_failover.sh

echo "=== Geo-DR Failover Procedure ==="

PRIMARY_NAMESPACE="sb-prod-east"
ALIAS="sb-prod-messaging"
RESOURCE_GROUP="rg-prod-messaging"

# 1. Verify current status
echo "1. Checking current Geo-DR status..."
az servicebus georecovery-alias show \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $PRIMARY_NAMESPACE \
  --alias $ALIAS

# 2. Confirm failover
read -p "Are you sure you want to initiate failover? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Failover cancelled"
    exit 0
fi

# 3. Initiate failover
echo "2. Initiating failover..."
az servicebus georecovery-alias fail-over \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $PRIMARY_NAMESPACE \
  --alias $ALIAS

# 4. Wait for completion
echo "3. Waiting for failover to complete..."
sleep 30

# 5. Verify new primary
echo "4. Verifying failover..."
az servicebus georecovery-alias show \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $PRIMARY_NAMESPACE \
  --alias $ALIAS

# 6. Notify team
echo "5. Failover complete. Notify team to update connections."
echo "   New primary namespace is now active."
```

## Cleanup

```bash
# Delete resource group (removes all resources)
az group delete \
  --name rg-prod-messaging \
  --yes \
  --no-wait
```

## Key Takeaways

- ✅ Use Bicep/ARM for Infrastructure as Code
- ✅ Enable Geo-DR for disaster recovery
- ✅ Premium tier for production workloads
- ✅ Implement Managed Identity for security
- ✅ Monitor with Application Insights
- ✅ Set up comprehensive alerting
- ✅ Optimize costs based on usage patterns
- ✅ Document operational procedures
- ✅ Test failover procedures regularly
- ✅ Implement proper error handling
- ✅ Use zone redundancy for high availability
- ✅ Create operational runbooks

## Additional Resources

### Documentation
- [Azure Service Bus Documentation](https://docs.microsoft.com/en-us/azure/service-bus-messaging/)
- [Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure Monitor Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/)

### Tools
- [Azure Service Bus Explorer](https://github.com/paolosalvatori/ServiceBusExplorer)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/)
- [Azure PowerShell](https://docs.microsoft.com/en-us/powershell/azure/)

### Best Practices
- [Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)
- [Azure Security Baseline](https://docs.microsoft.com/en-us/security/benchmark/azure/)

---

**Congratulations!** You've completed all 8 Azure Queue Services tutorials. You now have the knowledge to:
- ✅ Design and implement Azure messaging solutions
- ✅ Choose the right service for your use case
- ✅ Deploy production-ready infrastructure
- ✅ Monitor and troubleshoot messaging systems
- ✅ Implement security best practices
- ✅ Optimize costs and performance
- ✅ Handle disaster recovery scenarios
- ✅ Build event-driven architectures
