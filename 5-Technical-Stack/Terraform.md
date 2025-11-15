# Terraform Cheatsheet - Quick Reference

Infrastructure as Code with Terraform - AWS, GCP, Azure.

---

## Basics

```hcl
# provider.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# variables.tf
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {
    Environment = "dev"
    Project     = "myapp"
  }
}

# main.tf
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type

  tags = var.tags
}

resource "aws_s3_bucket" "data" {
  bucket = "my-app-data-bucket"

  lifecycle {
    prevent_destroy = true
  }
}

# outputs.tf
output "instance_ip" {
  description = "EC2 public IP"
  value       = aws_instance.web.public_ip
}
```

## Commands

```bash
terraform init              # Initialize
terraform plan              # Preview changes
terraform apply             # Apply changes
terraform apply -auto-approve
terraform destroy           # Destroy all
terraform destroy -target=aws_instance.web

terraform fmt               # Format code
terraform validate          # Validate syntax
terraform show              # Show state
terraform state list        # List resources
terraform output            # Show outputs
```

## Modules

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block = var.cidr_block
}

# modules/vpc/variables.tf
variable "cidr_block" {
  type = string
}

# modules/vpc/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

# main.tf (use module)
module "vpc" {
  source     = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id = module.vpc.vpc_id
  cidr_block = "10.0.1.0/24"
}
```

## Remote Backend

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-locks"
  }
}
```

---

**Last updated:** 2025-11-15
