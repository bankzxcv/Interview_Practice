# Azure Tutorial 02: Storage Account

## 🎯 Learning Objectives

- Build upon Tutorial 01 (Resource Group)
- Create an Azure Storage Account
- Configure storage account security settings
- Create a Blob Container
- Understand storage access tiers and replication
- Learn about storage account naming constraints

## 📋 Prerequisites

- Completed [Tutorial 01](../01_basic_setup/)
- Understanding of Azure Resource Groups
- Azure CLI logged in (`az login`)

## 📝 What We're Building

```
Azure Subscription
└── Resource Group (rg-learning-dev)
    ├── Storage Account (stlearningdev123)  ← NEW
    │   ├── Replication: LRS
    │   ├── Access Tier: Hot
    │   └── HTTPS Only: true
    └── Blob Container (data)  ← NEW
        └── Access: Private
```

## 🔍 Concepts Introduced

1. **Storage Account**: Azure's object storage solution
2. **Blob Container**: Organizes blobs (files) within storage
3. **Access Tiers**: Hot vs Cool vs Archive storage
4. **Replication**: LRS, GRS, ZRS options
5. **Secure Transfer**: HTTPS requirement
6. **Random Suffix**: Ensuring globally unique names

## 📁 Code Changes from Tutorial 01

### Step 1: Update `main.tf`

Add storage resources to your existing configuration:

```hcl
# main.tf

# Configure the Azure Provider
terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Generate random string for storage account name
# Storage account names must be globally unique and 3-24 characters
resource "random_string" "storage_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Create a Resource Group (from Tutorial 01)
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Learning"
    Tutorial    = "02_storage_account"
  }
}

# Create a Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "${var.storage_account_prefix}${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Locally Redundant Storage
  access_tier              = "Hot"  # Hot access tier for frequently accessed data

  # Security settings
  enable_https_traffic_only       = true
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Learning"
    Tutorial    = "02_storage_account"
  }
}

# Create a Blob Container within the Storage Account
resource "azurerm_storage_container" "data" {
  name                  = "data"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"  # No public access
}
```

**New Concepts Explained**:

- **`random_string`**: Generates unique suffix for globally unique storage name
- **`account_tier`**: Standard (HDD) or Premium (SSD)
- **`account_replication_type`**:
  - LRS: Locally Redundant (3 copies in one datacenter)
  - GRS: Geo-Redundant (6 copies across regions)
  - ZRS: Zone-Redundant (3 copies across availability zones)
- **`access_tier`**: Hot (frequent access) or Cool (infrequent access)
- **`enable_https_traffic_only`**: Enforces secure connections
- **`container_access_type`**: private, blob, or container

### Step 2: Update `variables.tf`

Add new variables:

```hcl
# variables.tf

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-learning-dev"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "storage_account_prefix" {
  description = "Prefix for storage account name (will be combined with random suffix)"
  type        = string
  default     = "stlearning"

  validation {
    condition     = length(var.storage_account_prefix) <= 18 && can(regex("^[a-z0-9]+$", var.storage_account_prefix))
    error_message = "Storage account prefix must be 18 characters or less and contain only lowercase letters and numbers."
  }
}
```

**New Feature**: Variable validation ensures naming constraints!

### Step 3: Update `outputs.tf`

Add storage-related outputs:

```hcl
# outputs.tf

output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_id" {
  description = "ID of the created resource group"
  value       = azurerm_resource_group.main.id
}

output "location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# New outputs for storage
output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.main.name
}

output "storage_account_id" {
  description = "ID of the storage account"
  value       = azurerm_storage_account.main.id
}

output "storage_primary_endpoint" {
  description = "Primary blob endpoint"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "storage_container_name" {
  description = "Name of the blob container"
  value       = azurerm_storage_container.data.name
}
```

### Step 4: Update `terraform.tfvars.example`

```hcl
# terraform.tfvars.example

resource_group_name    = "rg-learning-dev"
location               = "eastus"
environment            = "dev"
storage_account_prefix = "stlearning"
```

## 🚀 Deployment Steps

### 1. Initialize Terraform (includes new random provider)

```bash
terraform init
```

### 2. Plan to See Changes

```bash
terraform plan
```

**Expected plan**:
```
Plan: 3 to add, 0 to change, 0 to destroy.

+ random_string.storage_suffix
+ azurerm_resource_group.main
+ azurerm_storage_account.main
+ azurerm_storage_container.data
```

### 3. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted.

**Expected output**:
```
random_string.storage_suffix: Creating...
random_string.storage_suffix: Creation complete
azurerm_resource_group.main: Creating...
azurerm_resource_group.main: Creation complete after 2s
azurerm_storage_account.main: Creating...
azurerm_storage_account.main: Creation complete after 23s
azurerm_storage_container.data: Creating...
azurerm_storage_container.data: Creation complete after 1s

Apply complete! Resources: 4 added, 0 changed, 0 destroyed.

Outputs:

location = "eastus"
resource_group_id = "/subscriptions/.../resourceGroups/rg-learning-dev"
resource_group_name = "rg-learning-dev"
storage_account_name = "stlearningabc123"
storage_container_name = "data"
storage_primary_endpoint = "https://stlearningabc123.blob.core.windows.net/"
```

## ✅ Verification

### Method 1: Terraform Output

```bash
terraform output storage_account_name
terraform output storage_primary_endpoint
```

### Method 2: Azure CLI

```bash
# List storage accounts in resource group
az storage account list \
  --resource-group rg-learning-dev \
  --output table

# Show specific storage account
az storage account show \
  --name $(terraform output -raw storage_account_name) \
  --resource-group rg-learning-dev \
  --output json

# List containers
az storage container list \
  --account-name $(terraform output -raw storage_account_name) \
  --auth-mode login \
  --output table
```

### Method 3: Azure Portal

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to "Storage accounts"
3. Find your storage account (e.g., "stlearningabc123")
4. Click "Containers" to see the "data" container

## 🧪 Experiments to Try

### 1. Upload a File to the Container

```bash
# Create a test file
echo "Hello Azure Storage!" > test.txt

# Upload to container
STORAGE_ACCOUNT=$(terraform output -raw storage_account_name)

az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name data \
  --name test.txt \
  --file test.txt \
  --auth-mode login

# List blobs
az storage blob list \
  --account-name $STORAGE_ACCOUNT \
  --container-name data \
  --auth-mode login \
  --output table
```

### 2. Change Access Tier

```hcl
# In main.tf, change:
access_tier = "Cool"  # Instead of "Hot"

# Apply changes
terraform apply
```

### 3. Add Another Container

```hcl
# In main.tf, add:
resource "azurerm_storage_container" "logs" {
  name                  = "logs"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}
```

### 4. Change Replication Type

```hcl
# In main.tf, change:
account_replication_type = "GRS"  # Geo-redundant instead of LRS

# Apply (this will recreate the storage account!)
terraform apply
```

## 🧹 Cleanup

```bash
terraform destroy
```

Type `yes` when prompted.

**Verify deletion**:
```bash
az storage account list --resource-group rg-learning-dev --output table
az group list --output table
```

## 📚 What You Learned

✅ Creating Azure Storage Accounts with Terraform
✅ Generating unique names with random provider
✅ Configuring storage security settings
✅ Creating Blob Containers
✅ Understanding storage tiers and replication
✅ Variable validation in Terraform
✅ Working with storage using Azure CLI
✅ Uploading files to blob storage

## 🎓 Best Practices Applied

1. **Unique Naming**: Random suffix for globally unique names
2. **Security**: HTTPS-only, TLS 1.2 minimum, private containers
3. **Cost Optimization**: LRS for dev/test environments
4. **Access Tier**: Hot tier for frequently accessed data
5. **Validation**: Variable constraints prevent invalid names
6. **Tagging**: Consistent tagging for resource management

## 💰 Cost Considerations

- Storage Account: ~$0.02 per GB/month (Hot tier)
- LRS Replication: Cheapest option
- **Estimated cost**: < $0.10 if destroyed within an hour

## 🔜 Next Steps

Move to [03_storage_function](../03_storage_function/) where you'll:
- Keep the Resource Group and Storage Account
- Add an Azure Function App
- Configure the function to access storage
- Learn about serverless computing

## 🆘 Troubleshooting

**Problem**: `StorageAccountAlreadyExists`
**Solution**: Storage name is globally unique. Change `storage_account_prefix` variable.

**Problem**: `InvalidStorageAccountName`
**Solution**: Ensure prefix is lowercase letters/numbers only, max 18 chars.

**Problem**: `AuthorizationFailed when uploading blob`
**Solution**: Assign yourself "Storage Blob Data Contributor" role:
```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $(az account show --query user.name -o tsv) \
  --scope /subscriptions/$(az account show --query id -o tsv)/resourceGroups/rg-learning-dev
```

## 📖 Additional Reading

- [Azure Storage Account Overview](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-overview)
- [Storage Replication Options](https://docs.microsoft.com/en-us/azure/storage/common/storage-redundancy)
- [Blob Storage Tiers](https://docs.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview)

---

**Estimated Time**: 15-20 minutes
**Difficulty**: Beginner
**Cost**: < $0.10 per hour
