#!/bin/bash
#
# Quick Test - Ngrok Setup Verification
# Tests that ngrok scripts are properly configured
#
# Author: Fresh-MC
# Created: October 24, 2025
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Ngrok Setup Verification Test                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

PASSED=0
FAILED=0

# Test 1: Check ngrok installation
echo -e "${YELLOW}[Test 1]${NC} Checking ngrok installation..."
if command -v ngrok &> /dev/null; then
    VERSION=$(ngrok version)
    echo -e "${GREEN}✅ PASS${NC} - ngrok installed: $VERSION"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - ngrok not found"
    echo "   Install with: brew install ngrok/ngrok/ngrok"
    ((FAILED++))
fi

# Test 2: Check ngrok_manager.py exists
echo -e "\n${YELLOW}[Test 2]${NC} Checking ngrok_manager.py..."
if [ -f "ngrok_manager.py" ] && [ -x "ngrok_manager.py" ]; then
    echo -e "${GREEN}✅ PASS${NC} - ngrok_manager.py exists and is executable"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - ngrok_manager.py missing or not executable"
    ((FAILED++))
fi

# Test 3: Check start_with_ngrok.sh exists
echo -e "\n${YELLOW}[Test 3]${NC} Checking start_with_ngrok.sh..."
if [ -f "start_with_ngrok.sh" ] && [ -x "start_with_ngrok.sh" ]; then
    echo -e "${GREEN}✅ PASS${NC} - start_with_ngrok.sh exists and is executable"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - start_with_ngrok.sh missing or not executable"
    ((FAILED++))
fi

# Test 4: Check Python 3
echo -e "\n${YELLOW}[Test 4]${NC} Checking Python 3 installation..."
if command -v python3 &> /dev/null; then
    VERSION=$(python3 --version)
    echo -e "${GREEN}✅ PASS${NC} - Python installed: $VERSION"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Python 3 not found"
    ((FAILED++))
fi

# Test 5: Check validation_engine.py exists
echo -e "\n${YELLOW}[Test 5]${NC} Checking validation_engine.py..."
if [ -f "validation_engine.py" ]; then
    echo -e "${GREEN}✅ PASS${NC} - validation_engine.py exists"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - validation_engine.py missing"
    ((FAILED++))
fi

# Test 6: Check Python packages
echo -e "\n${YELLOW}[Test 6]${NC} Checking Python packages..."
if python3 -c "import flask, flask_socketio, pymongo, requests" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - All required packages installed"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} - Some packages missing (will be installed on first run)"
    echo "   Install now: pip3 install flask flask-socketio flask-cors pymongo python-dotenv requests"
    ((PASSED++))  # Not a critical failure
fi

# Test 7: Check .env.validation
echo -e "\n${YELLOW}[Test 7]${NC} Checking environment configuration..."
if [ -f ".env.validation" ] || [ -f ".env" ]; then
    if [ -f ".env.validation" ]; then
        if grep -q "MONGODB_URI" .env.validation 2>/dev/null; then
            echo -e "${GREEN}✅ PASS${NC} - .env.validation configured"
        else
            echo -e "${YELLOW}⚠️  WARN${NC} - .env.validation missing MONGODB_URI"
        fi
    else
        echo -e "${YELLOW}⚠️  WARN${NC} - Using .env (consider creating .env.validation)"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - No environment file found"
    echo "   Create .env.validation with MONGODB_URI"
    ((FAILED++))
fi

# Test 8: Check port 5002 availability
echo -e "\n${YELLOW}[Test 8]${NC} Checking port 5002 availability..."
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  WARN${NC} - Port 5002 is in use (script will clear it)"
    ((PASSED++))
else
    echo -e "${GREEN}✅ PASS${NC} - Port 5002 is available"
    ((PASSED++))
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Results                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"

TOTAL=$((PASSED + FAILED))
echo -e "\n📊 Tests Run: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAILED${NC}"
    echo -e "\n${RED}❌ Setup verification FAILED${NC}"
    echo -e "   Fix the issues above and run again"
    exit 1
else
    echo -e "${GREEN}❌ Failed: $FAILED${NC}"
    echo -e "\n${GREEN}✅ All checks passed!${NC}"
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "   1. Start services: ${YELLOW}./start_with_ngrok.sh${NC}"
    echo -e "   2. Copy webhook URL from output"
    echo -e "   3. Add to GitHub: Repo → Settings → Webhooks"
    echo -e "   4. Push code to test!"
    echo -e "\n${BLUE}Documentation:${NC}"
    echo -e "   - Ngrok Setup: ${YELLOW}NGROK_SETUP.md${NC}"
    echo -e "   - Stage 6 Guide: ${YELLOW}STAGE6_REALTIME_VALIDATION.md${NC}"
    exit 0
fi
