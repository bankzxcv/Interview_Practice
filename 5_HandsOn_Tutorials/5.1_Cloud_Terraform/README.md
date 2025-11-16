# 5.1 Cloud Infrastructure with Terraform

## Overview

Learn cloud infrastructure by building incrementally across all major cloud providers. Each provider has 10-15 tutorials that start simple and gradually add complexity.

## Providers Covered

- **[5.1.1 Azure](./5.1.1_Azure/)** - 15 incremental tutorials
- **[5.1.2 AWS](./5.1.2_AWS/)** - 15 incremental tutorials
- **[5.1.3 GCP](./5.1.3_GCP/)** - 15 incremental tutorials
- **[5.1.4 DigitalOcean](./5.1.4_DigitalOcean/)** - 10 incremental tutorials
- **[5.1.5 Oracle Cloud](./5.1.5_Oracle_Cloud/)** - 10 incremental tutorials

## Learning Path

### Recommended Order:
1. **Start with one cloud provider** - Complete all tutorials for that provider
2. **Repeat with another provider** - Notice the patterns and differences
3. **Compare implementations** - Same architecture, different cloud syntax
4. **Build multi-cloud** - Combine learnings

### Pattern Recognition:
As you work through different providers, you'll notice:
- Similar concepts (VPC/VNet, Subnets, Security Groups/NSGs)
- Different naming conventions
- Provider-specific features
- Common Terraform patterns

## Structure of Each Tutorial

```
XX_feature_name/
├── README.md           # Instructions and explanations
├── main.tf            # Main Terraform configuration
├── variables.tf       # Input variables
├── outputs.tf         # Output values
├── terraform.tfvars.example  # Example variable values
└── .gitignore         # Ignore terraform state files
```

## Prerequisites

### Tools Required:
- **Terraform** (v1.0+): `brew install terraform` or download from terraform.io
- **Cloud CLI tools**:
  - Azure CLI: `brew install azure-cli`
  - AWS CLI: `brew install awscli`
  - Google Cloud SDK: `brew install google-cloud-sdk`
  - DigitalOcean CLI: `brew install doctl`

### Cloud Accounts:
- Free tier accounts available for all providers
- Credit card required for verification (most have free tiers)

## Best Practices Included

Each tutorial demonstrates:

✅ **Security**
- Principle of least privilege
- Encryption at rest and in transit
- Network segmentation
- Secrets management

✅ **Infrastructure as Code**
- Version control friendly
- Modular design
- Reusable modules
- Environment separation

✅ **Cost Optimization**
- Free tier usage where possible
- Resource tagging
- Cleanup instructions
- Cost estimation tips

✅ **High Availability**
- Multi-AZ deployments
- Load balancing
- Auto-scaling patterns
- Disaster recovery

## Common Terraform Commands

```bash
# Initialize Terraform (run this first in each tutorial)
terraform init

# Format code
terraform fmt

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# Destroy resources (IMPORTANT: Run this to avoid costs!)
terraform destroy
```

## Cost Management

⚠️ **IMPORTANT**: Always run `terraform destroy` after completing a tutorial to avoid unexpected charges!

### Tips:
1. Use free tier resources when available
2. Set up billing alerts in each cloud provider
3. Destroy resources immediately after practice
4. Use `terraform plan` to estimate costs before applying
5. Tag resources with `Environment = "learning"` for easy cleanup

## Progression Example (Azure)

```
01_basic_setup              → Resource Group
02_storage_account          → Resource Group + Storage
03_storage_function         → Resource Group + Storage + Function
04_storage_function_vnet    → + Virtual Network
05_full_web_app             → + App Service
...and so on
```

## Learning Goals

After completing all tutorials, you will:
- ✅ Understand core cloud concepts across multiple providers
- ✅ Write production-ready Terraform code
- ✅ Implement security best practices
- ✅ Design scalable architectures
- ✅ Manage infrastructure as code
- ✅ Compare and contrast different cloud providers
- ✅ Make informed decisions on cloud provider selection

## Troubleshooting

### Common Issues:

**Authentication Errors**
```bash
# Azure
az login

# AWS
aws configure

# GCP
gcloud auth login
```

**State Lock Issues**
```bash
# Force unlock (use carefully)
terraform force-unlock <lock-id>
```

**Provider Version Conflicts**
```bash
# Upgrade providers
terraform init -upgrade
```

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Azure Terraform Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [AWS Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GCP Terraform Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

## Next Steps

1. Choose a cloud provider to start with
2. Set up your account and CLI tools
3. Begin with tutorial `01_basic_setup`
4. Complete each tutorial in order
5. Move to the next cloud provider and repeat!

---

**Remember**: The goal is repetition and muscle memory. Don't rush - focus on understanding each concept before moving forward.
