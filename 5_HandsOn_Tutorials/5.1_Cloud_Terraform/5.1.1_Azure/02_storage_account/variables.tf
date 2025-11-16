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
