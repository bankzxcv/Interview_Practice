# Kubernetes Tutorial 10: Jobs and CronJobs

## 🎯 Learning Objectives

- Understand Jobs for batch processing
- Create one-time and parallel Jobs
- Implement job completion and failure handling
- Use CronJobs for scheduled tasks
- Learn about job patterns and best practices
- Handle job cleanup and history limits

## 📋 Prerequisites

- Completed previous tutorials
- kind cluster "learning" is running
- kubectl configured
- Understanding of Pods and workload controllers

## 📝 What We're Building

```
Job: one-time-job
└── Pod: one-time-job-xxxxx
    ├── Run to completion
    ├── Success or Failure
    └── Pod preserved for logs

CronJob: scheduled-backup
└── Creates Jobs on schedule
    ├── Job: scheduled-backup-1234567890
    ├── Job: scheduled-backup-1234567900
    └── Job: scheduled-backup-1234567910
```

## 🔍 Concepts Introduced

### 1. **What is a Job?**

**Purpose**:
- Run pods until successful completion
- Batch processing, one-time tasks
- Pods not restarted after completion
- Guaranteed execution (retries on failure)

**vs Deployment**:
| Job | Deployment |
|-----|------------|
| Run to completion | Run continuously |
| Terminates when done | Restarts if terminated |
| One-time or scheduled | Always running |
| Batch processing | Long-running services |

### 2. **What is a CronJob?**

**Purpose**:
- Scheduled Jobs (like cron)
- Recurring tasks at specific times
- Creates Jobs automatically
- Cron schedule syntax

**Use Cases**:
- Backups (daily, weekly)
- Report generation
- Data cleanup
- Batch imports/exports
- Health checks
- Cache warming

### 3. **Job Completion Modes**

**Non-parallel** (default):
- One pod runs to completion
- `completions: 1`

**Fixed completion count**:
- N pods must complete successfully
- `completions: N`

**Work queue**:
- Multiple pods process until work done
- `parallelism: N`

### 4. **Cron Schedule Syntax**

```
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
# │ │ │ │ │
# * * * * *

Examples:
*/5 * * * *     # Every 5 minutes
0 * * * *       # Every hour
0 0 * * *       # Every day at midnight
0 0 * * 0       # Every Sunday at midnight
0 2 1 * *       # First day of month at 2 AM
*/15 9-17 * * 1-5  # Every 15 min, 9 AM-5 PM, Mon-Fri
```

## 📁 Step-by-Step Implementation

### Step 1: Create Basic Job

```bash
# Apply simple job
kubectl apply -f manifests/01-basic-job.yaml

# Watch job creation
kubectl get jobs --watch

# Check pods
kubectl get pods

# Wait for completion
kubectl wait --for=condition=complete job/hello-job --timeout=60s

# Check job status
kubectl describe job hello-job
```

### Step 2: View Job Output

```bash
# Get pod name created by job
POD=$(kubectl get pods -l job-name=hello-job -o jsonpath='{.items[0].metadata.name}')

# View logs
kubectl logs $POD

# Check pod status (Completed)
kubectl get pod $POD
```

### Step 3: Parallel Jobs (Fixed Completions)

```bash
# Apply job with 5 completions, 2 parallel
kubectl apply -f manifests/02-parallel-job.yaml

# Watch multiple pods running
kubectl get pods --watch

# Check job progress
kubectl describe job parallel-job

# Wait for all completions
kubectl wait --for=condition=complete job/parallel-job --timeout=120s
```

### Step 4: Work Queue Pattern

```bash
# Apply work queue job
kubectl apply -f manifests/03-work-queue-job.yaml

# Multiple pods process work in parallel
kubectl get pods -l job-name=work-queue-job --watch

# Check completion
kubectl get job work-queue-job
```

### Step 5: Job with Backoff Limit

```bash
# Apply job that fails initially
kubectl apply -f manifests/04-job-with-backoff.yaml

# Watch retries
kubectl get pods --watch

# If job keeps failing, it stops after backoffLimit retries
kubectl describe job failing-job

# Check events for failure reasons
kubectl get events | grep failing-job
```

### Step 6: Create CronJob

```bash
# Apply CronJob (runs every minute)
kubectl apply -f manifests/05-basic-cronjob.yaml

# Watch CronJob
kubectl get cronjobs --watch

# Wait for job creation (up to 60 seconds)
sleep 65

# Check jobs created by CronJob
kubectl get jobs

# Check pods
kubectl get pods -l job-name
```

### Step 7: Explore CronJob Schedule

```bash
# Describe CronJob
kubectl describe cronjob hello-cron

# Check last schedule time
kubectl get cronjob hello-cron -o jsonpath='{.status.lastScheduleTime}'

# Check active jobs
kubectl get cronjob hello-cron -o jsonpath='{.status.active}'
```

### Step 8: Suspend and Resume CronJob

```bash
# Suspend CronJob (stop scheduling new jobs)
kubectl patch cronjob hello-cron -p '{"spec":{"suspend":true}}'

# Verify suspended
kubectl get cronjob hello-cron

# Resume CronJob
kubectl patch cronjob hello-cron -p '{"spec":{"suspend":false}}'
```

### Step 9: CronJob with History Limits

```bash
# Apply CronJob with history limits
kubectl apply -f manifests/06-cronjob-history-limits.yaml

# Wait for multiple job runs
sleep 180  # Wait 3 minutes for 3 jobs

# Check jobs (only recent ones kept)
kubectl get jobs -l parent-cronjob=backup-job

# Old completed jobs are automatically deleted
```

### Step 10: Cleanup Jobs

```bash
# Manual cleanup: Delete job
kubectl delete job hello-job

# This also deletes associated pods
kubectl get pods

# Automatic cleanup with TTL
kubectl apply -f manifests/07-job-with-ttl.yaml

# Job automatically deleted 100 seconds after completion
```

## ✅ Verification

### 1. Check Job Status

```bash
# List all jobs
kubectl get jobs

# Detailed view
kubectl get jobs -o wide

# Describe job
kubectl describe job my-job

# Check completion status
kubectl get job my-job -o jsonpath='{.status.succeeded}'
```

**Job Status Fields**:
- `COMPLETIONS`: Desired vs actual completions
- `DURATION`: Time to complete
- `AGE`: How long ago job was created

### 2. Verify Job Pods

```bash
# Get pods created by job
kubectl get pods -l job-name=my-job

# Count completed pods
kubectl get pods -l job-name=my-job --field-selector=status.phase=Succeeded

# View logs from all job pods
kubectl logs -l job-name=my-job
```

### 3. Check CronJob Status

```bash
# List CronJobs
kubectl get cronjobs

# Describe CronJob
kubectl describe cronjob my-cronjob

# Check schedule
kubectl get cronjob my-cronjob -o jsonpath='{.spec.schedule}'

# Check last schedule time
kubectl get cronjob my-cronjob -o jsonpath='{.status.lastScheduleTime}'

# Check if suspended
kubectl get cronjob my-cronjob -o jsonpath='{.spec.suspend}'
```

### 4. View CronJob History

```bash
# Get jobs created by CronJob
kubectl get jobs -l parent-cronjob=my-cronjob

# Sort by creation time
kubectl get jobs -l parent-cronjob=my-cronjob --sort-by=.metadata.creationTimestamp

# Check last 3 jobs
kubectl get jobs -l parent-cronjob=my-cronjob --sort-by=.metadata.creationTimestamp | tail -4
```

### 5. Test Job Failure Handling

```bash
# Create job that fails
kubectl apply -f manifests/04-job-with-backoff.yaml

# Watch retry attempts
kubectl get pods --watch

# Check backoff status
kubectl describe job failing-job | grep -A 10 "Events:"

# Delete failed job
kubectl delete job failing-job
```

## 🧪 Hands-On Exercises

### Exercise 1: Database Backup Job

```bash
# Create job that backs up database
# Runs once, saves to PVC
# Verify backup file created
```

### Exercise 2: Daily Cleanup CronJob

```bash
# Create CronJob that runs daily
# Deletes old files from volume
# Logs cleanup results
```

### Exercise 3: Batch Processing

```bash
# Create parallel job
# Process 100 items
# Use 10 parallel workers
# Track completion time
```

## 🧹 Cleanup

```bash
# Delete all jobs
kubectl delete job --all

# Delete all CronJobs
kubectl delete cronjob --all

# Completed pods might remain
kubectl delete pods --field-selector=status.phase=Succeeded

# Failed pods
kubectl delete pods --field-selector=status.phase=Failed

# Verify cleanup
kubectl get jobs,cronjobs,pods
```

## 📚 What You Learned

✅ Created and managed Jobs
✅ Implemented parallel job execution
✅ Handled job failures and retries
✅ Created CronJobs for scheduled tasks
✅ Managed job history and cleanup
✅ Used TTL for automatic job deletion
✅ Suspended and resumed CronJobs
✅ Understood job completion patterns

## 🎓 Key Concepts

### Job Completion Guarantees

**At-least-once**:
- Job retries on failure
- Same work might be done multiple times
- Design work to be idempotent

**Exactly-once**:
- Not guaranteed by Kubernetes
- Implement in application logic
- Use unique identifiers, database constraints

### Job Patterns

**1. Single Job (one pod)**:
```yaml
completions: 1
parallelism: 1
```

**2. Fixed Completions (N sequential)**:
```yaml
completions: 5
parallelism: 1  # One at a time
```

**3. Fixed Completions (N parallel)**:
```yaml
completions: 5
parallelism: 2  # Two at a time
```

**4. Work Queue (parallel until done)**:
```yaml
completions: <not set>
parallelism: 3
```

### CronJob Concurrency Policy

**Allow** (default):
```yaml
concurrencyPolicy: Allow
```
- Multiple jobs can run concurrently

**Forbid**:
```yaml
concurrencyPolicy: Forbid
```
- Skip new job if previous still running

**Replace**:
```yaml
concurrencyPolicy: Replace
```
- Cancel old job, start new one

### Job TTL (Time To Live)

```yaml
spec:
  ttlSecondsAfterFinished: 100
```
- Automatically delete job after completion
- Includes associated pods
- Prevents job accumulation

### CronJob Starting Deadline

```yaml
spec:
  startingDeadlineSeconds: 100
```
- Skip job if can't start within deadline
- Useful if old jobs are irrelevant

## 🔜 Next Steps

**Congratulations!** You've completed all Kubernetes tutorials!

**What's Next**:
- Review and practice all tutorials
- Build real applications using these concepts
- Explore advanced topics:
  - Helm charts
  - Operators
  - Service meshes (Istio, Linkerd)
  - GitOps (ArgoCD, Flux)
  - Security (OPA, Falco)
  - Observability (Prometheus, Grafana)

## 💡 Pro Tips

1. **Trigger CronJob manually**:
   ```bash
   kubectl create job --from=cronjob/my-cronjob manual-run-1
   ```

2. **Debug failed job**:
   ```bash
   kubectl logs -l job-name=my-job
   kubectl describe job my-job
   kubectl get events | grep my-job
   ```

3. **Delete all completed jobs**:
   ```bash
   kubectl delete jobs --field-selector=status.successful=1
   ```

4. **Delete all failed jobs**:
   ```bash
   kubectl delete jobs --field-selector=status.successful=0
   ```

5. **Set resource limits for jobs**:
   ```yaml
   spec:
     template:
       spec:
         containers:
         - name: job
           resources:
             limits:
               memory: "1Gi"
               cpu: "500m"
   ```

## 🆘 Troubleshooting

**Problem**: Job never completes
**Solution**: Check pod logs and events:
```bash
kubectl logs -l job-name=my-job
kubectl describe job my-job
kubectl get events
```

**Problem**: CronJob not creating jobs
**Solution**: Check schedule and suspension:
```bash
kubectl describe cronjob my-cronjob
kubectl get cronjob my-cronjob -o yaml | grep -A 3 "schedule\|suspend"
```

**Problem**: Too many failed pods
**Solution**: Set backoffLimit:
```yaml
spec:
  backoffLimit: 3  # Stop after 3 failures
```

**Problem**: Old jobs accumulating
**Solution**: Use TTL or history limits:
```yaml
# For Jobs:
spec:
  ttlSecondsAfterFinished: 3600

# For CronJobs:
spec:
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
```

**Problem**: Job pods still running after delete
**Solution**: Force delete:
```bash
kubectl delete job my-job --grace-period=0 --force
```

## 📖 Additional Reading

- [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [Automated Tasks with CronJobs](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/)
- [Parallel Processing with Jobs](https://kubernetes.io/docs/tasks/job/parallel-processing-expansion/)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-09 completed

**Congratulations on completing all 10 Kubernetes tutorials!** 🎉
