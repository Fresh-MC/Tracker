#!/bin/bash

# ============================================
# Stage 8 AI Assistant - Integration Test Script
# ============================================

echo "🧪 Testing Stage 8 AI Assistant & PDF Reports"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
TOKEN="" # Will be set from login

# ============================================
# Helper Functions
# ============================================

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# ============================================
# Test 1: Login and Get Token
# ============================================

echo "Test 1: Login"
echo "-------------------"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Login failed. Please ensure test user exists."
    print_info "Run: node server/src/seed.js"
    exit 1
fi

print_success "Login successful. Token obtained."
echo ""

# ============================================
# Test 2: Get Quick Summary
# ============================================

echo "Test 2: Quick Summary"
echo "-------------------"

SUMMARY_RESPONSE=$(curl -s -X GET "$API_URL/api/ai/summary" \
  -H "Authorization: Bearer $TOKEN")

HEALTH_SCORE=$(echo $SUMMARY_RESPONSE | grep -o '"healthScore":[0-9]*' | cut -d':' -f2)

if [ -z "$HEALTH_SCORE" ]; then
    print_error "Quick summary failed"
    echo $SUMMARY_RESPONSE
else
    print_success "Quick summary successful. Health Score: $HEALTH_SCORE"
fi

echo ""

# ============================================
# Test 3: Chat with AI Assistant
# ============================================

echo "Test 3: Chat with AI Assistant"
echo "-------------------"

CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/assistant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"Summarize my week"}')

SUCCESS=$(echo $CHAT_RESPONSE | grep -o '"success":true')

if [ -z "$SUCCESS" ]; then
    print_error "AI chat failed"
    echo $CHAT_RESPONSE
else
    print_success "AI chat successful"
    
    # Show insights (first 100 characters)
    INSIGHTS=$(echo $CHAT_RESPONSE | grep -o '"insights":"[^"]*' | cut -d'"' -f4 | head -c 100)
    print_info "Insights: $INSIGHTS..."
fi

echo ""

# ============================================
# Test 4: Generate PDF Report
# ============================================

echo "Test 4: Generate PDF Report"
echo "-------------------"

REPORT_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/reports/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

FILENAME=$(echo $REPORT_RESPONSE | grep -o '"filename":"[^"]*' | cut -d'"' -f4)

if [ -z "$FILENAME" ]; then
    print_error "Report generation failed"
    echo $REPORT_RESPONSE
else
    print_success "Report generated: $FILENAME"
    
    # Check if file exists
    if [ -f "server/reports/$FILENAME" ]; then
        print_success "Report file exists in server/reports/"
        
        # Get file size
        FILE_SIZE=$(du -h "server/reports/$FILENAME" | cut -f1)
        print_info "File size: $FILE_SIZE"
    else
        print_error "Report file not found in server/reports/"
    fi
fi

echo ""

# ============================================
# Test 5: Download Report
# ============================================

if [ ! -z "$FILENAME" ]; then
    echo "Test 5: Download Report"
    echo "-------------------"
    
    DOWNLOAD_URL="$API_URL/api/ai/reports/download/$FILENAME"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$DOWNLOAD_URL" \
      -H "Authorization: Bearer $TOKEN")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_success "Report download successful (HTTP 200)"
    else
        print_error "Report download failed (HTTP $HTTP_CODE)"
    fi
    
    echo ""
fi

# ============================================
# Test 6: Get Report History
# ============================================

echo "Test 6: Report History"
echo "-------------------"

HISTORY_RESPONSE=$(curl -s -X GET "$API_URL/api/ai/reports/history?limit=5" \
  -H "Authorization: Bearer $TOKEN")

REPORT_COUNT=$(echo $HISTORY_RESPONSE | grep -o '"filename"' | wc -l)

if [ "$REPORT_COUNT" -gt 0 ]; then
    print_success "Report history retrieved: $REPORT_COUNT reports found"
else
    print_info "No reports in history yet"
fi

echo ""

# ============================================
# Test 7: Clear Expired Cache
# ============================================

echo "Test 7: Clear Expired Cache"
echo "-------------------"

CACHE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/ai/reports/cache/clear" \
  -H "Authorization: Bearer $TOKEN")

DELETED_COUNT=$(echo $CACHE_RESPONSE | grep -o '"deletedCount":[0-9]*' | cut -d':' -f2)

print_success "Cache cleared: $DELETED_COUNT entries deleted"

echo ""

# ============================================
# Summary
# ============================================

echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
print_info "All tests completed. Check results above."
echo ""
print_info "Frontend URL: http://localhost:5174/ai-insights"
print_info "Backend URL: $API_URL"
echo ""
print_info "Next steps:"
echo "  1. Open http://localhost:5174/ai-insights in browser"
echo "  2. Test chat interface with various queries"
echo "  3. Download PDF reports and verify formatting"
echo "  4. Check server/reports/ directory for generated PDFs"
echo ""
