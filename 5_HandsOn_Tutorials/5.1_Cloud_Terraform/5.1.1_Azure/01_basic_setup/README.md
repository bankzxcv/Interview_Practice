# Azure Tutorial 01: Basic Setup

## 🎯 Learning Objectives

- Understand Terraform provider configuration for Azure
- Create an Azure Resource Group
- Learn basic Terraform workflow (init, plan, apply, destroy)
- Understand resource naming conventions
- Implement resource tagging

## 📋 Prerequisites

- Azure CLI installed and configured (`az login`)
- Terraform installed (v1.0+)
- Active Azure subscription

## 📝 What We're Building

```
Azure Subscription
└── Resource Group (rg-learning-dev)
    Location: East US
    Tags: Environment=dev, ManagedBy=Terraform
```

## 🔍 Concepts Introduced

1. **Resource Group**: Logical container for Azure resources
2. **Terraform Provider**: Connection to Azure API
3. **Variables**: Parameterized configuration
4. **Outputs**: Information displayed after apply
5. **Tags**: Metadata for resource organization

## 📁 Step-by-Step Implementation

### Step 1: Create Project Directory

```bash
mkdir -p ~/azure-learning/01_basic_setup
cd ~/azure-learning/01_basic_setup
```

### Step 2: Create `main.tf`

This file contains your main infrastructure code:

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
  }
}

provider "azurerm" {
  features {}
}

# Create a Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Learning"
    Tutorial    = "01_basic_setup"
  }
}
```

**Explanation**:
- `terraform {}` block: Specifies Terraform and provider versions
- `provider "azurerm"` block: Configures Azure provider
- `resource "azurerm_resource_group"` block: Creates the resource group
- `tags`: Metadata for organization and cost tracking

### Step 3: Create `variables.tf`

Define input variables for flexibility:

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
```

**Explanation**:
- Variables make your code reusable
- `type`: Ensures correct data types
- `default`: Provides default values (can be overridden)
- `description`: Documents variable purpose

### Step 4: Create `outputs.tf`

Define what information to display after deployment:

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
```

**Explanation**:
- Outputs display useful information after deployment
- Can be used by other Terraform configurations
- Helpful for debugging and verification

### Step 5: Create `.gitignore`

Prevent committing sensitive files:

```gitignore
# .gitignore

# Terraform files
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
.terraform.lock.hcl

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
```

### Step 6: Create `terraform.tfvars.example`

Example variable values (users copy to `terraform.tfvars`):

```hcl
# terraform.tfvars.example

resource_group_name = "rg-learning-dev"
location            = "eastus"
environment         = "dev"
```

## 🚀 Deployment Steps

### 1. Initialize Terraform

```bash
terraform init
```

**What happens**:
- Downloads Azure provider plugin
- Sets up backend for state storage
- Creates `.terraform` directory

**Expected output**:
```
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/azurerm versions matching "~> 3.0"...
- Installing hashicorp/azurerm v3.x.x...

Terraform has been successfully initialized!
```

### 2. Format Code

```bash
terraform fmt
```

**What happens**:
- Automatically formats your `.tf` files
- Ensures consistent style

### 3. Validate Configuration

```bash
terraform validate
```

**Expected output**:
```
Success! The configuration is valid.
```

### 4. Plan Deployment

```bash
terraform plan
```

**What happens**:
- Shows what Terraform will create/modify/destroy
- No changes are made yet
- Review the plan carefully

**Expected output**:
```
Terraform will perform the following actions:

  # azurerm_resource_group.main will be created
  + resource "azurerm_resource_group" "main" {
      + id       = (known after apply)
      + location = "eastus"
      + name     = "rg-learning-dev"
      + tags     = {
          + "Environment" = "dev"
          + "ManagedBy"   = "Terraform"
          + "Purpose"     = "Learning"
          + "Tutorial"    = "01_basic_setup"
        }
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

### 5. Apply Configuration

```bash
terraform apply
```

**What happens**:
- Prompts for confirmation
- Creates resources in Azure
- Updates state file

Type `yes` when prompted.

**Expected output**:
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

azurerm_resource_group.main: Creating...
azurerm_resource_group.main: Creation complete after 2s

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

location = "eastus"
resource_group_id = "/subscriptions/.../resourceGroups/rg-learning-dev"
resource_group_name = "rg-learning-dev"
```

## ✅ Verification

### Method 1: Terraform Output

```bash
terraform output
```

### Method 2: Azure CLI

```bash
# List all resource groups
az group list --output table

# Show specific resource group
az group show --name rg-learning-dev --output json
```

### Method 3: Azure Portal

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to "Resource groups"
3. Find "rg-learning-dev"
4. Verify location and tags

## 🧪 Experiments to Try

1. **Change Location**:
   ```bash
   # Edit terraform.tfvars (create it first)
   echo 'location = "westus2"' >> terraform.tfvars
   terraform apply
   ```

2. **Add More Tags**:
   ```hcl
   # In main.tf, add to tags block:
   Owner = "YourName"
   ```

3. **Multiple Resource Groups**:
   ```hcl
   # In main.tf, add:
   resource "azurerm_resource_group" "secondary" {
     name     = "rg-learning-secondary"
     location = "westus2"
     tags     = azurerm_resource_group.main.tags
   }
   ```

## 🧹 Cleanup

**IMPORTANT**: Always destroy resources to avoid charges!

```bash
terraform destroy
```

Type `yes` when prompted.

**Verify deletion**:
```bash
az group list --output table
```

## 📚 What You Learned

✅ How to configure Terraform for Azure
✅ Basic Terraform workflow (init → plan → apply → destroy)
✅ Creating Azure Resource Groups
✅ Using variables for parameterization
✅ Implementing outputs for information display
✅ Resource tagging best practices
✅ Verifying deployments multiple ways

## 🎓 Best Practices Applied

1. **Version Pinning**: Provider version constraint `~> 3.0`
2. **Naming Convention**: `rg-{purpose}-{environment}` pattern
3. **Tagging Strategy**: Environment, ManagedBy, Purpose tags
4. **Variables**: Parameterized for reusability
5. **Outputs**: Expose useful information
6. **Git Safety**: `.gitignore` for sensitive files

## 🔜 Next Steps

Move to [02_storage_account](../02_storage_account/) where you'll:
- Keep the resource group from this tutorial
- Add a Storage Account
- Create a Blob Container
- Learn about storage access tiers

## 🆘 Troubleshooting

**Problem**: `Error: Error building account`
**Solution**: Run `az login` to authenticate

**Problem**: `Error: Subscription not found`
**Solution**:
```bash
az account list
az account set --subscription "Your-Subscription-Name"
```

**Problem**: `Error: Provider registry.terraform.io/hashicorp/azurerm is not available`
**Solution**: Check internet connection, try `terraform init -upgrade`

## 📖 Additional Reading

- [Azure Resource Groups Overview](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/overview)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Naming Conventions](https://docs.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/naming-and-tagging)

---

**Estimated Time**: 10-15 minutes
**Difficulty**: Beginner
**Cost**: Free (Resource Groups have no cost)
