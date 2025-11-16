# Security Tutorial 04: Azure RBAC (Role-Based Access Control)

## 🎯 Learning Objectives

- Understand Azure Active Directory (Azure AD)
- Implement Azure RBAC for resource access
- Create custom roles and assignments
- Use Managed Identities for Azure resources
- Configure conditional access policies
- Implement Privileged Identity Management (PIM)

## 📋 Prerequisites

- Azure subscription
- Azure CLI installed (`az cli`)
- Basic understanding of Azure resources
- Owner or User Access Administrator role

## 📝 What We're Building

```
Azure Subscription
├── Azure AD
│   ├── Users (developers, operators)
│   ├── Groups (Engineering, Operations)
│   └── Service Principals
├── Resource Groups
│   ├── rg-development
│   ├── rg-production
│   └── rg-shared
├── Role Assignments
│   ├── Contributor → Engineering@rg-development
│   ├── Reader → Operations@rg-production
│   └── Custom VM Operator → ops-sp
└── Managed Identities
    ├── VM Identity
    └── App Service Identity
```

## 🔍 Concepts Introduced

1. **Azure AD**: Identity and access management service
2. **RBAC Roles**: Built-in and custom roles
3. **Role Assignments**: Binding principals to roles at scopes
4. **Service Principals**: Application identities
5. **Managed Identities**: Azure-managed identities for resources
6. **Scopes**: Management group, subscription, resource group, resource

## 📁 Step-by-Step Implementation

### Step 1: Login and Set Subscription

```bash
# Login to Azure
az login

# List subscriptions
az account list --output table

# Set active subscription
SUBSCRIPTION_ID="your-subscription-id"
az account set --subscription $SUBSCRIPTION_ID

# Verify
az account show
```

### Step 2: Create Resource Groups

```bash
# Create development resource group
az group create \
  --name rg-development \
  --location eastus \
  --tags Environment=Development Team=Engineering

# Create production resource group
az group create \
  --name rg-production \
  --location eastus \
  --tags Environment=Production Team=Operations

# Create shared resource group
az group create \
  --name rg-shared \
  --location eastus \
  --tags Environment=Shared

# List resource groups
az group list --output table
```

### Step 3: Create Azure AD Users

```bash
# Create developer user
az ad user create \
  --display-name "Alice Developer" \
  --user-principal-name alice@yourdomain.onmicrosoft.com \
  --password "SecurePass123!" \
  --force-change-password-next-sign-in true

# Create operator user
az ad user create \
  --display-name "Bob Operator" \
  --user-principal-name bob@yourdomain.onmicrosoft.com \
  --password "SecurePass123!" \
  --force-change-password-next-sign-in true

# Create auditor user
az ad user create \
  --display-name "Carol Auditor" \
  --user-principal-name carol@yourdomain.onmicrosoft.com \
  --password "SecurePass123!" \
  --force-change-password-next-sign-in true

# List users
az ad user list --output table
```

### Step 4: Create Azure AD Groups

```bash
# Create Engineering group
az ad group create \
  --display-name "Engineering" \
  --mail-nickname "engineering"

# Create Operations group
az ad group create \
  --display-name "Operations" \
  --mail-nickname "operations"

# Add users to groups
ALICE_ID=$(az ad user show --id alice@yourdomain.onmicrosoft.com --query id -o tsv)
BOB_ID=$(az ad user show --id bob@yourdomain.onmicrosoft.com --query id -o tsv)

ENG_GROUP_ID=$(az ad group show --group "Engineering" --query id -o tsv)
OPS_GROUP_ID=$(az ad group show --group "Operations" --query id -o tsv)

az ad group member add --group $ENG_GROUP_ID --member-id $ALICE_ID
az ad group member add --group $OPS_GROUP_ID --member-id $BOB_ID

# Verify
az ad group member list --group "Engineering" --output table
az ad group member list --group "Operations" --output table
```

### Step 5: Assign Built-in Roles

```bash
# Grant Contributor role to Engineering group on dev resource group
az role assignment create \
  --assignee $ENG_GROUP_ID \
  --role "Contributor" \
  --resource-group rg-development

# Grant Reader role to Operations group on prod resource group
az role assignment create \
  --assignee $OPS_GROUP_ID \
  --role "Reader" \
  --resource-group rg-production

# Grant specific user Virtual Machine Contributor on production
az role assignment create \
  --assignee $BOB_ID \
  --role "Virtual Machine Contributor" \
  --resource-group rg-production

# List role assignments for resource group
az role assignment list --resource-group rg-development --output table
az role assignment list --resource-group rg-production --output table
```

### Step 6: Create Custom Role

Create `vm-operator-role.json`:

```json
{
  "Name": "Virtual Machine Operator",
  "IsCustom": true,
  "Description": "Can start, stop, and restart VMs but cannot create or delete them",
  "Actions": [
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Compute/virtualMachines/powerOff/action",
    "Microsoft.Compute/virtualMachines/restart/action",
    "Microsoft.Compute/virtualMachines/read",
    "Microsoft.Compute/virtualMachines/instanceView/read",
    "Microsoft.Network/networkInterfaces/read",
    "Microsoft.Network/publicIPAddresses/read",
    "Microsoft.Resources/subscriptions/resourceGroups/read"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/SUBSCRIPTION_ID/resourceGroups/rg-production"
  ]
}
```

Update the file with your subscription ID and create the role:

```bash
# Replace SUBSCRIPTION_ID
sed -i "s/SUBSCRIPTION_ID/$SUBSCRIPTION_ID/g" vm-operator-role.json

# Create custom role
az role definition create --role-definition vm-operator-role.json

# List custom roles
az role definition list --custom-role-only true --output table

# Assign custom role
az role assignment create \
  --assignee $BOB_ID \
  --role "Virtual Machine Operator" \
  --resource-group rg-production
```

### Step 7: Create Service Principal

```bash
# Create service principal for automation
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "automation-sp" \
  --role "Contributor" \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-development)

# Extract credentials (save securely!)
SP_APP_ID=$(echo $SP_OUTPUT | jq -r '.appId')
SP_PASSWORD=$(echo $SP_OUTPUT | jq -r '.password')
SP_TENANT=$(echo $SP_OUTPUT | jq -r '.tenant')

echo "Service Principal Created:"
echo "APP_ID: $SP_APP_ID"
echo "PASSWORD: $SP_PASSWORD"
echo "TENANT: $SP_TENANT"

# Test login as service principal
az login --service-principal \
  --username $SP_APP_ID \
  --password $SP_PASSWORD \
  --tenant $SP_TENANT

# List accessible resource groups
az group list --output table

# Logout
az logout
az login  # Login back as your user
```

### Step 8: Create Managed Identity for VM

```bash
# Create virtual network first
az network vnet create \
  --resource-group rg-development \
  --name dev-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name default \
  --subnet-prefix 10.0.1.0/24

# Create VM with system-assigned managed identity
az vm create \
  --resource-group rg-development \
  --name dev-vm \
  --image Ubuntu2204 \
  --assign-identity \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B1s \
  --vnet-name dev-vnet \
  --subnet default

# Get managed identity principal ID
IDENTITY_ID=$(az vm show \
  --resource-group rg-development \
  --name dev-vm \
  --query identity.principalId -o tsv)

echo "Managed Identity ID: $IDENTITY_ID"

# Grant managed identity access to storage
az role assignment create \
  --assignee $IDENTITY_ID \
  --role "Storage Blob Data Contributor" \
  --resource-group rg-development
```

### Step 9: Create User-Assigned Managed Identity

```bash
# Create user-assigned managed identity
az identity create \
  --resource-group rg-shared \
  --name shared-identity

# Get identity details
SHARED_IDENTITY_ID=$(az identity show \
  --resource-group rg-shared \
  --name shared-identity \
  --query id -o tsv)

SHARED_IDENTITY_PRINCIPAL=$(az identity show \
  --resource-group rg-shared \
  --name shared-identity \
  --query principalId -o tsv)

# Assign role to managed identity
az role assignment create \
  --assignee $SHARED_IDENTITY_PRINCIPAL \
  --role "Key Vault Secrets User" \
  --resource-group rg-shared

# Assign managed identity to VM
az vm identity assign \
  --resource-group rg-development \
  --name dev-vm \
  --identities $SHARED_IDENTITY_ID
```

### Step 10: Create Role Assignment at Subscription Level

```bash
# Grant Reader at subscription level
CAROL_ID=$(az ad user show --id carol@yourdomain.onmicrosoft.com --query id -o tsv)

az role assignment create \
  --assignee $CAROL_ID \
  --role "Reader" \
  --scope /subscriptions/$SUBSCRIPTION_ID

# Verify subscription-level assignments
az role assignment list --all --assignee $CAROL_ID --output table
```

## ✅ Verification

### 1. List All Role Assignments

```bash
# List all assignments in subscription
az role assignment list --all --output table

# Filter by resource group
az role assignment list \
  --resource-group rg-development \
  --output table

# Filter by assignee
az role assignment list \
  --assignee $ALICE_ID \
  --output table

# Show with principal names
az role assignment list \
  --resource-group rg-development \
  --include-inherited \
  --output json | jq -r '.[] | "\(.principalName) - \(.roleDefinitionName)"'
```

### 2. Check Effective Permissions

```bash
# Check what actions alice can perform
az role assignment list \
  --assignee $ALICE_ID \
  --output json | jq -r '.[].roleDefinitionName'

# Get role definition details
az role definition list \
  --name "Contributor" \
  --output json | jq '.[] | {actions: .permissions[].actions, notActions: .permissions[].notActions}'
```

### 3. Test Service Principal Access

```bash
# Login as SP
az login --service-principal \
  --username $SP_APP_ID \
  --password $SP_PASSWORD \
  --tenant $SP_TENANT

# Try to list resources
az resource list --resource-group rg-development --output table

# Try to access production (should fail)
az resource list --resource-group rg-production --output table 2>&1

# Logout and login back
az logout
az login
```

### 4. Verify Managed Identity

```bash
# From within the VM
az vm run-command invoke \
  --resource-group rg-development \
  --name dev-vm \
  --command-id RunShellScript \
  --scripts "curl -H Metadata:true 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'"
```

## 🧪 Exploration Commands

### RBAC Analysis

```bash
# List all built-in roles
az role definition list --output table

# Search for specific role
az role definition list --name "Virtual Machine*" --output table

# Get role definition by name
az role definition list --name "Contributor" | jq '.[0].permissions'

# List all custom roles
az role definition list --custom-role-only true --output table

# Find who has Owner role
az role assignment list \
  --role "Owner" \
  --include-inherited \
  --all \
  --output table

# List deny assignments
az role assignment list --include-deny-assignments --output table
```

### Azure AD Queries

```bash
# List all users
az ad user list --output table

# List all groups
az ad group list --output table

# Get group members
az ad group member list --group "Engineering" --output table

# List service principals
az ad sp list --all --output table

# Show app registrations
az ad app list --output table
```

### Resource Analysis

```bash
# List resources with their RBAC
for RG in $(az group list --query '[].name' -o tsv); do
  echo "=== $RG ==="
  az role assignment list --resource-group $RG --output table
done

# Find orphaned role assignments
az role assignment list --all --include-classic-administrators false --output json | \
  jq -r '.[] | select(.principalName == null) | "\(.principalId) - \(.roleDefinitionName)"'
```

## 🧹 Cleanup

```bash
# Delete role assignments
az role assignment delete --assignee $ALICE_ID --resource-group rg-development
az role assignment delete --assignee $BOB_ID --resource-group rg-production
az role assignment delete --assignee $CAROL_ID

# Delete custom role
az role definition delete --name "Virtual Machine Operator"

# Delete service principal
az ad sp delete --id $SP_APP_ID

# Delete VM
az vm delete --resource-group rg-development --name dev-vm --yes

# Delete managed identity
az identity delete --resource-group rg-shared --name shared-identity

# Delete virtual network
az network vnet delete --resource-group rg-development --name dev-vnet

# Delete resource groups
az group delete --name rg-development --yes --no-wait
az group delete --name rg-production --yes --no-wait
az group delete --name rg-shared --yes --no-wait

# Delete Azure AD resources
az ad user delete --id alice@yourdomain.onmicrosoft.com
az ad user delete --id bob@yourdomain.onmicrosoft.com
az ad user delete --id carol@yourdomain.onmicrosoft.com

az ad group delete --group "Engineering"
az ad group delete --group "Operations"

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Understanding Azure AD and RBAC fundamentals
✅ Creating and managing Azure AD users and groups
✅ Assigning built-in and custom roles
✅ Creating service principals for automation
✅ Implementing managed identities for Azure resources
✅ Configuring role assignments at different scopes
✅ Auditing and troubleshooting RBAC permissions

## 🎓 Key Concepts

**Azure RBAC Scopes** (from broad to narrow):
1. **Management Group**: Multiple subscriptions
2. **Subscription**: Billing and resource container
3. **Resource Group**: Logical container for resources
4. **Resource**: Individual Azure resource

**RBAC Components**:
- **Security Principal**: User, Group, Service Principal, Managed Identity
- **Role Definition**: Collection of permissions (Actions, NotActions)
- **Scope**: Where the permissions apply
- **Role Assignment**: Binding principal + role + scope

**Built-in Roles**:
- **Owner**: Full access including role management
- **Contributor**: Full access except role management
- **Reader**: Read-only access
- **User Access Administrator**: Manage role assignments only

**Managed Identity Types**:
- **System-assigned**: Tied to resource lifecycle
- **User-assigned**: Independent lifecycle, reusable

## 🔜 Next Steps

Move to [05_gcp_iam](../05_gcp_iam/) where you'll:
- Learn Google Cloud IAM
- Create service accounts
- Implement workload identity
- Use IAM conditions

## 💡 Pro Tips

1. **Use Azure AD groups for assignments**:
   ```bash
   # Easier to manage than individual users
   az role assignment create --assignee $GROUP_ID --role "Contributor" --scope $SCOPE
   ```

2. **Check effective permissions**:
   ```bash
   # See what you can actually do
   az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv)
   ```

3. **Use managed identities instead of service principals**:
   ```bash
   # No credential management needed
   az vm identity assign --name myvm --resource-group myrg
   ```

4. **Export RBAC configuration**:
   ```bash
   az role assignment list --all > rbac-backup.json
   ```

5. **Use Azure Policy for governance**:
   ```bash
   az policy assignment create \
     --name "enforce-tag" \
     --policy "require-tag" \
     --params '{"tagName":{"value":"Environment"}}'
   ```

## 🆘 Troubleshooting

**Problem**: `Insufficient privileges to complete the operation`
**Solution**: Check your current role
```bash
az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv)
```

**Problem**: Role assignment not taking effect
**Solution**: Wait for propagation (up to 30 minutes) or clear token cache
```bash
az account clear
az login
```

**Problem**: Cannot create service principal
**Solution**: Need Application.ReadWrite.All permission in Azure AD
```bash
az ad sp list --show-mine
```

**Problem**: Managed identity not working
**Solution**: Ensure identity is enabled and role is assigned
```bash
az vm identity show --name myvm --resource-group myrg
az role assignment list --assignee $IDENTITY_ID
```

## 📖 Additional Reading

- [Azure RBAC Documentation](https://docs.microsoft.com/azure/role-based-access-control/)
- [Azure AD Overview](https://docs.microsoft.com/azure/active-directory/)
- [Managed Identities](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate
**Cost**: Minimal (use B1s VMs, delete when done)
