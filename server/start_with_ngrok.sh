#!/bin/bash
#
# Start Validation Engine with Ngrok Tunnel
# Runs Flask validation engine and ngrok concurrently with proper logging
#
# Author: Fresh-MC
# Created: October 24, 2025
#

set -e  # Exit on error

# ==================== COLORS ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================== CONFIGURATION ====================
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FLASK_PORT=5002
LOG_DIR="$SCRIPT_DIR/logs"
FLASK_LOG="$LOG_DIR/validation_engine.log"
NGROK_LOG="$LOG_DIR/ngrok_manager.log"
FLASK_PID_FILE="$SCRIPT_DIR/.validation_engine.pid"
NGROK_PID_FILE="$SCRIPT_DIR/.ngrok_manager.pid"

# ==================== FUNCTIONS ====================

print_banner() {
    echo -e "${CYAN}"
    echo "======================================================================"
    echo "  🚀 VALIDATION ENGINE + NGROK TUNNEL LAUNCHER"
    echo "======================================================================"
    echo -e "${NC}"
}

check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 not found${NC}"
        exit 1
    fi
    echo -e "   ✅ Python 3: $(python3 --version)"
    
    # Check ngrok
    if ! command -v ngrok &> /dev/null; then
        echo -e "${RED}❌ ngrok not found${NC}"
        echo -e "${YELLOW}   Install with: brew install ngrok/ngrok/ngrok${NC}"
        exit 1
    fi
    echo -e "   ✅ ngrok: $(ngrok version)"
    
    # Check validation_engine.py
    if [ ! -f "$SCRIPT_DIR/validation_engine.py" ]; then
        echo -e "${RED}❌ validation_engine.py not found${NC}"
        exit 1
    fi
    echo -e "   ✅ validation_engine.py found"
    
    # Check ngrok_manager.py
    if [ ! -f "$SCRIPT_DIR/ngrok_manager.py" ]; then
        echo -e "${RED}❌ ngrok_manager.py not found${NC}"
        exit 1
    fi
    echo -e "   ✅ ngrok_manager.py found"
    
    # Check Python packages
    echo -e "\n${BLUE}📦 Checking Python packages...${NC}"
    if ! python3 -c "import flask, flask_socketio, pymongo" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Some packages missing. Installing...${NC}"
        pip3 install -r requirements-validation.txt || {
            echo -e "${RED}❌ Failed to install packages${NC}"
            exit 1
        }
    fi
    echo -e "   ✅ All required packages installed"
}

cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill Flask process
    if [ -f "$FLASK_PID_FILE" ]; then
        FLASK_PID=$(cat "$FLASK_PID_FILE")
        if ps -p "$FLASK_PID" > /dev/null 2>&1; then
            echo -e "   Stopping validation engine (PID: $FLASK_PID)..."
            kill "$FLASK_PID" 2>/dev/null || true
            sleep 2
            # Force kill if still running
            if ps -p "$FLASK_PID" > /dev/null 2>&1; then
                kill -9 "$FLASK_PID" 2>/dev/null || true
            fi
        fi
        rm -f "$FLASK_PID_FILE"
    fi
    
    # Kill ngrok process
    if [ -f "$NGROK_PID_FILE" ]; then
        NGROK_PID=$(cat "$NGROK_PID_FILE")
        if ps -p "$NGROK_PID" > /dev/null 2>&1; then
            echo -e "   Stopping ngrok manager (PID: $NGROK_PID)..."
            kill "$NGROK_PID" 2>/dev/null || true
            sleep 2
            # Force kill if still running
            if ps -p "$NGROK_PID" > /dev/null 2>&1; then
                kill -9 "$NGROK_PID" 2>/dev/null || true
            fi
        fi
        rm -f "$NGROK_PID_FILE"
    fi
    
    # Kill any remaining ngrok processes
    pkill -f "ngrok http $FLASK_PORT" 2>/dev/null || true
    
    # Clean up URL file
    rm -f "$SCRIPT_DIR/ngrok_url.txt"
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

check_port() {
    if lsof -Pi :$FLASK_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $FLASK_PORT is already in use${NC}"
        echo -e "${YELLOW}   Killing existing process...${NC}"
        lsof -ti:$FLASK_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

create_log_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        echo -e "${GREEN}✅ Created log directory: $LOG_DIR${NC}"
    fi
}

start_validation_engine() {
    echo -e "\n${MAGENTA}🔥 Starting Flask validation engine...${NC}"
    
    # Start Flask in background
    nohup python3 "$SCRIPT_DIR/validation_engine.py" > "$FLASK_LOG" 2>&1 &
    FLASK_PID=$!
    echo "$FLASK_PID" > "$FLASK_PID_FILE"
    
    echo -e "   PID: $FLASK_PID"
    echo -e "   Log: $FLASK_LOG"
    echo -e "   Port: $FLASK_PORT"
    
    # Wait for Flask to start
    echo -e "   ⏳ Waiting for Flask to initialize..."
    sleep 5
    
    # Check if Flask is running
    if ! ps -p "$FLASK_PID" > /dev/null 2>&1; then
        echo -e "${RED}❌ Flask failed to start. Check logs:${NC}"
        tail -n 20 "$FLASK_LOG"
        cleanup
        exit 1
    fi
    
    # Health check
    MAX_RETRIES=10
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s "http://localhost:$FLASK_PORT/api/health" > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Flask is running and healthy${NC}"
            return 0
        fi
        echo -e "   Attempt $i/$MAX_RETRIES..."
        sleep 2
    done
    
    echo -e "${RED}❌ Flask health check failed. Check logs:${NC}"
    tail -n 20 "$FLASK_LOG"
    cleanup
    exit 1
}

start_ngrok_manager() {
    echo -e "\n${MAGENTA}🌐 Starting ngrok tunnel manager...${NC}"
    
    # Start ngrok manager in background
    nohup python3 "$SCRIPT_DIR/ngrok_manager.py" > "$NGROK_LOG" 2>&1 &
    NGROK_PID=$!
    echo "$NGROK_PID" > "$NGROK_PID_FILE"
    
    echo -e "   PID: $NGROK_PID"
    echo -e "   Log: $NGROK_LOG"
    
    # Wait for ngrok to start
    echo -e "   ⏳ Waiting for ngrok tunnel..."
    sleep 8
    
    # Check if ngrok is running
    if ! ps -p "$NGROK_PID" > /dev/null 2>&1; then
        echo -e "${RED}❌ ngrok failed to start. Check logs:${NC}"
        tail -n 20 "$NGROK_LOG"
        cleanup
        exit 1
    fi
    
    echo -e "${GREEN}   ✅ ngrok tunnel manager started${NC}"
}

display_status() {
    echo -e "\n${GREEN}"
    echo "======================================================================"
    echo "  ✅ ALL SERVICES RUNNING"
    echo "======================================================================"
    echo -e "${NC}"
    
    echo -e "${CYAN}📊 Status:${NC}"
    echo -e "   🔥 Flask validation engine: ${GREEN}RUNNING${NC} (PID: $(cat $FLASK_PID_FILE))"
    echo -e "   🌐 ngrok tunnel manager:    ${GREEN}RUNNING${NC} (PID: $(cat $NGROK_PID_FILE))"
    
    # Check for ngrok URL
    if [ -f "$SCRIPT_DIR/ngrok_url.txt" ]; then
        echo -e "\n${CYAN}🔗 Public URLs:${NC}"
        cat "$SCRIPT_DIR/ngrok_url.txt"
    else
        echo -e "\n${YELLOW}⏳ Waiting for ngrok URL (check $NGROK_LOG)${NC}"
    fi
    
    echo -e "\n${CYAN}📝 Logs:${NC}"
    echo -e "   Flask:  tail -f $FLASK_LOG"
    echo -e "   ngrok:  tail -f $NGROK_LOG"
    
    echo -e "\n${CYAN}🌐 Web Interfaces:${NC}"
    echo -e "   Flask API:       http://localhost:$FLASK_PORT/api/health"
    echo -e "   ngrok Dashboard: http://localhost:4040"
    
    echo -e "\n${YELLOW}💡 Tips:${NC}"
    echo -e "   - Press Ctrl+C to stop all services"
    echo -e "   - Monitor in real-time: tail -f $FLASK_LOG"
    echo -e "   - View ngrok traffic: open http://localhost:4040"
    echo -e "   - Webhook endpoint: <ngrok_url>/webhook/github"
    
    echo -e "\n${GREEN}=====================================================================${NC}\n"
}

monitor_services() {
    echo -e "${CYAN}👀 Monitoring services (Press Ctrl+C to stop)...${NC}\n"
    
    while true; do
        sleep 10
        
        # Check Flask
        if [ -f "$FLASK_PID_FILE" ]; then
            FLASK_PID=$(cat "$FLASK_PID_FILE")
            if ! ps -p "$FLASK_PID" > /dev/null 2>&1; then
                echo -e "${RED}❌ Flask process died! Check $FLASK_LOG${NC}"
                cleanup
                exit 1
            fi
        fi
        
        # Check ngrok
        if [ -f "$NGROK_PID_FILE" ]; then
            NGROK_PID=$(cat "$NGROK_PID_FILE")
            if ! ps -p "$NGROK_PID" > /dev/null 2>&1; then
                echo -e "${RED}❌ ngrok process died! Check $NGROK_LOG${NC}"
                cleanup
                exit 1
            fi
        fi
        
        echo -e "${GREEN}✅ All services healthy [$(date +%H:%M:%S)]${NC}"
    done
}

# ==================== MAIN ====================

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_banner
    check_dependencies
    check_port
    create_log_dir
    start_validation_engine
    start_ngrok_manager
    display_status
    monitor_services
}

main
