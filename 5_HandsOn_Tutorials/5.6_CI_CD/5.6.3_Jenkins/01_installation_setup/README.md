# Tutorial 01: Jenkins Installation and Setup

## Objectives

By the end of this tutorial, you will:
- Install Jenkins on various platforms
- Configure Jenkins initial setup
- Understand Jenkins architecture and components
- Create your first Jenkins job
- Configure basic security settings
- Install essential plugins
- Set up Jenkins agents

## Prerequisites

- Basic Linux/Unix command knowledge
- Understanding of CI/CD concepts
- System with at least 4GB RAM
- Docker installed (for Docker-based setup)
- Java 11 or Java 17 installed

## What is Jenkins?

Jenkins is an open-source automation server that enables developers to build, test, and deploy their software. It's one of the most popular CI/CD tools with extensive plugin ecosystem.

## Key Concepts

### Jenkins Master
The main Jenkins server that manages pipelines, coordinates builds, and serves the UI.

### Jenkins Agent (Node)
Machines that execute jobs directed by the master. Can be configured for specific environments.

### Job
A task that Jenkins executes (build, test, deploy).

### Build
A single execution of a job.

### Plugin
Extensions that add functionality to Jenkins.

## Installation Methods

### Method 1: Docker Installation (Recommended for Learning)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    privileged: true
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
    networks:
      - jenkins

  jenkins-agent:
    image: jenkins/inbound-agent:latest
    container_name: jenkins-agent
    environment:
      - JENKINS_URL=http://jenkins:8080
      - JENKINS_SECRET=${JENKINS_AGENT_SECRET}
      - JENKINS_AGENT_NAME=docker-agent
    depends_on:
      - jenkins
    networks:
      - jenkins

volumes:
  jenkins_home:

networks:
  jenkins:
    driver: bridge
```

**Start Jenkins:**

```bash
# Start Jenkins
docker-compose up -d

# View logs
docker-compose logs -f jenkins

# Get initial admin password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Method 2: Ubuntu/Debian Installation

```bash
# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Java
sudo apt update
sudo apt install openjdk-17-jdk -y

# Install Jenkins
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check status
sudo systemctl status jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Method 3: Kubernetes Installation

**File: `jenkins-deployment.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: jenkins

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins
  namespace: jenkins

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: jenkins
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["create","delete","get","list","patch","update","watch"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create","delete","get","list","patch","update","watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get","list","watch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: jenkins
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: jenkins
subjects:
  - kind: ServiceAccount
    name: jenkins
    namespace: jenkins

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: jenkins-pvc
  namespace: jenkins
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jenkins
  namespace: jenkins
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jenkins
  template:
    metadata:
      labels:
        app: jenkins
    spec:
      serviceAccountName: jenkins
      containers:
      - name: jenkins
        image: jenkins/jenkins:lts
        ports:
        - containerPort: 8080
        - containerPort: 50000
        volumeMounts:
        - name: jenkins-home
          mountPath: /var/jenkins_home
        env:
        - name: JAVA_OPTS
          value: "-Xmx2048m -Djenkins.install.runSetupWizard=false"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      volumes:
      - name: jenkins-home
        persistentVolumeClaim:
          claimName: jenkins-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: jenkins
  namespace: jenkins
spec:
  type: LoadBalancer
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: agent
    port: 50000
    targetPort: 50000
  selector:
    app: jenkins
```

**Deploy to Kubernetes:**

```bash
kubectl apply -f jenkins-deployment.yaml
kubectl get pods -n jenkins
kubectl get svc -n jenkins
```

## Initial Setup

### Step 1: Access Jenkins UI

1. Open browser: `http://localhost:8080`
2. Enter initial admin password
3. Click "Continue"

### Step 2: Install Plugins

Choose "Install suggested plugins" or select custom plugins:

**Essential Plugins:**
- Pipeline
- Git
- Docker Pipeline
- Kubernetes
- Blue Ocean
- Credentials Binding
- SSH Agent
- Email Extension
- Slack Notification

### Step 3: Create Admin User

1. Enter username
2. Enter password
3. Enter full name
4. Enter email
5. Click "Save and Continue"

### Step 4: Configure Instance

1. Set Jenkins URL (e.g., `http://jenkins.example.com`)
2. Click "Save and Finish"
3. Click "Start using Jenkins"

## Create Your First Job

### Freestyle Project

1. Click "New Item"
2. Enter name: "hello-world"
3. Select "Freestyle project"
4. Click "OK"

Configure the job:

**Source Code Management:**
- Select "Git"
- Repository URL: `https://github.com/yourusername/your-repo.git`
- Credentials: Add if private repo

**Build Triggers:**
- Select "Poll SCM"
- Schedule: `H/5 * * * *` (every 5 minutes)

**Build:**
- Click "Add build step"
- Select "Execute shell"
- Command:
```bash
#!/bin/bash
echo "Hello from Jenkins!"
echo "Build Number: ${BUILD_NUMBER}"
echo "Job Name: ${JOB_NAME}"
echo "Workspace: ${WORKSPACE}"
ls -la
```

**Post-build Actions:**
- Archive the artifacts: `**/*.log`
- Email notification (if configured)

Click "Save"

### Run the Job

1. Click "Build Now"
2. View "Console Output"
3. Check build status

## Essential Configuration

### Configure Global Tools

**Manage Jenkins > Global Tool Configuration**

**JDK:**
```
Name: JDK-17
JAVA_HOME: /usr/lib/jvm/java-17-openjdk-amd64
```

**Git:**
```
Name: Default
Path to Git executable: git
```

**Maven:**
```
Name: Maven-3.9
Version: 3.9.0
Install automatically: ✓
```

**Docker:**
```
Name: Docker-latest
Install automatically: ✓
```

### Configure Security

**Manage Jenkins > Configure Global Security**

**Security Realm:**
- Jenkins' own user database
- Allow users to sign up: ✗

**Authorization:**
- Matrix-based security
- Add users/groups with permissions

**CSRF Protection:**
- Prevent Cross Site Request Forgery exploits: ✓

**Agent to Master Access Control:**
- Enable Agent to Master Access Control: ✓

### Configure Credentials

**Manage Jenkins > Manage Credentials**

**Add Username/Password:**
1. Click "Global credentials"
2. Click "Add Credentials"
3. Kind: "Username with password"
4. Scope: "Global"
5. Username: your-username
6. Password: your-password
7. ID: github-credentials
8. Description: GitHub Access

**Add SSH Key:**
1. Kind: "SSH Username with private key"
2. ID: ssh-key
3. Username: jenkins
4. Private Key: Enter directly or from file
5. Passphrase: (if applicable)

**Add Secret Text:**
1. Kind: "Secret text"
2. Secret: your-api-token
3. ID: api-token
4. Description: API Token

## Configure Jenkins Agent

### Docker Agent

**File: `Dockerfile.jenkins-agent`**

```dockerfile
FROM jenkins/inbound-agent:latest

USER root

# Install additional tools
RUN apt-get update && apt-get install -y \
    docker.io \
    kubectl \
    && rm -rf /var/lib/apt/lists/*

USER jenkins
```

**Build and run:**

```bash
docker build -t jenkins-agent:latest -f Dockerfile.jenkins-agent .

docker run -d \
  --name jenkins-agent \
  -e JENKINS_URL=http://jenkins:8080 \
  -e JENKINS_AGENT_NAME=docker-agent \
  -e JENKINS_SECRET=your-secret \
  jenkins-agent:latest
```

### SSH Agent

**On Agent Machine:**

```bash
# Install Java
sudo apt install openjdk-17-jdk -y

# Create jenkins user
sudo useradd -m -s /bin/bash jenkins
sudo su - jenkins

# Generate SSH key
ssh-keygen -t rsa -b 4096

# Copy public key
cat ~/.ssh/id_rsa.pub
```

**In Jenkins:**

1. Manage Jenkins > Manage Nodes and Clouds
2. Click "New Node"
3. Name: agent-01
4. Type: Permanent Agent
5. Configure:
   - Remote root directory: /home/jenkins
   - Labels: linux docker
   - Launch method: Launch agents via SSH
   - Host: agent-hostname
   - Credentials: Add SSH key
6. Save

## Backup Configuration

**Create backup script:**

```bash
#!/bin/bash

JENKINS_HOME="/var/lib/jenkins"
BACKUP_DIR="/backup/jenkins"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup Jenkins home
tar -czf ${BACKUP_DIR}/jenkins_backup_${DATE}.tar.gz \
  --exclude=${JENKINS_HOME}/workspace \
  --exclude=${JENKINS_HOME}/builds \
  ${JENKINS_HOME}

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "jenkins_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: jenkins_backup_${DATE}.tar.gz"
```

**Restore backup:**

```bash
#!/bin/bash

BACKUP_FILE=$1
JENKINS_HOME="/var/lib/jenkins"

# Stop Jenkins
sudo systemctl stop jenkins

# Restore backup
sudo tar -xzf ${BACKUP_FILE} -C /

# Fix permissions
sudo chown -R jenkins:jenkins ${JENKINS_HOME}

# Start Jenkins
sudo systemctl start jenkins
```

## Configuration as Code (JCasC)

**File: `jenkins.yaml`**

```yaml
jenkins:
  systemMessage: "Jenkins configured using JCasC"
  numExecutors: 2
  scmCheckoutRetryCount: 3
  mode: NORMAL
  
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: "admin"
          password: "${ADMIN_PASSWORD}"
          
  authorizationStrategy:
    globalMatrix:
      permissions:
        - "Overall/Administer:admin"
        - "Overall/Read:authenticated"
        
  clouds:
    - kubernetes:
        name: "kubernetes"
        serverUrl: "https://kubernetes.default"
        namespace: "jenkins"
        jenkinsUrl: "http://jenkins:8080"
        jenkinsTunnel: "jenkins:50000"
        templates:
          - name: "jenkins-agent"
            label: "jenkins-agent"
            containers:
              - name: "jnlp"
                image: "jenkins/inbound-agent:latest"
                
credentials:
  system:
    domainCredentials:
      - credentials:
          - usernamePassword:
              scope: GLOBAL
              id: "github-credentials"
              username: "your-username"
              password: "${GITHUB_TOKEN}"
              description: "GitHub Credentials"
              
tool:
  git:
    installations:
      - name: "Default"
        home: "git"
        
  maven:
    installations:
      - name: "Maven-3.9"
        properties:
          - installSource:
              installers:
                - maven:
                    id: "3.9.0"
```

## Verification Steps

### Check Installation

```bash
# Check Jenkins status
sudo systemctl status jenkins

# Check Jenkins logs
sudo journalctl -u jenkins -f

# Check Jenkins port
sudo netstat -tulpn | grep 8080

# Check Java version
java -version
```

### Access Jenkins

```bash
# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Test Jenkins CLI
java -jar jenkins-cli.jar -s http://localhost:8080/ help
```

### Test First Job

1. Create job as described above
2. Run build
3. Check console output
4. Verify artifacts

## Troubleshooting

### Issue: Port 8080 already in use

**Problem:** Jenkins can't start because port is in use.

**Solutions:**
```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill the process
sudo kill -9 <PID>

# Or change Jenkins port
# Edit /etc/default/jenkins
HTTP_PORT=8081
```

### Issue: Jenkins won't start

**Problem:** Jenkins service fails to start.

**Solutions:**
```bash
# Check logs
sudo journalctl -u jenkins -n 100

# Check Java version
java -version

# Check permissions
sudo chown -R jenkins:jenkins /var/lib/jenkins
```

### Issue: Out of memory

**Problem:** Jenkins runs out of memory.

**Solutions:**
```bash
# Edit /etc/default/jenkins
JAVA_ARGS="-Xmx4096m -XX:MaxPermSize=512m"

# Restart Jenkins
sudo systemctl restart jenkins
```

## Best Practices

### 1. Use Configuration as Code
- Define configuration in YAML
- Version control jenkins.yaml
- Automate setup with JCasC

### 2. Secure Jenkins
- Enable security realm
- Use matrix-based authorization
- Regular security updates
- Use HTTPS

### 3. Resource Management
- Configure executors appropriately
- Use agents for heavy builds
- Clean up old builds
- Monitor disk space

### 4. Regular Backups
- Backup Jenkins home
- Backup job configurations
- Test restore procedures
- Automate backups

### 5. Plugin Management
- Keep plugins updated
- Remove unused plugins
- Test plugin updates
- Document required plugins

## Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Jenkins Plugins](https://plugins.jenkins.io/)
- [Jenkins Configuration as Code](https://github.com/jenkinsci/configuration-as-code-plugin)
- [Jenkins Best Practices](https://www.jenkins.io/doc/book/using/best-practices/)

## Next Steps

After completing this tutorial:
1. Explore Jenkins UI
2. Install additional plugins
3. Configure security
4. Move on to Tutorial 02: Jenkinsfile Basics

## Summary

You've learned:
- Installing Jenkins on multiple platforms
- Initial setup and configuration
- Creating first Jenkins job
- Configuring security
- Setting up agents
- Backup and restore
- Configuration as Code
- Best practices

This foundation prepares you for building CI/CD pipelines with Jenkins.
