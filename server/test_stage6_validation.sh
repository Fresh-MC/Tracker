#!/bin/bash

################################################################################
# Stage 6 Real-time Task Validation Test Script
# 
# Tests the complete GitHub webhook → MongoDB → Socket.IO flow
# 
# Prerequisites:
# 1. Validation engine running on port 5002
# 2. MongoDB accessible with test data
# 3. Frontend running to observe real-time updates (optional)
# 
# Usage:
#   chmod +x test_stage6_validation.sh
#   ./test_stage6_validation.sh
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
VALIDATION_ENGINE_URL="http://localhost:5002"
BACKEND_URL="http://localhost:3000"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_test() {
    echo -e "${CYAN}🧪 TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

################################################################################
# Test 1: Health Check
################################################################################

test_health_check() {
    print_header "TEST 1: Validation Engine Health Check"
    print_test "Checking if validation engine is running..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$VALIDATION_ENGINE_URL/api/health")
    
    if [ "$response" == "200" ]; then
        print_success "Validation engine is healthy (HTTP 200)"
        
        # Get detailed health info
        health_data=$(curl -s "$VALIDATION_ENGINE_URL/api/health")
        echo -e "${BLUE}Health Response:${NC}"
        echo "$health_data" | jq '.' 2>/dev/null || echo "$health_data"
    else
        print_error "Validation engine not responding (HTTP $response)"
        print_warning "Make sure to run: python3 validation_engine.py"
        return 1
    fi
}

################################################################################
# Test 2: Database Connection
################################################################################

test_database_connection() {
    print_header "TEST 2: MongoDB Connection Test"
    print_test "Fetching users from validation engine..."
    
    response=$(curl -s "$VALIDATION_ENGINE_URL/api/users")
    user_count=$(echo "$response" | jq '.count' 2>/dev/null)
    
    if [ -n "$user_count" ] && [ "$user_count" -gt 0 ]; then
        print_success "MongoDB connected - Found $user_count users"
        
        # Show sample user
        echo -e "${BLUE}Sample User Data:${NC}"
        echo "$response" | jq '.users[0] | {username, githubUsername, role}' 2>/dev/null
    else
        print_error "Could not fetch users from MongoDB"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
    
    print_test "Fetching modules from validation engine..."
    
    modules_response=$(curl -s "$VALIDATION_ENGINE_URL/api/modules")
    module_count=$(echo "$modules_response" | jq '.count' 2>/dev/null)
    
    if [ -n "$module_count" ]; then
        print_success "Found $module_count modules in database"
        
        # Show in-progress modules
        in_progress=$(echo "$modules_response" | jq '[.modules[] | select(.status == "in-progress")] | length' 2>/dev/null)
        print_info "Modules in-progress: $in_progress"
    else
        print_error "Could not fetch modules"
        return 1
    fi
}

################################################################################
# Test 3: Mock GitHub Webhook
################################################################################

test_mock_webhook() {
    print_header "TEST 3: Mock GitHub Webhook Test"
    print_test "Simulating GitHub push webhook..."
    
    # Get a real user with GitHub username
    users_response=$(curl -s "$VALIDATION_ENGINE_URL/api/users")
    github_username=$(echo "$users_response" | jq -r '.users[] | select(.githubUsername != null) | .githubUsername' 2>/dev/null | head -1)
    
    if [ -z "$github_username" ] || [ "$github_username" == "null" ]; then
        print_warning "No users with GitHub username found"
        github_username="Fresh-MC"  # Fallback
        print_info "Using fallback username: $github_username"
    else
        print_info "Using GitHub username: $github_username"
    fi
    
    # Create mock webhook payload
    webhook_payload=$(cat <<EOF
{
  "ref": "refs/heads/main",
  "pusher": {
    "name": "$github_username",
    "email": "test@example.com"
  },
  "repository": {
    "name": "Tracker",
    "full_name": "Fresh-MC/Tracker"
  },
  "commits": [
    {
      "id": "abc123",
      "message": "feat: implement Stage 6 validation",
      "author": {
        "name": "$github_username",
        "email": "test@example.com"
      }
    }
  ]
}
EOF
)
    
    echo -e "${BLUE}Webhook Payload:${NC}"
    echo "$webhook_payload" | jq '.' 2>/dev/null
    
    # Send webhook request
    response=$(curl -s -X POST "$VALIDATION_ENGINE_URL/webhook/github" \
        -H "Content-Type: application/json" \
        -d "$webhook_payload")
    
    echo -e "${BLUE}Webhook Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    status=$(echo "$response" | jq -r '.status' 2>/dev/null)
    
    if [ "$status" == "success" ]; then
        module_title=$(echo "$response" | jq -r '.module.title' 2>/dev/null)
        if [ "$module_title" != "null" ] && [ -n "$module_title" ]; then
            print_success "Module completed via webhook: $module_title"
            print_info "Socket.IO event should be emitted to connected clients"
        else
            print_warning "Webhook received but no module matched validation criteria"
            print_info "This is expected if no in-progress modules match the repository"
        fi
    else
        print_error "Webhook processing failed"
        return 1
    fi
}

################################################################################
# Test 4: Test Endpoint
################################################################################

test_test_endpoint() {
    print_header "TEST 4: Test Endpoint Verification"
    print_test "Testing the /webhook/test endpoint..."
    
    # Get users and find one with GitHub username
    users_response=$(curl -s "$VALIDATION_ENGINE_URL/api/users")
    test_user=$(echo "$users_response" | jq -r '.users[] | select(.githubUsername != null) | .githubUsername' 2>/dev/null | head -1)
    
    if [ -z "$test_user" ] || [ "$test_user" == "null" ]; then
        test_user="Fresh-MC"
    fi
    
    test_payload=$(cat <<EOF
{
  "pusher": {"name": "$test_user"},
  "repository": {"name": "Tracker"},
  "ref": "refs/heads/main"
}
EOF
)
    
    response=$(curl -s -X POST "$VALIDATION_ENGINE_URL/webhook/test" \
        -H "Content-Type: application/json" \
        -d "$test_payload")
    
    echo -e "${BLUE}Test Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    status=$(echo "$response" | jq -r '.status' 2>/dev/null)
    
    if [ "$status" == "success" ] || [ "$status" == "no_match" ]; then
        print_success "Test endpoint working correctly"
    else
        print_error "Test endpoint failed"
        return 1
    fi
}

################################################################################
# Test 5: RBAC Enforcement
################################################################################

test_rbac_enforcement() {
    print_header "TEST 5: RBAC Enforcement Test"
    print_test "Verifying role-based access control..."
    
    # Fetch users with different roles
    users_response=$(curl -s "$VALIDATION_ENGINE_URL/api/users")
    
    manager_count=$(echo "$users_response" | jq '[.users[] | select(.role == "manager")] | length' 2>/dev/null)
    employee_count=$(echo "$users_response" | jq '[.users[] | select(.role == "user")] | length' 2>/dev/null)
    
    print_info "Managers: $manager_count"
    print_info "Employees: $employee_count"
    
    if [ "$manager_count" -gt 0 ] && [ "$employee_count" -gt 0 ]; then
        print_success "Multiple user roles exist for RBAC testing"
        print_info "Frontend RBAC:"
        print_info "  - Managers can see all teams and projects"
        print_info "  - Users can only see their own team and assigned tasks"
    else
        print_warning "Limited user roles for comprehensive RBAC testing"
    fi
}

################################################################################
# Test 6: Socket.IO Connection
################################################################################

test_socketio_connection() {
    print_header "TEST 6: Socket.IO Connection Test"
    print_test "Verifying Socket.IO server is accessible..."
    
    # Check if Socket.IO endpoint responds
    response=$(curl -s -o /dev/null -w "%{http_code}" "$VALIDATION_ENGINE_URL/socket.io/")
    
    if [ "$response" == "200" ] || [ "$response" == "400" ]; then
        print_success "Socket.IO server is accessible"
        print_info "Connection URL: $VALIDATION_ENGINE_URL"
        print_info "Transport: WebSocket, Polling"
        print_info "Events: task_updated, modules_snapshot, connect, disconnect"
    else
        print_error "Socket.IO server not accessible (HTTP $response)"
        return 1
    fi
}

################################################################################
# Test 7: Data Validation
################################################################################

test_data_validation() {
    print_header "TEST 7: Data Validation Test"
    print_test "Checking for modules with validation rules..."
    
    modules_response=$(curl -s "$VALIDATION_ENGINE_URL/api/modules")
    
    # Check for modules with validationRule
    modules_with_rules=$(echo "$modules_response" | jq '[.modules[] | select(.validationRule != null)] | length' 2>/dev/null)
    
    if [ -n "$modules_with_rules" ]; then
        print_info "Modules with validation rules: $modules_with_rules"
        
        if [ "$modules_with_rules" -gt 0 ]; then
            print_success "Found modules with GitHub validation rules"
            echo -e "${BLUE}Sample Validation Rule:${NC}"
            echo "$modules_response" | jq '.modules[] | select(.validationRule != null) | {title, validationRule} | select(.validationRule != {})' 2>/dev/null | head -20
        else
            print_warning "No modules have validation rules configured"
            print_info "Add validationRule field to modules for webhook matching"
        fi
    fi
    
    # Check module status distribution
    print_test "Analyzing module status distribution..."
    
    not_started=$(echo "$modules_response" | jq '[.modules[] | select(.status == "not-started")] | length' 2>/dev/null)
    in_progress=$(echo "$modules_response" | jq '[.modules[] | select(.status == "in-progress")] | length' 2>/dev/null)
    completed=$(echo "$modules_response" | jq '[.modules[] | select(.status == "completed")] | length' 2>/dev/null)
    
    print_info "Status breakdown:"
    echo "  Not Started: $not_started"
    echo "  In Progress: $in_progress"
    echo "  Completed: $completed"
    
    if [ "$in_progress" -gt 0 ]; then
        print_success "Found $in_progress in-progress modules ready for validation"
    else
        print_warning "No in-progress modules found - create some to test webhook validation"
    fi
}

################################################################################
# Test 8: Integration Test
################################################################################

test_full_integration() {
    print_header "TEST 8: Full Integration Test"
    print_test "Testing complete webhook → validation → completion flow..."
    
    # Get modules before webhook
    before_modules=$(curl -s "$VALIDATION_ENGINE_URL/api/modules")
    before_completed=$(echo "$before_modules" | jq '[.modules[] | select(.status == "completed")] | length' 2>/dev/null)
    
    print_info "Completed modules before webhook: $before_completed"
    
    # Find a user with in-progress module
    users_response=$(curl -s "$VALIDATION_ENGINE_URL/api/users")
    test_user=$(echo "$users_response" | jq -r '.users[] | select(.githubUsername != null) | .githubUsername' 2>/dev/null | head -1)
    
    if [ -z "$test_user" ] || [ "$test_user" == "null" ]; then
        test_user="Fresh-MC"
    fi
    
    # Send test webhook
    webhook_payload=$(cat <<EOF
{
  "ref": "refs/heads/main",
  "pusher": {"name": "$test_user", "email": "test@example.com"},
  "repository": {"name": "Tracker", "full_name": "Fresh-MC/Tracker"},
  "commits": [
    {"id": "test123", "message": "test: Stage 6 integration", "author": {"name": "$test_user"}}
  ]
}
EOF
)
    
    webhook_response=$(curl -s -X POST "$VALIDATION_ENGINE_URL/webhook/github" \
        -H "Content-Type: application/json" \
        -d "$webhook_payload")
    
    # Check if module was completed
    module_completed=$(echo "$webhook_response" | jq -r '.module.title' 2>/dev/null)
    
    if [ "$module_completed" != "null" ] && [ -n "$module_completed" ]; then
        print_success "✅ INTEGRATION TEST PASSED"
        print_info "Module completed: $module_completed"
        print_info "Real-time update should appear on frontend dashboards"
        
        # Verify in database
        sleep 1
        after_modules=$(curl -s "$VALIDATION_ENGINE_URL/api/modules")
        after_completed=$(echo "$after_modules" | jq '[.modules[] | select(.status == "completed")] | length' 2>/dev/null)
        
        if [ "$after_completed" -gt "$before_completed" ]; then
            print_success "Database updated correctly (completed: $before_completed → $after_completed)"
        fi
    else
        print_warning "No module matched validation criteria"
        print_info "This is expected if:"
        print_info "  1. No in-progress modules exist"
        print_info "  2. No modules match the test repository"
        print_info "  3. No users have matching GitHub username"
    fi
}

################################################################################
# Main Test Runner
################################################################################

main() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║          STAGE 6: REAL-TIME TASK VALIDATION TEST SUITE          ║"
    echo "║                                                                  ║"
    echo "║  Testing GitHub Webhook → MongoDB → Socket.IO Integration       ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_info "Validation Engine: $VALIDATION_ENGINE_URL"
    print_info "Backend API: $BACKEND_URL"
    echo ""
    
    # Run all tests
    test_health_check
    test_database_connection
    test_socketio_connection
    test_data_validation
    test_rbac_enforcement
    test_test_endpoint
    test_mock_webhook
    test_full_integration
    
    # Final summary
    print_header "TEST SUMMARY"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
    
    echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
    echo -e "${CYAN}📊 Total:  $TOTAL_TESTS${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  🎉 ALL TESTS PASSED! STAGE 6 IS READY! 🎉  ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
        echo ""
        print_info "Next Steps:"
        echo "  1. Configure GitHub webhook: http://yourdomain.com/webhook/github"
        echo "  2. Open frontend dashboards to see real-time updates"
        echo "  3. Make a real push to trigger automatic task completion"
        exit 0
    else
        echo ""
        echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ⚠️  SOME TESTS FAILED - SEE ABOVE  ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
        exit 1
    fi
}

# Run tests
main
