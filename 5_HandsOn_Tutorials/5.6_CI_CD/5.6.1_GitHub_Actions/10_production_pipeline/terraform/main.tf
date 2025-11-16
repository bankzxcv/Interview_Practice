terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "production-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    production = {
      desired_size = 3
      min_size     = 3
      max_size     = 10

      instance_types = ["t3.large"]
    }
  }
}

# RDS Database
resource "aws_db_instance" "production" {
  identifier     = "production-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  storage_encrypted     = true
  backup_retention_period = 30

  multi_az = true

  tags = {
    Environment = "production"
  }
}
