# Kubernetes Tutorial 11: Advanced CronJobs

## 🎯 Learning Objectives

- Master CronJob scheduling patterns
- Implement production CronJob patterns
- Handle concurrency policies
- Manage job history and cleanup
- Implement idempotent job handlers
- Use starting deadlines and time zones
- Monitor and troubleshoot scheduled jobs
- Implement backup and maintenance tasks

## 📋 Prerequisites

- Completed tutorials 01-10
- kind cluster "learning" is running
- kubectl configured
- Understanding of Jobs (Tutorial 10)

## 📝 What We're Building

```
Production CronJob Stack:
├── Database Backup (daily at 2 AM)
├── Log Cleanup (every 6 hours)
├── Report Generation (weekdays at 9 AM)
├── Health Check (every 5 minutes)
├── Data Sync (hourly during business hours)
└── Certificate Rotation (monthly)
```

## 🔍 Concepts Deep Dive

### 1. **CronJob Anatomy**

**Complete Structure**:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-cronjob
spec:
  # Schedule in cron format
  schedule: "*/5 * * * *"

  # Time zone (Kubernetes 1.25+)
  timeZone: "America/New_York"

  # Job concurrency control
  concurrencyPolicy: Forbid  # Allow, Forbid, Replace

  # How long to wait if job can't start on time
  startingDeadlineSeconds: 200

  # Keep last 3 successful jobs
  successfulJobsHistoryLimit: 3

  # Keep last 1 failed job
  failedJobsHistoryLimit: 1

  # Suspend scheduling (maintenance mode)
  suspend: false

  # Job template
  jobTemplate:
    spec:
      # Delete job 1 hour after completion
      ttlSecondsAfterFinished: 3600
      # Job spec
      template:
        spec:
          containers:
          - name: job
            image: busybox
          restartPolicy: OnFailure
```

### 2. **Cron Schedule Patterns**

**Basic Syntax**:
```
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
# │ │ │ │ │
# * * * * *
```

**Common Patterns**:
```bash
# Every minute
*/1 * * * *

# Every 5 minutes
*/5 * * * *

# Every hour at minute 0
0 * * * *

# Every day at midnight
0 0 * * *

# Every day at 2:30 AM
30 2 * * *

# Every Monday at 9 AM
0 9 * * 1

# First day of every month at midnight
0 0 1 * *

# Every weekday at 9 AM
0 9 * * 1-5

# Every 15 minutes during business hours (9 AM - 5 PM), weekdays only
*/15 9-17 * * 1-5

# Twice a day (6 AM and 6 PM)
0 6,18 * * *

# Every quarter (Jan, Apr, Jul, Oct) on the 1st at midnight
0 0 1 1,4,7,10 *

# Last day of month (run daily, job checks if tomorrow is new month)
0 0 * * *
```

### 3. **Concurrency Policies**

**Allow (Default)**:
```yaml
concurrencyPolicy: Allow
```
- Multiple jobs can run simultaneously
- Use when: Jobs are independent, parallel execution OK
- Risk: Resource exhaustion if jobs pile up

**Forbid**:
```yaml
concurrencyPolicy: Forbid
```
- Skip new job if previous still running
- Use when: Jobs must not overlap (e.g., database maintenance)
- Risk: Missed executions if jobs run long

**Replace**:
```yaml
concurrencyPolicy: Replace
```
- Kill old job, start new one
- Use when: Only latest execution matters
- Risk: Incomplete work from killed jobs

### 4. **Starting Deadline**

**Purpose**: Handle missed schedules
```yaml
startingDeadlineSeconds: 200
```

**Behavior**:
- If job can't start within 200 seconds of scheduled time, skip it
- Without this: CronJob might start many missed jobs at once
- Use when: Old jobs are irrelevant (e.g., "current price" snapshot)

**Example Scenario**:
- Schedule: Every minute
- Cluster down: 10 minutes
- Without deadline: 10 jobs start at once when cluster recovers
- With deadline (100s): Only jobs from last 100 seconds start

### 5. **Time Zones (Kubernetes 1.25+)**

```yaml
spec:
  schedule: "0 9 * * *"  # 9 AM
  timeZone: "America/New_York"  # EST/EDT
```

**Before Kubernetes 1.25**:
- All schedules in UTC
- Must convert to UTC manually

**After Kubernetes 1.25**:
- Specify time zone explicitly
- Handles DST automatically

### 6. **Idempotency**

**Why It Matters**:
- Jobs might run multiple times
- Network failures, retries
- Design for at-least-once execution

**Strategies**:

**1. Unique Identifiers**:
```bash
#!/bin/bash
# Use timestamp + random for uniqueness
JOB_ID=$(date +%s)-$RANDOM
echo "Processing job $JOB_ID"
```

**2. Check Before Act**:
```bash
#!/bin/bash
if [ -f /backup/today-backup.tar.gz ]; then
  echo "Backup already exists, skipping"
  exit 0
fi
# Perform backup
```

**3. Database Constraints**:
```sql
INSERT INTO jobs (job_id, timestamp)
VALUES ('unique-id', NOW())
ON CONFLICT (job_id) DO NOTHING;
```

## 📁 Step-by-Step Implementation

### Step 1: Database Backup CronJob

```bash
# Apply backup CronJob (daily at 2 AM)
kubectl apply -f manifests/01-database-backup.yaml

# Check CronJob
kubectl get cronjob backup-database

# Manual trigger for testing
kubectl create job --from=cronjob/backup-database manual-backup-test

# Watch job execution
kubectl get jobs --watch

# Check logs
kubectl logs -l job-name=manual-backup-test
```

### Step 2: Log Cleanup CronJob

```bash
# Apply cleanup CronJob (every 6 hours)
kubectl apply -f manifests/02-log-cleanup.yaml

# Check schedule
kubectl get cronjob log-cleanup -o jsonpath='{.spec.schedule}'

# Manual trigger
kubectl create job --from=cronjob/log-cleanup manual-cleanup

# Verify cleanup
kubectl logs -l job-name=manual-cleanup
```

### Step 3: Report Generation with Concurrency Control

```bash
# Apply report CronJob with Forbid policy
kubectl apply -f manifests/03-report-generation.yaml

# Trigger multiple manual jobs quickly
kubectl create job --from=cronjob/generate-reports manual-report-1
sleep 2
kubectl create job --from=cronjob/generate-reports manual-report-2

# Check job status - second might be skipped or delayed
kubectl get jobs

# Describe CronJob
kubectl describe cronjob generate-reports
```

### Step 4: Health Check with Short Interval

```bash
# Apply health check CronJob (every 5 minutes)
kubectl apply -f manifests/04-health-check.yaml

# Wait for automatic execution
sleep 300  # Wait 5 minutes

# Check jobs created
kubectl get jobs -l cronjob=health-check

# View recent health checks
kubectl logs -l cronjob=health-check --tail=50
```

### Step 5: Business Hours Data Sync

```bash
# Apply data sync (hourly, 9 AM - 5 PM, weekdays)
kubectl apply -f manifests/05-business-hours-sync.yaml

# Check next schedule time
kubectl get cronjob data-sync -o jsonpath='{.status.lastScheduleTime}'

# Describe to see schedule
kubectl describe cronjob data-sync
```

### Step 6: CronJob with Starting Deadline

```bash
# Apply CronJob with starting deadline
kubectl apply -f manifests/06-with-starting-deadline.yaml

# Simulate missed schedule by suspending
kubectl patch cronjob deadline-job -p '{"spec":{"suspend":true}}'

# Wait past several schedule times
sleep 180

# Resume - only recent jobs start
kubectl patch cronjob deadline-job -p '{"spec":{"suspend":false}}'

# Check how many jobs started
kubectl get jobs -l cronjob=deadline-job
```

### Step 7: CronJob with Time Zone

```bash
# Apply CronJob with specific time zone
kubectl apply -f manifests/07-timezone-aware.yaml

# Check time zone setting
kubectl get cronjob timezone-job -o jsonpath='{.spec.timeZone}'

# Describe to see schedule interpretation
kubectl describe cronjob timezone-job
```

### Step 8: Suspend and Resume Operations

```bash
# Suspend all CronJobs (maintenance mode)
kubectl get cronjobs -o name | xargs -I {} kubectl patch {} -p '{"spec":{"suspend":true}}'

# Verify all suspended
kubectl get cronjobs

# Resume specific CronJob
kubectl patch cronjob backup-database -p '{"spec":{"suspend":false}}'

# Resume all
kubectl get cronjobs -o name | xargs -I {} kubectl patch {} -p '{"spec":{"suspend":false}}'
```

### Step 9: Certificate Rotation CronJob

```bash
# Apply monthly certificate rotation
kubectl apply -f manifests/08-cert-rotation.yaml

# Manual trigger for testing
kubectl create job --from=cronjob/cert-rotation test-rotation

# Check execution
kubectl logs -l job-name=test-rotation

# Verify certificate updated
kubectl get secret tls-cert -o jsonpath='{.metadata.annotations.lastRotation}'
```

### Step 10: Cleanup Old Resources

```bash
# Apply cleanup CronJob that removes old resources
kubectl apply -f manifests/09-resource-cleanup.yaml

# This job cleans up old completed jobs
# Manual trigger
kubectl create job --from=cronjob/cleanup-old-jobs manual-cleanup

# Check what it cleans
kubectl logs -l job-name=manual-cleanup
```

## ✅ Verification

### 1. Check CronJob Status

```bash
# List all CronJobs
kubectl get cronjobs

# Wide output shows schedule and suspend status
kubectl get cronjobs -o wide

# Check specific CronJob
kubectl describe cronjob backup-database

# Get schedule
kubectl get cronjob backup-database -o jsonpath='{.spec.schedule}'

# Check if suspended
kubectl get cronjob backup-database -o jsonpath='{.spec.suspend}'

# Check last schedule time
kubectl get cronjob backup-database -o jsonpath='{.status.lastScheduleTime}'

# Check active jobs
kubectl get cronjob backup-database -o jsonpath='{.status.active}'
```

### 2. View Job History

```bash
# Get jobs from specific CronJob
kubectl get jobs -l cronjob=backup-database

# Sort by creation time
kubectl get jobs -l cronjob=backup-database --sort-by=.metadata.creationTimestamp

# Count successful vs failed
kubectl get jobs -l cronjob=backup-database --field-selector status.successful=1 | wc -l
kubectl get jobs -l cronjob=backup-database --field-selector status.successful=0 | wc -l

# View last 5 jobs
kubectl get jobs -l cronjob=backup-database --sort-by=.metadata.creationTimestamp | tail -6
```

### 3. Monitor Job Execution

```bash
# Watch for new jobs
kubectl get jobs --watch

# Stream logs from CronJob pods
kubectl logs -l cronjob=backup-database -f --tail=100

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp | grep cronjob

# Check resource usage
kubectl top pods -l cronjob=backup-database
```

### 4. Verify Concurrency Policy

```bash
# Create multiple manual jobs from same CronJob
for i in {1..3}; do
  kubectl create job --from=cronjob/generate-reports test-$i
  sleep 1
done

# Check how many are running (depends on concurrencyPolicy)
kubectl get jobs -l cronjob=generate-reports

# With Forbid: Only one runs
# With Allow: All run
# With Replace: Latest runs, others terminated
```

### 5. Test Starting Deadline

```bash
# Suspend CronJob
kubectl patch cronjob deadline-job -p '{"spec":{"suspend":true}}'

# Wait past several schedule intervals
sleep 300

# Resume
kubectl patch cronjob deadline-job -p '{"spec":{"suspend":false}}'

# Check jobs created (should respect startingDeadlineSeconds)
kubectl get jobs -l cronjob=deadline-job
```

## 🧪 Hands-On Exercises

### Exercise 1: Implement Backup Strategy

**Task**: Create comprehensive backup CronJobs
```bash
# 1. Full backup: Weekly (Sunday 2 AM)
# 2. Incremental backup: Daily (2 AM)
# 3. Transaction log backup: Hourly
# 4. Backup verification: Daily (3 AM)
# 5. Old backup cleanup: Weekly (Sunday 4 AM)
```

**Verification**:
```bash
kubectl get cronjobs -l component=backup
kubectl get jobs -l component=backup
```

### Exercise 2: Multi-Stage Report Pipeline

**Task**: Create report generation pipeline
```bash
# 1. Data extraction: Daily at 6 AM
# 2. Data processing: Daily at 6:30 AM (after extraction)
# 3. Report generation: Daily at 7 AM (after processing)
# 4. Report distribution: Daily at 7:30 AM (after generation)
```

**Hint**: Use concurrencyPolicy: Forbid and proper timing

### Exercise 3: Maintenance Windows

**Task**: Implement maintenance tasks
```bash
# 1. Database vacuum: Weekly (Sunday 3 AM)
# 2. Index rebuild: Monthly (1st Sunday 4 AM)
# 3. Statistics update: Daily (3 AM)
# 4. Cache warming: Hourly during business hours
```

### Exercise 4: Monitoring and Alerting

**Task**: Create monitoring CronJobs
```bash
# 1. Disk space check: Every 15 minutes
# 2. Service health check: Every 5 minutes
# 3. Certificate expiry check: Daily
# 4. Backup integrity check: Weekly
```

## 🧹 Cleanup

```bash
# Delete all CronJobs
kubectl delete cronjob --all

# This also stops scheduling new jobs

# Delete all jobs created by CronJobs
kubectl delete jobs --all

# Delete completed pods
kubectl delete pods --field-selector=status.phase=Succeeded

# Delete failed pods
kubectl delete pods --field-selector=status.phase=Failed

# Verify cleanup
kubectl get cronjobs,jobs,pods
```

## 📚 What You Learned

✅ Advanced CronJob scheduling patterns
✅ Production concurrency policies
✅ Starting deadline handling
✅ Time zone configuration
✅ Job history management
✅ Idempotent job design
✅ Manual job triggering
✅ CronJob monitoring and troubleshooting

## 🎓 Key Concepts

### CronJob Best Practices

**1. Set Resource Limits**:
```yaml
spec:
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: job
            resources:
              requests:
                memory: "256Mi"
                cpu: "100m"
              limits:
                memory: "512Mi"
                cpu: "200m"
```

**2. Use Appropriate Concurrency Policy**:
- Database maintenance: `Forbid`
- Data collection: `Allow`
- Cache refresh: `Replace`

**3. Set History Limits**:
```yaml
spec:
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
```

**4. Use TTL for Jobs**:
```yaml
spec:
  jobTemplate:
    spec:
      ttlSecondsAfterFinished: 3600
```

**5. Implement Idempotency**:
- Check before act
- Use unique identifiers
- Handle retries gracefully

**6. Set Starting Deadline**:
```yaml
spec:
  startingDeadlineSeconds: 200
```

**7. Monitor and Alert**:
- Failed jobs
- Long-running jobs
- Missed schedules

### Production Patterns

**Pattern 1: Backup Strategy**
```yaml
# Full backup - weekly
schedule: "0 2 * * 0"
concurrencyPolicy: Forbid

# Incremental - daily
schedule: "0 2 * * 1-6"
concurrencyPolicy: Forbid

# Cleanup old backups - weekly
schedule: "0 4 * * 0"
```

**Pattern 2: Report Generation**
```yaml
# Generate reports
schedule: "0 9 * * 1-5"
concurrencyPolicy: Forbid
startingDeadlineSeconds: 3600

# Distribute reports
schedule: "30 9 * * 1-5"
concurrencyPolicy: Forbid
```

**Pattern 3: Maintenance Windows**
```yaml
# Low-traffic hours
schedule: "0 2 * * *"
concurrencyPolicy: Forbid

# Business hours
schedule: "0 9-17 * * 1-5"
concurrencyPolicy: Allow
```

### Testing CronJobs

**1. Manual Trigger**:
```bash
kubectl create job --from=cronjob/my-cronjob test-run
```

**2. Temporarily Change Schedule**:
```bash
# Change to every minute for testing
kubectl patch cronjob my-cronjob -p '{"spec":{"schedule":"*/1 * * * *"}}'

# Watch execution
kubectl get jobs --watch

# Restore original schedule
kubectl patch cronjob my-cronjob -p '{"spec":{"schedule":"0 2 * * *"}}'
```

**3. Suspend During Maintenance**:
```bash
kubectl patch cronjob my-cronjob -p '{"spec":{"suspend":true}}'
```

## 🔜 Next Steps

**Tutorial 12**: RBAC - ServiceAccounts, Roles, and RoleBindings
- Implement security boundaries
- Control access to resources
- Create service accounts for jobs

## 💡 Pro Tips

1. **Check next execution time**:
   ```bash
   # Install kubecron plugin
   kubectl cronjob next my-cronjob
   ```

2. **Debug schedule format**:
   ```bash
   # Use crontab.guru for validation
   # Or describe CronJob to see interpretation
   kubectl describe cronjob my-cronjob
   ```

3. **Delete all jobs from CronJob**:
   ```bash
   kubectl delete jobs -l cronjob=my-cronjob
   ```

4. **Find CronJobs creating too many jobs**:
   ```bash
   kubectl get jobs --all-namespaces -o json | \
     jq -r '.items[] | select(.metadata.ownerReferences[0].kind=="CronJob") |
     .metadata.ownerReferences[0].name' | sort | uniq -c | sort -rn
   ```

5. **Monitor failed CronJob executions**:
   ```bash
   kubectl get jobs --all-namespaces --field-selector status.successful=0
   ```

6. **Export CronJob schedule as crontab**:
   ```bash
   kubectl get cronjob -o jsonpath='{range .items[*]}{.spec.schedule}{"\t"}{.metadata.name}{"\n"}{end}'
   ```

## 🆘 Troubleshooting

**Problem**: CronJob not running at expected time
**Solution**:
```bash
# Check schedule
kubectl get cronjob my-cronjob -o yaml | grep schedule

# Check if suspended
kubectl get cronjob my-cronjob -o jsonpath='{.spec.suspend}'

# Check events
kubectl describe cronjob my-cronjob

# Verify timezone (Kubernetes 1.25+)
kubectl get cronjob my-cronjob -o jsonpath='{.spec.timeZone}'
```

**Problem**: Jobs piling up, not completing
**Solution**:
```bash
# Check concurrency policy
kubectl get cronjob my-cronjob -o jsonpath='{.spec.concurrencyPolicy}'

# Check active jobs
kubectl get jobs -l cronjob=my-cronjob

# Set concurrencyPolicy to Forbid or Replace
kubectl patch cronjob my-cronjob -p '{"spec":{"concurrencyPolicy":"Forbid"}}'

# Delete stuck jobs
kubectl delete jobs -l cronjob=my-cronjob
```

**Problem**: Too many old jobs/pods
**Solution**:
```bash
# Set history limits
kubectl patch cronjob my-cronjob -p '{"spec":{"successfulJobsHistoryLimit":3,"failedJobsHistoryLimit":1}}'

# Set TTL on jobs
kubectl patch cronjob my-cronjob -p '{"spec":{"jobTemplate":{"spec":{"ttlSecondsAfterFinished":3600}}}}'

# Manual cleanup
kubectl delete jobs -l cronjob=my-cronjob
```

**Problem**: Missed schedules after cluster downtime
**Solution**:
```bash
# Set starting deadline to prevent backlog
kubectl patch cronjob my-cronjob -p '{"spec":{"startingDeadlineSeconds":200}}'

# Or manually clean up
kubectl delete jobs -l cronjob=my-cronjob
```

**Problem**: Time zone issues
**Solution**:
```bash
# Kubernetes 1.25+: Set time zone
kubectl patch cronjob my-cronjob -p '{"spec":{"timeZone":"America/New_York"}}'

# Before 1.25: Convert to UTC
# 9 AM EST = 2 PM UTC in winter, 1 PM UTC in summer
# Use UTC schedule: "0 14 * * *" (winter) or "0 13 * * *" (summer)
```

**Problem**: Job always fails
**Solution**:
```bash
# Check recent logs
kubectl logs -l cronjob=my-cronjob --tail=100

# Describe failed job
JOB=$(kubectl get jobs -l cronjob=my-cronjob --field-selector status.successful=0 -o name | head -1)
kubectl describe $JOB

# Check pod logs
POD=$(kubectl get pods -l cronjob=my-cronjob --field-selector status.phase=Failed -o name | head -1)
kubectl logs $POD

# Suspend while fixing
kubectl patch cronjob my-cronjob -p '{"spec":{"suspend":true}}'
```

## 📖 Additional Reading

- [CronJob Official Docs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [Cron Schedule Syntax](https://en.wikipedia.org/wiki/Cron)
- [Time Zones in CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/#time-zones)
- [Job Patterns](https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-patterns)

---

**Estimated Time**: 90 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorial 10 completed

**Next**: Tutorial 12 - RBAC and Security
