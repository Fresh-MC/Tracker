#!/bin/bash

###############################################################################
# Stage 7 Analytics Testing Suite
# 
# Tests:
# 1. Analytics API endpoints (summary, project, team, user)
# 2. RBAC enforcement (unauthorized access attempts)
# 3. MongoDB aggregation pipeline results
# 4. Response data structure validation
# 5. Error handling (invalid IDs, missing auth)
#
# Prerequisites:
# - Backend server running on http://localhost:3000
# - MongoDB with sample data (users, teams, projects with modules)
# - Valid JWT tokens for different roles (manager, team_lead, user)
#
# Usage:
#   chmod +x test_stage7_analytics.sh
#   ./test_stage7_analytics.sh
###############################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000/api"
ANALYTICS_URL="${API_BASE_URL}/analytics"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# JWT Tokens (replace with actual tokens from your system)
# To get tokens: Login as each user type and copy from localStorage or network tab
MANAGER_TOKEN=""
TEAM_LEAD_TOKEN=""
USER_TOKEN=""
INVALID_TOKEN="invalid.jwt.token"

# Test IDs (replace with actual IDs from your database)
PROJECT_ID=""
TEAM_ID=""
USER_ID=""
INVALID_ID="507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent

###############################################################################
# Helper Functions
###############################################################################

print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST ${TESTS_RUN}: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1\n"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1\n"
    ((TESTS_FAILED++))
}

run_test() {
    ((TESTS_RUN++))
    print_test "$1"
}

check_response() {
    local response="$1"
    local expected_status="$2"
    local test_name="$3"
    
    # Extract HTTP status code from response
    status=$(echo "$response" | grep "HTTP/" | awk '{print $2}')
    
    if [ "$status" == "$expected_status" ]; then
        print_pass "$test_name (Status: $status)"
        return 0
    else
        print_fail "$test_name (Expected: $expected_status, Got: $status)"
        return 1
    fi
}

check_json_field() {
    local response="$1"
    local field="$2"
    local test_name="$3"
    
    # Extract JSON body from response
    body=$(echo "$response" | sed -n '/^{/,/^}/p')
    
    if echo "$body" | grep -q "\"$field\""; then
        print_pass "$test_name (Field '$field' exists)"
        return 0
    else
        print_fail "$test_name (Field '$field' missing)"
        echo "Response body: $body"
        return 1
    fi
}

###############################################################################
# Configuration Check
###############################################################################

print_section "Configuration Check"

if [ -z "$MANAGER_TOKEN" ] || [ -z "$TEAM_LEAD_TOKEN" ] || [ -z "$USER_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: JWT tokens not configured${NC}"
    echo "To run full tests:"
    echo "1. Login as manager, team_lead, and user"
    echo "2. Copy JWT tokens from localStorage or network requests"
    echo "3. Update MANAGER_TOKEN, TEAM_LEAD_TOKEN, USER_TOKEN variables in this script"
    echo ""
    echo "Running limited tests without authentication..."
    echo ""
fi

if [ -z "$PROJECT_ID" ] || [ -z "$TEAM_ID" ] || [ -z "$USER_ID" ]; then
    echo -e "${YELLOW}⚠️  Warning: Test IDs not configured${NC}"
    echo "To run full tests:"
    echo "1. Get a valid project ID from your database"
    echo "2. Get a valid team ID from your database"
    echo "3. Get a valid user ID from your database"
    echo "4. Update PROJECT_ID, TEAM_ID, USER_ID variables in this script"
    echo ""
fi

###############################################################################
# Test 1: Server Health Check
###############################################################################

print_section "Test 1: Server Health Check"

run_test "Check if backend server is running"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${API_BASE_URL}/health" 2>/dev/null || echo "CONNECTION_FAILED")

if echo "$response" | grep -q "CONNECTION_FAILED"; then
    print_fail "Backend server is not running at ${API_BASE_URL}"
    echo "Please start the backend server:"
    echo "  cd server && npm run dev"
    exit 1
else
    print_pass "Backend server is responding"
fi

###############################################################################
# Test 2: Analytics Summary Endpoint (No Auth)
###############################################################################

print_section "Test 2: Analytics Summary - Authentication Required"

run_test "GET /analytics/summary without authentication (should fail)"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${ANALYTICS_URL}/summary")
status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$status" == "401" ] || [ "$status" == "403" ]; then
    print_pass "Correctly rejected unauthenticated request (Status: $status)"
else
    print_fail "Should reject unauthenticated request (Expected: 401/403, Got: $status)"
fi

run_test "GET /analytics/summary with invalid token (should fail)"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer ${INVALID_TOKEN}" \
    "${ANALYTICS_URL}/summary")
status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$status" == "401" ] || [ "$status" == "403" ]; then
    print_pass "Correctly rejected invalid token (Status: $status)"
else
    print_fail "Should reject invalid token (Expected: 401/403, Got: $status)"
fi

###############################################################################
# Test 3: Analytics Summary with Valid Auth
###############################################################################

if [ -n "$MANAGER_TOKEN" ]; then
    print_section "Test 3: Analytics Summary - Manager Access"

    run_test "GET /analytics/summary as manager"
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${MANAGER_TOKEN}" \
        "${ANALYTICS_URL}/summary")
    
    check_response "$response" "200" "Manager can access summary analytics"
    
    # Check for expected fields in response
    body=$(echo "$response" | sed -n '/^{/,/^}/p')
    
    if echo "$body" | grep -q '"success":true'; then
        print_pass "Response has success=true"
    else
        print_fail "Response should have success=true"
    fi
    
    if echo "$body" | grep -q '"data"'; then
        print_pass "Response contains data field"
    else
        print_fail "Response should contain data field"
    fi
    
    # Check for key analytics fields
    if echo "$body" | grep -q '"totalProjects"'; then
        print_pass "Summary contains totalProjects"
    else
        print_fail "Summary should contain totalProjects"
    fi
    
    if echo "$body" | grep -q '"totalModules"'; then
        print_pass "Summary contains totalModules"
    else
        print_fail "Summary should contain totalModules"
    fi
    
    if echo "$body" | grep -q '"completionRate"'; then
        print_pass "Summary contains completionRate"
    else
        print_fail "Summary should contain completionRate"
    fi
fi

###############################################################################
# Test 4: Project Analytics
###############################################################################

if [ -n "$MANAGER_TOKEN" ] && [ -n "$PROJECT_ID" ]; then
    print_section "Test 4: Project Analytics"

    run_test "GET /analytics/projects/:projectId as manager"
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${MANAGER_TOKEN}" \
        "${ANALYTICS_URL}/projects/${PROJECT_ID}")
    
    check_response "$response" "200" "Manager can access project analytics"
    
    body=$(echo "$response" | sed -n '/^{/,/^}/p')
    
    # Check for project-specific fields
    if echo "$body" | grep -q '"project"'; then
        print_pass "Response contains project details"
    else
        print_fail "Response should contain project details"
    fi
    
    if echo "$body" | grep -q '"overview"'; then
        print_pass "Response contains overview metrics"
    else
        print_fail "Response should contain overview metrics"
    fi
    
    if echo "$body" | grep -q '"modulesByStatus"'; then
        print_pass "Response contains modulesByStatus breakdown"
    else
        print_fail "Response should contain modulesByStatus"
    fi
    
    if echo "$body" | grep -q '"completionTrend"'; then
        print_pass "Response contains completionTrend data"
    else
        print_fail "Response should contain completionTrend"
    fi
    
    # Test with invalid project ID
    run_test "GET /analytics/projects/:projectId with invalid ID"
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${MANAGER_TOKEN}" \
        "${ANALYTICS_URL}/projects/${INVALID_ID}")
    
    status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
    if [ "$status" == "404" ]; then
        print_pass "Correctly returns 404 for non-existent project"
    else
        print_fail "Should return 404 for non-existent project (Got: $status)"
    fi
fi

###############################################################################
# Test 5: Team Analytics
###############################################################################

if [ -n "$MANAGER_TOKEN" ] && [ -n "$TEAM_ID" ]; then
    print_section "Test 5: Team Analytics"

    run_test "GET /analytics/teams/:teamId as manager"
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${MANAGER_TOKEN}" \
        "${ANALYTICS_URL}/teams/${TEAM_ID}")
    
    check_response "$response" "200" "Manager can access team analytics"
    
    body=$(echo "$response" | sed -n '/^{/,/^}/p')
    
    # Check for team-specific fields
    if echo "$body" | grep -q '"team"'; then
        print_pass "Response contains team details"
    else
        print_fail "Response should contain team details"
    fi
    
    if echo "$body" | grep -q '"leaderboard"'; then
        print_pass "Response contains leaderboard"
    else
        print_fail "Response should contain leaderboard"
    fi
    
    if echo "$body" | grep -q '"velocity"'; then
        print_pass "Response contains velocity metrics"
    else
        print_fail "Response should contain velocity"
    fi
    
    if echo "$body" | grep -q '"atRiskMembers"'; then
        print_pass "Response contains atRiskMembers"
    else
        print_fail "Response should contain atRiskMembers"
    fi
fi

###############################################################################
# Test 6: User Analytics
###############################################################################

if [ -n "$USER_TOKEN" ] && [ -n "$USER_ID" ]; then
    print_section "Test 6: User Analytics"

    run_test "GET /analytics/users/:userId as user (own data)"
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        "${ANALYTICS_URL}/users/${USER_ID}")
    
    check_response "$response" "200" "User can access their own analytics"
    
    body=$(echo "$response" | sed -n '/^{/,/^}/p')
    
    if echo "$body" | grep -q '"user"'; then
        print_pass "Response contains user details"
    else
        print_fail "Response should contain user details"
    fi
    
    if echo "$body" | grep -q '"overview"'; then
        print_pass "Response contains personal overview"
    else
        print_fail "Response should contain overview"
    fi
    
    if echo "$body" | grep -q '"projectBreakdown"'; then
        print_pass "Response contains projectBreakdown"
    else
        print_fail "Response should contain projectBreakdown"
    fi
    
    if echo "$body" | grep -q '"activityTrend"'; then
        print_pass "Response contains activityTrend"
    else
        print_fail "Response should contain activityTrend"
    fi
fi

###############################################################################
# Test 7: RBAC - Unauthorized Access
###############################################################################

if [ -n "$USER_TOKEN" ] && [ -n "$TEAM_ID" ]; then
    print_section "Test 7: RBAC - Unauthorized Team Access"

    run_test "Regular user tries to access different team analytics (should fail)"
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        "${ANALYTICS_URL}/teams/${TEAM_ID}")
    
    status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
    
    if [ "$status" == "403" ]; then
        print_pass "Correctly denied access to other team's analytics (Status: 403)"
    else
        print_fail "Should deny access to other team's analytics (Expected: 403, Got: $status)"
    fi
fi

###############################################################################
# Test 8: Response Performance
###############################################################################

if [ -n "$MANAGER_TOKEN" ]; then
    print_section "Test 8: Response Performance"

    run_test "Measure summary analytics response time"
    start_time=$(date +%s%N)
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer ${MANAGER_TOKEN}" \
        "${ANALYTICS_URL}/summary")
    end_time=$(date +%s%N)
    
    duration=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    if [ "$duration" -lt 2000 ]; then
        print_pass "Summary analytics responds in ${duration}ms (< 2s)"
    else
        echo -e "${YELLOW}⚠️  Warning${NC}: Summary analytics took ${duration}ms (> 2s)"
        echo "Consider optimizing MongoDB aggregation pipelines"
    fi
fi

###############################################################################
# Test 9: Data Integrity
###############################################################################

if [ -n "$MANAGER_TOKEN" ]; then
    print_section "Test 9: Data Integrity"

    run_test "Verify completion rate calculation"
    response=$(curl -s -H "Authorization: Bearer ${MANAGER_TOKEN}" \
        "${ANALYTICS_URL}/summary")
    
    body=$(echo "$response" | sed -n '/^{/,/^}/p')
    
    # Extract totalModules, completedModules, completionRate
    totalModules=$(echo "$body" | grep -o '"totalModules":[0-9]*' | cut -d':' -f2)
    completedModules=$(echo "$body" | grep -o '"completedModules":[0-9]*' | cut -d':' -f2)
    completionRate=$(echo "$body" | grep -o '"completionRate":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$totalModules" ] && [ -n "$completedModules" ] && [ "$totalModules" -gt 0 ]; then
        expected_rate=$(( (completedModules * 100) / totalModules ))
        
        if [ "$completionRate" -eq "$expected_rate" ]; then
            print_pass "Completion rate correctly calculated: ${completionRate}%"
        else
            print_fail "Completion rate mismatch (Expected: ${expected_rate}%, Got: ${completionRate}%)"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping: Insufficient data for calculation${NC}"
    fi
fi

###############################################################################
# Test Summary
###############################################################################

print_section "Test Summary"

echo "Tests Run:    ${TESTS_RUN}"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}\n"
    exit 1
fi
