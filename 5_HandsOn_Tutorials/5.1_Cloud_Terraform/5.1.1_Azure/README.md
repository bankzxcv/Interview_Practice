# 5.1.1 Azure with Terraform - Incremental Learning Path

## Overview

15 hands-on tutorials that build Azure infrastructure incrementally. Each tutorial adds 1-2 new concepts, reinforcing previous knowledge while expanding your skills.

## Prerequisites

```bash
# Install Azure CLI
brew install azure-cli  # macOS
# or download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Install Terraform
brew install terraform  # macOS
# or download from: https://www.terraform.io/downloads

# Login to Azure
az login

# Set subscription (if you have multiple)
az account list
az account set --subscription "Your-Subscription-Name"
```

## Tutorial Progression

### Foundation (Tutorials 1-4)
| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 01 | [Basic Setup](./01_basic_setup/) | Resource Group, Location | 10 min |
| 02 | [Storage Account](./02_storage_account/) | + Storage Account, Container | 15 min |
| 03 | [Storage + Function](./03_storage_function/) | + Azure Function, App Service Plan | 20 min |
| 04 | [Storage + Function + VNet](./04_storage_function_vnet/) | + Virtual Network, Subnets | 25 min |

### Web Applications (Tutorials 5-7)
| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 05 | [Basic Web App](./05_web_app_basic/) | App Service, Deployment Slots | 20 min |
| 06 | [Web App + Database](./06_web_app_database/) | + Azure SQL Database, Private Link | 30 min |
| 07 | [Web App + DB + Redis](./07_web_app_database_redis/) | + Redis Cache, VNet Integration | 30 min |

### Kubernetes & Containers (Tutorials 8-10)
| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 08 | [AKS Basic](./08_aks_basic/) | AKS Cluster, Node Pools | 35 min |
| 09 | [AKS + Monitoring](./09_aks_with_monitoring/) | + Log Analytics, Container Insights | 30 min |
| 10 | [AKS + Ingress](./10_aks_with_ingress/) | + Application Gateway, Ingress Controller | 40 min |

### Advanced Architectures (Tutorials 11-15)
| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 11 | [Full 3-Tier App](./11_full_3tier_app/) | Load Balancer, VM Scale Set, App Gateway | 45 min |
| 12 | [VPN Gateway](./12_vpn_gateway/) | VPN Gateway, Point-to-Site, Site-to-Site | 40 min |
| 13 | [Private Endpoints](./13_private_endpoints/) | Private Endpoints, Private DNS Zones | 35 min |
| 14 | [Security Center](./14_security_center/) | Security Center, Policies, Compliance | 30 min |
| 15 | [Multi-Region HA](./15_multi_region_ha/) | Traffic Manager, Geo-Redundancy | 50 min |

## Learning Outcomes

### After Tutorial 4:
- ✅ Create and manage resource groups
- ✅ Deploy storage accounts with containers
- ✅ Set up Azure Functions
- ✅ Configure virtual networks and subnets

### After Tutorial 7:
- ✅ Deploy web applications
- ✅ Configure Azure SQL Database
- ✅ Implement Redis caching
- ✅ Secure resources with private networking

### After Tutorial 10:
- ✅ Deploy and manage AKS clusters
- ✅ Set up monitoring and logging
- ✅ Configure ingress controllers
- ✅ Implement container networking

### After Tutorial 15:
- ✅ Design multi-tier architectures
- ✅ Implement VPN connectivity
- ✅ Secure resources with private endpoints
- ✅ Deploy multi-region high availability solutions
- ✅ Apply Azure security best practices

## Recommended Study Pattern

### Day 1-2: Foundation
- Complete tutorials 1-4
- Repeat tutorial 4 from scratch

### Day 3-4: Web Applications
- Complete tutorials 5-7
- Repeat tutorial 7 from scratch

### Day 5-6: Kubernetes
- Complete tutorials 8-10
- Repeat tutorial 10 from scratch

### Day 7-8: Advanced
- Complete tutorials 11-13
- Experiment with modifications

### Day 9-10: Mastery
- Complete tutorials 14-15
- Build a custom project combining concepts

## Best Practices Highlighted

Throughout these tutorials, you'll learn:

**Security**
- Network segmentation with VNets and subnets
- Private endpoints for PaaS services
- Managed identities for authentication
- Azure Security Center integration
- Encryption at rest and in transit

**Scalability**
- Auto-scaling for App Services and AKS
- Load balancing strategies
- Multi-region deployments
- Caching patterns

**Cost Optimization**
- Free tier usage
- Appropriate SKU selection
- Resource tagging for cost tracking
- Cleanup procedures

**Reliability**
- Zone redundancy
- Backup strategies
- Health probes and monitoring
- Disaster recovery patterns

## Common Terraform Patterns for Azure

### Provider Configuration
```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}
```

### Resource Naming
```hcl
locals {
  resource_prefix = "myapp"
  environment     = "dev"
  location        = "eastus"

  common_tags = {
    Environment = local.environment
    ManagedBy   = "Terraform"
    Project     = "Learning"
  }
}
```

### Resource Group Pattern
```hcl
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.resource_prefix}-${local.environment}"
  location = local.location
  tags     = local.common_tags
}
```

## Cost Management

⚠️ **IMPORTANT**: Azure resources can incur charges. Always clean up!

```bash
# After each tutorial, destroy resources:
terraform destroy

# Verify in Azure Portal that resources are deleted
az resource list --resource-group <your-resource-group-name>
```

### Estimated Costs (with cleanup):
- Tutorials 1-4: Free tier eligible
- Tutorials 5-7: ~$0.50-2.00 per hour
- Tutorials 8-10: ~$1.50-3.00 per hour (AKS cluster)
- Tutorials 11-15: ~$2.00-5.00 per hour

**💡 Tip**: Set up cost alerts in Azure Portal before starting!

## Troubleshooting

### Authentication Issues
```bash
# Re-login if token expires
az login

# Check current account
az account show

# List all subscriptions
az account list --output table
```

### Provider Registration
```bash
# Register required resource providers
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.ContainerService
```

### State Management
```bash
# If state gets corrupted
terraform refresh

# If you need to start fresh (⚠️ careful!)
rm -rf .terraform terraform.tfstate*
terraform init
```

## Tips for Success

1. **Type Everything**: Don't copy-paste. Typing builds muscle memory.
2. **Read Error Messages**: Terraform errors are usually informative.
3. **Use `terraform plan`**: Always review before applying.
4. **Experiment**: After completing a tutorial, try modifications.
5. **Clean Up**: Always run `terraform destroy` to avoid charges.
6. **Document**: Keep notes on what you learn.
7. **Repeat**: Come back and redo tutorials after a few days.

## Additional Resources

- [Azure Terraform Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Architecture Center](https://docs.microsoft.com/en-us/azure/architecture/)
- [Azure Free Account](https://azure.microsoft.com/free/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

## Next Steps

1. Ensure you have Azure CLI and Terraform installed
2. Login to Azure: `az login`
3. Start with [01_basic_setup](./01_basic_setup/)
4. Work through each tutorial sequentially
5. After completing all 15, move to AWS or another cloud provider

---

**Ready to start?** Head to [01_basic_setup](./01_basic_setup/) and begin your Azure journey!
