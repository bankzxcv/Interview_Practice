#!/bin/bash

# Istio Installation Verification Script
# This script verifies that Istio is correctly installed and configured

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${BOLD}Istio Installation Verification${NC}\n"

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info
info() {
    echo -e "${BOLD}→${NC} $1"
}

# 1. Check if istioctl is installed
echo -e "${BOLD}1. Checking istioctl installation...${NC}"
if command -v istioctl &> /dev/null; then
    VERSION=$(istioctl version --short 2>/dev/null || echo "unknown")
    success "istioctl is installed (version: $VERSION)"
else
    error "istioctl is not installed"
    echo "  Install with: curl -L https://istio.io/downloadIstio | sh -"
    exit 1
fi

# 2. Check Kubernetes connection
echo -e "\n${BOLD}2. Checking Kubernetes connection...${NC}"
if kubectl cluster-info &> /dev/null; then
    success "Connected to Kubernetes cluster"
else
    error "Cannot connect to Kubernetes cluster"
    exit 1
fi

# 3. Check Istio namespace
echo -e "\n${BOLD}3. Checking Istio namespace...${NC}"
if kubectl get namespace istio-system &> /dev/null; then
    success "istio-system namespace exists"
else
    error "istio-system namespace not found"
    exit 1
fi

# 4. Check Istio control plane
echo -e "\n${BOLD}4. Checking Istio control plane (istiod)...${NC}"
ISTIOD_READY=$(kubectl get deployment -n istio-system istiod -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
ISTIOD_DESIRED=$(kubectl get deployment -n istio-system istiod -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

if [ "$ISTIOD_READY" -gt 0 ] && [ "$ISTIOD_READY" -eq "$ISTIOD_DESIRED" ]; then
    success "Istiod is running ($ISTIOD_READY/$ISTIOD_DESIRED replicas)"
else
    error "Istiod is not ready ($ISTIOD_READY/$ISTIOD_DESIRED replicas)"
fi

# 5. Check Istio ingress gateway
echo -e "\n${BOLD}5. Checking Istio ingress gateway...${NC}"
if kubectl get deployment -n istio-system istio-ingressgateway &> /dev/null; then
    INGRESS_READY=$(kubectl get deployment -n istio-system istio-ingressgateway -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    INGRESS_DESIRED=$(kubectl get deployment -n istio-system istio-ingressgateway -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

    if [ "$INGRESS_READY" -gt 0 ] && [ "$INGRESS_READY" -eq "$INGRESS_DESIRED" ]; then
        success "Ingress gateway is running ($INGRESS_READY/$INGRESS_DESIRED replicas)"
    else
        warning "Ingress gateway is not ready ($INGRESS_READY/$INGRESS_DESIRED replicas)"
    fi
else
    warning "Ingress gateway not found (optional component)"
fi

# 6. Check Istio egress gateway
echo -e "\n${BOLD}6. Checking Istio egress gateway...${NC}"
if kubectl get deployment -n istio-system istio-egressgateway &> /dev/null; then
    EGRESS_READY=$(kubectl get deployment -n istio-system istio-egressgateway -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    EGRESS_DESIRED=$(kubectl get deployment -n istio-system istio-egressgateway -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

    if [ "$EGRESS_READY" -gt 0 ] && [ "$EGRESS_READY" -eq "$EGRESS_DESIRED" ]; then
        success "Egress gateway is running ($EGRESS_READY/$EGRESS_DESIRED replicas)"
    else
        warning "Egress gateway is not ready ($EGRESS_READY/$EGRESS_DESIRED replicas)"
    fi
else
    warning "Egress gateway not found (optional component)"
fi

# 7. Check Istio CRDs
echo -e "\n${BOLD}7. Checking Istio Custom Resource Definitions...${NC}"
CRD_COUNT=$(kubectl get crd | grep -c istio.io || echo "0")
if [ "$CRD_COUNT" -gt 0 ]; then
    success "Found $CRD_COUNT Istio CRDs"
else
    error "No Istio CRDs found"
fi

# 8. Check namespace injection
echo -e "\n${BOLD}8. Checking namespace injection labels...${NC}"
LABELED_NS=$(kubectl get namespaces -l istio-injection=enabled -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
if [ -n "$LABELED_NS" ]; then
    success "Found labeled namespaces: $LABELED_NS"
else
    warning "No namespaces labeled for automatic sidecar injection"
    info "Label a namespace with: kubectl label namespace <name> istio-injection=enabled"
fi

# 9. Verify Istio installation
echo -e "\n${BOLD}9. Running istioctl verify-install...${NC}"
if istioctl verify-install &> /dev/null; then
    success "Istio installation verified successfully"
else
    warning "Istio verification has warnings (see details above)"
fi

# 10. Check for sample application
echo -e "\n${BOLD}10. Checking sample application...${NC}"
if kubectl get namespace sample-app &> /dev/null; then
    ECHO_PODS=$(kubectl get pods -n sample-app -l app=echo --field-selector=status.phase=Running -o name 2>/dev/null | wc -l)
    if [ "$ECHO_PODS" -gt 0 ]; then
        success "Sample application is running ($ECHO_PODS pods)"

        # Check for sidecars
        FIRST_POD=$(kubectl get pods -n sample-app -l app=echo --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [ -n "$FIRST_POD" ]; then
            CONTAINERS=$(kubectl get pod -n sample-app "$FIRST_POD" -o jsonpath='{.spec.containers[*].name}')
            if echo "$CONTAINERS" | grep -q "istio-proxy"; then
                success "Sidecar injection is working (istio-proxy found)"
            else
                warning "Sidecar not found in pod $FIRST_POD"
            fi
        fi
    else
        info "Sample application not deployed yet"
    fi
else
    info "Sample application namespace not found"
    info "Deploy with: kubectl apply -f sample-app.yaml"
fi

# 11. Analyze mesh
echo -e "\n${BOLD}11. Analyzing Istio mesh...${NC}"
ANALYSIS=$(istioctl analyze -A 2>&1)
if echo "$ANALYSIS" | grep -q "No validation issues found"; then
    success "No validation issues found"
else
    warning "Mesh analysis found issues:"
    echo "$ANALYSIS"
fi

# 12. Check resource usage
echo -e "\n${BOLD}12. Checking resource usage...${NC}"
kubectl top pods -n istio-system 2>/dev/null || warning "Metrics not available (metrics-server may not be installed)"

# Summary
echo -e "\n${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}Verification Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"

PODS_STATUS=$(kubectl get pods -n istio-system --no-headers 2>/dev/null | wc -l)
success "Istio pods running: $PODS_STATUS"

VERSION_INFO=$(istioctl version --short 2>/dev/null | head -n 1)
success "Istio version: $VERSION_INFO"

echo -e "\n${BOLD}Next Steps:${NC}"
echo "1. Deploy sample application: kubectl apply -f sample-app.yaml"
echo "2. Test service mesh: kubectl exec -n sample-app curl-client -- curl echo-service:8080"
echo "3. Check proxy status: istioctl proxy-status"
echo "4. Explore observability: kubectl port-forward -n istio-system svc/kiali 20001:20001"

echo -e "\n${GREEN}Istio verification completed!${NC}"
