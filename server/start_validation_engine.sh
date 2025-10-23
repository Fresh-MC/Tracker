#!/bin/bash

# Validation Engine Quick Start Script
# This script sets up and runs the Flask + SocketIO validation engine

echo "=========================================="
echo "🚀 Validation Engine Quick Start"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    echo "Please install Python 3 first: https://www.python.org/downloads/"
    exit 1
fi

echo -e "${GREEN}✅ Python 3 found${NC}"
python3 --version

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 is not installed${NC}"
    echo "Please install pip3 first"
    exit 1
fi

echo -e "${GREEN}✅ pip3 found${NC}"

# Check if requirements file exists
if [ ! -f "requirements-validation.txt" ]; then
    echo -e "${RED}❌ requirements-validation.txt not found${NC}"
    echo "Please run this script from the server directory"
    exit 1
fi

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pip3 install -r requirements-validation.txt

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check if validation_engine.py exists
if [ ! -f "validation_engine.py" ]; then
    echo -e "${RED}❌ validation_engine.py not found${NC}"
    echo "Please run this script from the server directory"
    exit 1
fi

# Run the validation engine
echo ""
echo -e "${GREEN}🚀 Starting Validation Engine...${NC}"
echo ""

python3 validation_engine.py
