# Security Tutorial 05: GCP IAM (Identity and Access Management)

## 🎯 Learning Objectives

- Understand Google Cloud IAM structure
- Create and manage service accounts
- Implement IAM roles and bindings
- Use workload identity for GKE
- Configure IAM conditions
- Implement organization policies

## 📋 Prerequisites

- Google Cloud account with billing enabled
- gcloud CLI installed
- Basic understanding of GCP services
- Project Owner or Security Admin role

## 📝 What We're Building

```
GCP Organization
├── Project: dev-project
│   ├── Service Accounts
│   │   ├── app-sa@...
│   │   └── gke-workload-sa@...
│   ├── IAM Bindings
│   │   ├── developer@example.com → roles/editor
│   │   └── operator@example.com → roles/compute.instanceAdmin
│   └── Custom Roles
│       └── custom.vmOperator
└── Workload Identity
    └── GKE → Service Account binding
```

## 🔍 Concepts Introduced

1. **IAM Members**: Users, Service Accounts, Groups, Domains
2. **IAM Roles**: Predefined and custom collections of permissions
3. **IAM Bindings**: Associates members with roles
4. **Service Accounts**: Machine identities for applications
5. **Workload Identity**: GKE pods use GCP service accounts
6. **IAM Conditions**: Conditional access based on attributes

## 📁 Step-by-Step Implementation

### Step 1: Setup and Authentication

```bash
# Login to GCP
gcloud auth login

# List projects
gcloud projects list

# Create new project
PROJECT_ID="security-tutorial-$(date +%s)"
gcloud projects create $PROJECT_ID --name="Security Tutorial"

# Set active project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  storage.googleapis.com

echo "Project ID: $PROJECT_ID"
```

### Step 2: Create Service Accounts

```bash
# Create application service account
gcloud iam service-accounts create app-service-account \
  --display-name="Application Service Account" \
  --description="Service account for application workloads"

# Create GKE workload service account
gcloud iam service-accounts create gke-workload-sa \
  --display-name="GKE Workload SA" \
  --description="Service account for GKE workload identity"

# Create admin service account
gcloud iam service-accounts create admin-automation-sa \
  --display-name="Admin Automation SA" \
  --description="Service account for administrative automation"

# List service accounts
gcloud iam service-accounts list

# Get email addresses
APP_SA=$(gcloud iam service-accounts list --filter="displayName:'Application Service Account'" --format="value(email)")
GKE_SA=$(gcloud iam service-accounts list --filter="displayName:'GKE Workload SA'" --format="value(email)")
ADMIN_SA=$(gcloud iam service-accounts list --filter="displayName:'Admin Automation SA'" --format="value(email)")

echo "App SA: $APP_SA"
echo "GKE SA: $GKE_SA"
echo "Admin SA: $ADMIN_SA"
```

### Step 3: Grant IAM Roles to Service Accounts

```bash
# Grant Storage Object Viewer to app service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA" \
  --role="roles/storage.objectViewer"

# Grant Compute Instance Admin to admin SA
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$ADMIN_SA" \
  --role="roles/compute.instanceAdmin.v1"

# Grant Logging Writer to app SA
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA" \
  --role="roles/logging.logWriter"

# Grant Monitoring Metric Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA" \
  --role="roles/monitoring.metricWriter"
```

### Step 4: Create Custom IAM Role

Create `vm-operator-role.yaml`:

```yaml
title: "VM Operator"
description: "Custom role for starting, stopping, and viewing VMs"
stage: "GA"
includedPermissions:
  - compute.instances.start
  - compute.instances.stop
  - compute.instances.reset
  - compute.instances.get
  - compute.instances.list
  - compute.zones.list
  - compute.zones.get
```

Create the custom role:

```bash
# Create custom role
gcloud iam roles create vmOperator \
  --project=$PROJECT_ID \
  --file=vm-operator-role.yaml

# List custom roles
gcloud iam roles list --project=$PROJECT_ID

# Describe the role
gcloud iam roles describe vmOperator --project=$PROJECT_ID

# Grant custom role to service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$ADMIN_SA" \
  --role="projects/$PROJECT_ID/roles/vmOperator"
```

### Step 5: Create IAM Bindings with Conditions

```bash
# Create binding with time-based condition
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$ADMIN_SA" \
  --role="roles/compute.viewer" \
  --condition='expression=request.time < timestamp("2025-12-31T23:59:59Z"),title=temporary-access,description=Access expires end of 2025'

# Create binding with resource-based condition
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA" \
  --role="roles/storage.objectViewer" \
  --condition='expression=resource.name.startsWith("projects/_/buckets/dev-"),title=dev-buckets-only,description=Access only to dev buckets'

# View IAM policy with conditions
gcloud projects get-iam-policy $PROJECT_ID --format=json | \
  jq '.bindings[] | select(.condition != null)'
```

### Step 6: Create Service Account Keys

```bash
# Create JSON key for app service account
gcloud iam service-accounts keys create app-sa-key.json \
  --iam-account=$APP_SA

# List keys
gcloud iam service-accounts keys list \
  --iam-account=$APP_SA

# View key details
cat app-sa-key.json | jq '{type, project_id, private_key_id}'

# Set environment variable for authentication
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/app-sa-key.json"

echo "⚠️  Store this key securely and never commit to version control!"
```

### Step 7: Setup Workload Identity for GKE

```bash
# Create GKE cluster with Workload Identity
gcloud container clusters create security-cluster \
  --zone=us-central1-a \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --workload-pool=$PROJECT_ID.svc.id.goog \
  --enable-stackdriver-kubernetes

# Get credentials
gcloud container clusters get-credentials security-cluster --zone=us-central1-a

# Create Kubernetes namespace
kubectl create namespace production

# Create Kubernetes service account
kubectl create serviceaccount app-ksa -n production

# Bind Kubernetes SA to GCP SA
gcloud iam service-accounts add-iam-policy-binding $GKE_SA \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:$PROJECT_ID.svc.id.goog[production/app-ksa]"

# Annotate Kubernetes service account
kubectl annotate serviceaccount app-ksa \
  -n production \
  iam.gke.io/gcp-service-account=$GKE_SA

# Grant permissions to GCP service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$GKE_SA" \
  --role="roles/storage.objectViewer"
```

### Step 8: Test Workload Identity

Create `test-workload-identity.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: workload-identity-test
  namespace: production
spec:
  serviceAccountName: app-ksa
  containers:
    - name: gcloud
      image: google/cloud-sdk:slim
      command: ["sleep", "3600"]
```

Test it:

```bash
# Deploy test pod
kubectl apply -f test-workload-identity.yaml

# Wait for pod
kubectl wait --for=condition=Ready pod/workload-identity-test -n production --timeout=60s

# Test GCP access from pod
kubectl exec -it workload-identity-test -n production -- gcloud auth list

# Test storage access
kubectl exec -it workload-identity-test -n production -- \
  gcloud storage buckets list --project=$PROJECT_ID

# Verify service account
kubectl exec -it workload-identity-test -n production -- \
  curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email"
```

### Step 9: Implement IAM Policy for Storage Bucket

```bash
# Create storage bucket
gsutil mb -p $PROJECT_ID -l us-central1 gs://$PROJECT_ID-secure-bucket

# Set IAM policy on bucket
gsutil iam ch serviceAccount:$APP_SA:objectViewer \
  gs://$PROJECT_ID-secure-bucket

# Add conditional binding
cat > bucket-policy.json <<EOF
{
  "bindings": [
    {
      "role": "roles/storage.objectViewer",
      "members": [
        "serviceAccount:$APP_SA"
      ]
    },
    {
      "role": "roles/storage.objectCreator",
      "members": [
        "serviceAccount:$APP_SA"
      ],
      "condition": {
        "title": "Expires 2025",
        "description": "Upload access expires end of 2025",
        "expression": "request.time < timestamp('2025-12-31T23:59:59Z')"
      }
    }
  ]
}
EOF

# Apply policy
gsutil iam set bucket-policy.json gs://$PROJECT_ID-secure-bucket

# View bucket IAM policy
gsutil iam get gs://$PROJECT_ID-secure-bucket
```

### Step 10: Create Organization Policies

```bash
# List available constraints
gcloud resource-manager org-policies list --project=$PROJECT_ID

# Disable service account key creation (if at org/folder level)
cat > disable-sa-key-creation.yaml <<EOF
constraint: constraints/iam.disableServiceAccountKeyCreation
booleanPolicy:
  enforced: true
EOF

# Note: This requires org-level permissions
# gcloud resource-manager org-policies set-policy disable-sa-key-creation.yaml --project=$PROJECT_ID

# Restrict service account key upload
cat > restrict-sa-key-upload.yaml <<EOF
constraint: constraints/iam.disableServiceAccountKeyUpload
booleanPolicy:
  enforced: true
EOF
```

## ✅ Verification

### 1. List IAM Bindings

```bash
# Get project IAM policy
gcloud projects get-iam-policy $PROJECT_ID

# Filter by member
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$APP_SA" \
  --format="table(bindings.role)"

# List all service accounts and their roles
for SA in $(gcloud iam service-accounts list --format="value(email)"); do
  echo "=== $SA ==="
  gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:$SA" \
    --format="value(bindings.role)"
done
```

### 2. Test Service Account Permissions

```bash
# Activate service account
gcloud auth activate-service-account --key-file=app-sa-key.json

# Test storage access
gsutil ls gs://$PROJECT_ID-secure-bucket || echo "No access"

# Test compute access (should fail for app-sa)
gcloud compute instances list || echo "No permission"

# Switch back to user account
gcloud auth login
gcloud config set account YOUR_EMAIL@gmail.com
```

### 3. Verify Workload Identity

```bash
# Check Kubernetes service account annotation
kubectl describe sa app-ksa -n production | grep iam.gke.io

# Check IAM binding
gcloud iam service-accounts get-iam-policy $GKE_SA

# Test from pod
kubectl exec -it workload-identity-test -n production -- \
  gcloud storage buckets list --project=$PROJECT_ID
```

### 4. Audit IAM Configuration

```bash
# Get all IAM policy bindings
gcloud projects get-iam-policy $PROJECT_ID --format=json > iam-policy-backup.json

# Find service accounts with Owner role (security risk!)
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/owner AND bindings.members:serviceAccount" \
  --format="table(bindings.members)"

# List service account keys
for SA in $(gcloud iam service-accounts list --format="value(email)"); do
  echo "=== $SA ==="
  gcloud iam service-accounts keys list --iam-account=$SA
done
```

## 🧪 Exploration Commands

### IAM Analysis

```bash
# Test IAM permissions
gcloud projects test-iam-permissions $PROJECT_ID \
  --permissions=compute.instances.create,storage.buckets.list

# Check testable permissions for resource
gcloud iam list-testable-permissions //cloudresourcemanager.googleapis.com/projects/$PROJECT_ID

# Get role metadata
gcloud iam roles describe roles/storage.objectViewer

# Find roles with specific permission
gcloud iam roles list --filter="includedPermissions:storage.objects.get" --format="value(name)"

# Analyze organization policy
gcloud resource-manager org-policies describe \
  constraints/iam.disableServiceAccountKeyCreation \
  --project=$PROJECT_ID
```

### Service Account Management

```bash
# Impersonate service account
gcloud compute instances list \
  --impersonate-service-account=$ADMIN_SA

# Create short-lived token
gcloud auth print-access-token \
  --impersonate-service-account=$APP_SA

# Generate ID token
gcloud auth print-identity-token \
  --impersonate-service-account=$APP_SA \
  --audiences=https://example.com
```

## 🧹 Cleanup

```bash
# Delete GKE cluster
gcloud container clusters delete security-cluster --zone=us-central1-a --quiet

# Delete storage bucket
gsutil rm -r gs://$PROJECT_ID-secure-bucket

# Delete service account keys
for SA in $APP_SA $GKE_SA $ADMIN_SA; do
  for KEY in $(gcloud iam service-accounts keys list --iam-account=$SA --filter="keyType=USER_MANAGED" --format="value(name)"); do
    gcloud iam service-accounts keys delete $KEY --iam-account=$SA --quiet
  done
done

# Remove IAM bindings
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$APP_SA" \
  --role="roles/storage.objectViewer" --quiet

gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$ADMIN_SA" \
  --role="roles/compute.instanceAdmin.v1" --quiet

# Delete service accounts
gcloud iam service-accounts delete $APP_SA --quiet
gcloud iam service-accounts delete $GKE_SA --quiet
gcloud iam service-accounts delete $ADMIN_SA --quiet

# Delete custom role
gcloud iam roles delete vmOperator --project=$PROJECT_ID --quiet

# Delete project (optional - removes everything)
# gcloud projects delete $PROJECT_ID --quiet

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Creating and managing GCP service accounts
✅ Implementing IAM roles and bindings
✅ Creating custom IAM roles
✅ Using IAM conditions for fine-grained access
✅ Setting up Workload Identity for GKE
✅ Managing service account keys
✅ Implementing organization policies

## 🎓 Key Concepts

**GCP IAM Hierarchy**:
```
Organization
└── Folder
    └── Project
        └── Resource
```

**IAM Policy Structure**:
- **Member**: who (user, service account, group)
- **Role**: what permissions
- **Condition**: when/where (optional)

**IAM Roles**:
- **Primitive**: Owner, Editor, Viewer (broad, avoid in production)
- **Predefined**: Curated by Google for specific services
- **Custom**: Created by you for specific needs

**Best Practices**:
1. Use service accounts for applications
2. Use predefined roles when possible
3. Create custom roles for specific needs
4. Use conditions for temporary/contextual access
5. Avoid service account keys (use Workload Identity)
6. Enable audit logging
7. Regularly review and rotate credentials

## 🔜 Next Steps

Move to [06_policy_as_code](../06_policy_as_code/) where you'll:
- Implement Open Policy Agent (OPA)
- Create Rego policies
- Integrate OPA with Kubernetes
- Use Gatekeeper for policy enforcement

## 💡 Pro Tips

1. **Use Workload Identity instead of service account keys**:
   ```bash
   # More secure, no credential management
   gcloud iam service-accounts add-iam-policy-binding $SA \
     --role roles/iam.workloadIdentityUser \
     --member "serviceAccount:PROJECT.svc.id.goog[NAMESPACE/KSA]"
   ```

2. **Audit service account key age**:
   ```bash
   gcloud iam service-accounts keys list --iam-account=$SA \
     --format="table(validAfterTime,validBeforeTime)" \
     --filter="keyType=USER_MANAGED"
   ```

3. **Use short-lived tokens**:
   ```bash
   gcloud auth print-access-token --lifetime=600  # 10 minutes
   ```

4. **Export IAM configuration**:
   ```bash
   gcloud projects get-iam-policy $PROJECT_ID --format=json > iam-backup.json
   ```

## 🆘 Troubleshooting

**Problem**: `Permission denied` errors
**Solution**: Check IAM bindings
```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SA"
```

**Problem**: Workload Identity not working
**Solution**: Verify annotation and IAM binding
```bash
kubectl describe sa KSA -n NAMESPACE | grep iam.gke.io
gcloud iam service-accounts get-iam-policy $GCP_SA
```

**Problem**: Service account key not working
**Solution**: Check key validity
```bash
gcloud iam service-accounts keys list --iam-account=$SA
```

**Problem**: Custom role not appearing
**Solution**: Check creation status and permissions
```bash
gcloud iam roles describe ROLE_ID --project=$PROJECT_ID
```

## 📖 Additional Reading

- [GCP IAM Documentation](https://cloud.google.com/iam/docs)
- [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [IAM Conditions](https://cloud.google.com/iam/docs/conditions-overview)
- [Best Practices for Service Accounts](https://cloud.google.com/iam/docs/best-practices-for-using-and-managing-service-accounts)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate
**Cost**: Minimal (GKE e2-medium, delete when done)
