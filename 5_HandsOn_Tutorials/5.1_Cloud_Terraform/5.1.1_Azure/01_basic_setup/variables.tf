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
