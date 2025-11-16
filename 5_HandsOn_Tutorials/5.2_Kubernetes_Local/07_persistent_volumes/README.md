# Kubernetes Tutorial 07: Persistent Volumes

## 🎯 Learning Objectives

- Understand storage in Kubernetes (ephemeral vs persistent)
- Create and manage PersistentVolumes (PV)
- Create and use PersistentVolumeClaims (PVC)
- Understand StorageClasses for dynamic provisioning
- Learn about different access modes and reclaim policies
- Implement stateful storage for applications

## 📋 Prerequisites

- Completed previous tutorials
- kind cluster "learning" is running (has local-path-provisioner by default)
- kubectl configured
- Understanding of volumes and storage

## 📝 What We're Building

```
StorageClass (local-path)
    ↓ (dynamic provisioning)
PersistentVolumeClaim (requests storage)
    ↓ (binds to)
PersistentVolume (actual storage)
    ↓ (mounted in)
Pod (uses persistent data)
```

## 🔍 Concepts Introduced

### 1. **Why Persistent Storage?**

**Problem with Container Storage**:
- Containers are ephemeral
- Data lost when container/pod restarts
- Can't share data between pods

**Solution**: Persistent Volumes
- Data survives pod restarts
- Can be shared across pods
- Independent lifecycle from pods

### 2. **Storage Components**

**PersistentVolume (PV)**:
- Cluster-level storage resource
- Created by admin or dynamically
- Has independent lifecycle
- Actual storage (NFS, cloud disks, etc.)

**PersistentVolumeClaim (PVC)**:
- Request for storage by user
- Binds to a PV
- Used in pod specs
- Like a "purchase order" for storage

**StorageClass**:
- Describes storage "classes"
- Enables dynamic provisioning
- Different performance/cost tiers
- Example: ssd, hdd, replicated

### 3. **Access Modes**

- **ReadWriteOnce (RWO)**: Single node read-write
- **ReadOnlyMany (ROX)**: Multiple nodes read-only
- **ReadWriteMany (RWX)**: Multiple nodes read-write
- **ReadWriteOncePod (RWOP)**: Single pod read-write

### 4. **Reclaim Policies**

- **Retain**: Keep data after PVC deleted (manual cleanup)
- **Delete**: Delete PV and data when PVC deleted
- **Recycle**: Wipe data, make PV available again (deprecated)

## 📁 Step-by-Step Implementation

### Step 1: Check Default StorageClass

kind includes local-path-provisioner by default:

```bash
# List StorageClasses
kubectl get storageclass

# Describe default StorageClass
kubectl describe storageclass standard

# Check local-path-provisioner
kubectl get pods -n local-path-storage
```

**Expected Output**:
```
NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE
standard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer
```

### Step 2: Create Manual PersistentVolume

```bash
# Apply manual PV (hostPath type for kind)
kubectl apply -f manifests/01-manual-pv.yaml

# Get PV
kubectl get pv

# Describe PV
kubectl describe pv manual-pv
```

**Status**: `Available` (not yet bound)

### Step 3: Create PersistentVolumeClaim

```bash
# Apply PVC
kubectl apply -f manifests/02-manual-pvc.yaml

# Get PVC
kubectl get pvc

# Check PVC status
kubectl describe pvc manual-pvc
```

**Status**: `Bound` (PVC bound to PV)

```bash
# Verify PV is now Bound
kubectl get pv manual-pv
```

### Step 4: Use PVC in Pod

```bash
# Deploy pod using PVC
kubectl apply -f manifests/03-pod-with-pvc.yaml

# Wait for pod
kubectl wait --for=condition=ready pod/pvc-demo-pod --timeout=60s

# Write data to persistent volume
kubectl exec pvc-demo-pod -- sh -c 'echo "Persistent data!" > /data/test.txt'

# Read data
kubectl exec pvc-demo-pod -- cat /data/test.txt
```

### Step 5: Test Data Persistence

```bash
# Delete the pod
kubectl delete pod pvc-demo-pod

# Recreate the pod (uses same PVC)
kubectl apply -f manifests/03-pod-with-pvc.yaml

# Wait for new pod
kubectl wait --for=condition=ready pod/pvc-demo-pod --timeout=60s

# Data should still be there!
kubectl exec pvc-demo-pod -- cat /data/test.txt
```

**Result**: Data persists across pod restarts!

### Step 6: Dynamic Provisioning with StorageClass

```bash
# Create PVC without pre-creating PV (dynamic provisioning)
kubectl apply -f manifests/04-dynamic-pvc.yaml

# PVC status is Pending (WaitForFirstConsumer)
kubectl get pvc dynamic-pvc

# Deploy pod using dynamic PVC
kubectl apply -f manifests/05-deployment-with-dynamic-pvc.yaml

# PV is automatically created!
kubectl get pv
kubectl get pvc dynamic-pvc
```

**What happened**:
1. Created PVC requesting storage
2. No matching PV exists
3. Deployed pod using PVC
4. StorageClass provisioner created PV automatically
5. PVC bound to new PV
6. Pod can use storage

### Step 7: Multiple Pods Sharing Volume (ReadWriteMany)

```bash
# Note: local-path does NOT support RWX
# This demonstrates the concept (would need NFS or cloud storage)

# See manifests/06-rwx-example.yaml for reference
cat manifests/06-rwx-example.yaml
```

### Step 8: Different Storage Classes

```bash
# Create custom StorageClass (for demonstration)
kubectl apply -f manifests/07-custom-storageclass.yaml

# Create PVC using custom storage class
kubectl apply -f manifests/08-pvc-custom-storageclass.yaml

# Check which StorageClass was used
kubectl get pvc custom-pvc -o jsonpath='{.spec.storageClassName}'
```

### Step 9: Database with Persistent Storage

```bash
# Deploy PostgreSQL with PVC
kubectl apply -f manifests/09-postgres-with-pvc.yaml

# Wait for postgres to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Create database table
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE TABLE test (id INT, name TEXT);"

# Insert data
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "INSERT INTO test VALUES (1, 'Persistent Data');"

# Delete pod
kubectl delete pod -l app=postgres

# Wait for new pod
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Data is still there!
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "SELECT * FROM test;"
```

### Step 10: Expand Volume (if supported)

```bash
# Check if StorageClass allows expansion
kubectl get storageclass standard -o jsonpath='{.allowVolumeExpansion}'

# Expand PVC (see manifests/10-expand-pvc.yaml)
# Note: Not all storage providers support expansion
```

## ✅ Verification

### 1. Check PersistentVolumes

```bash
# List all PVs
kubectl get pv

# Detailed view
kubectl get pv -o wide

# Describe specific PV
kubectl describe pv <pv-name>

# Check PV status
kubectl get pv -o jsonpath='{.items[*].status.phase}'
```

**PV Phases**:
- `Available`: Ready to be bound
- `Bound`: Bound to a PVC
- `Released`: PVC deleted but not reclaimed
- `Failed`: Reclaim failed

### 2. Check PersistentVolumeClaims

```bash
# List all PVCs
kubectl get pvc

# Detailed view
kubectl get pvc -o wide

# Describe specific PVC
kubectl describe pvc <pvc-name>

# Check which PV it's bound to
kubectl get pvc <pvc-name> -o jsonpath='{.spec.volumeName}'
```

### 3. Check StorageClasses

```bash
# List all StorageClasses
kubectl get storageclass

# Get default StorageClass
kubectl get storageclass -o jsonpath='{.items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")].metadata.name}'

# Describe StorageClass
kubectl describe storageclass standard
```

### 4. Verify Pod Volume Mounts

```bash
# Check pod volume mounts
kubectl describe pod <pod-name> | grep -A 10 "Volumes:"

# Check mounted path in pod
kubectl exec <pod-name> -- df -h /data

# List files in mounted volume
kubectl exec <pod-name> -- ls -la /data
```

## 🧪 Hands-On Exercises

### Exercise 1: Create WordPress with MySQL (Both Persistent)

```bash
# Create PVC for MySQL
kubectl create pvc mysql-pvc --storage=1Gi --access-modes=ReadWriteOnce

# Deploy MySQL with PVC
# Deploy WordPress with PVC
# Both will retain data across restarts
```

### Exercise 2: Simulate Pod Failure

```bash
# Deploy app with PVC
# Write data to volume
# Delete pod forcefully (kubectl delete pod --force)
# Verify data persists when pod recreates
```

### Exercise 3: Clone PVC

```bash
# Create new PVC from existing PVC (dataSource)
# See manifests for example
```

## 🧹 Cleanup

```bash
# Delete pods/deployments
kubectl delete deployment --all
kubectl delete pod --all

# Delete PVCs (this may delete PVs depending on reclaim policy)
kubectl delete pvc --all

# Delete PVs (if Retain policy)
kubectl delete pv --all

# Verify cleanup
kubectl get pv,pvc
```

## 📚 What You Learned

✅ Created manual PersistentVolumes
✅ Created PersistentVolumeClaims
✅ Bound PVCs to PVs
✅ Used dynamic provisioning with StorageClass
✅ Persisted data across pod restarts
✅ Deployed stateful applications (PostgreSQL)
✅ Understood access modes and reclaim policies
✅ Explored volume expansion

## 🎓 Key Concepts

### PV vs PVC Lifecycle

```
1. Provisioning
   - Static: Admin creates PV
   - Dynamic: StorageClass creates PV

2. Binding
   - PVC requests storage
   - Kubernetes binds PVC to matching PV

3. Using
   - Pod uses PVC in volume mount

4. Reclaiming
   - PVC deleted
   - PV reclaimed based on policy (Retain/Delete/Recycle)
```

### Access Modes Support by Storage Type

| Storage Type | RWO | ROX | RWX |
|--------------|-----|-----|-----|
| HostPath | ✅ | ✅ | ✅ (single node) |
| Local | ✅ | ❌ | ❌ |
| NFS | ✅ | ✅ | ✅ |
| AWS EBS | ✅ | ❌ | ❌ |
| Azure Disk | ✅ | ❌ | ❌ |
| GCE PD | ✅ | ✅ | ❌ |
| Ceph RBD | ✅ | ✅ | ❌ |
| CephFS | ✅ | ✅ | ✅ |

### Volume Binding Modes

**Immediate**:
- PV created immediately when PVC is created
- May create PV on wrong node (pod affinity issues)

**WaitForFirstConsumer** (recommended):
- PV created when first pod using PVC is scheduled
- Ensures PV is on the correct node
- Default for local storage

### StorageClass Parameters

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iopsPerGB: "50"
  fsType: ext4
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Delete
```

## 🔜 Next Steps

Move to [08_statefulset](../08_statefulset/) where you'll:
- Use PVCs with StatefulSets
- Deploy stateful applications properly
- Understand ordered deployment and scaling
- Use headless services
- Implement stable network identities

## 💡 Pro Tips

1. **Check PV/PVC binding**:
   ```bash
   kubectl get pv,pvc -o wide
   ```

2. **Force delete stuck PVC**:
   ```bash
   kubectl patch pvc <pvc-name> -p '{"metadata":{"finalizers":null}}'
   ```

3. **Resize PVC** (if allowed):
   ```bash
   kubectl patch pvc <pvc-name> -p '{"spec":{"resources":{"requests":{"storage":"2Gi"}}}}'
   ```

4. **Check actual storage usage**:
   ```bash
   kubectl exec <pod-name> -- df -h /mount-path
   ```

5. **Label PVs for organization**:
   ```bash
   kubectl label pv <pv-name> environment=production tier=database
   ```

## 🆘 Troubleshooting

**Problem**: PVC stuck in `Pending`
**Solution**: Check events and StorageClass:
```bash
kubectl describe pvc <pvc-name>
kubectl get storageclass
# Ensure StorageClass exists and is configured correctly
```

**Problem**: PVC can't bind to PV
**Solution**: Check size, access modes, and selector match:
```bash
kubectl describe pv <pv-name>
kubectl describe pvc <pvc-name>
# Ensure capacity, accessModes, and selectors match
```

**Problem**: Pod stuck in `ContainerCreating`
**Solution**: Check PVC is bound:
```bash
kubectl describe pod <pod-name>
kubectl get pvc
# Ensure PVC status is "Bound"
```

**Problem**: PVC can't be deleted (finalizer)
**Solution**: Check if PVC is in use:
```bash
kubectl describe pvc <pvc-name>
# If no pod using it, force delete:
kubectl patch pvc <pvc-name> -p '{"metadata":{"finalizers":null}}'
```

**Problem**: Out of disk space
**Solution**: Check actual usage and resize:
```bash
kubectl exec <pod-name> -- df -h
# Resize if StorageClass allows expansion
```

## 📖 Additional Reading

- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [Dynamic Volume Provisioning](https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/)
- [Volume Snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-06 completed
