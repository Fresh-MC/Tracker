#!/bin/bash
#
# Ngrok Authentication Setup Helper
# Guides you through setting up ngrok authtoken
#
# Author: Fresh-MC
# Created: October 24, 2025
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🔐 NGROK AUTHENTICATION SETUP                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo -e "${YELLOW}Ngrok requires a free account to use tunnels.${NC}"
echo -e "Don't worry - it's quick and completely free! ✨\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 1: Create Free Ngrok Account${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "1. Open this URL in your browser:"
echo -e "   ${GREEN}https://dashboard.ngrok.com/signup${NC}\n"

echo -e "2. Sign up with:"
echo -e "   • GitHub (recommended - fastest)"
echo -e "   • Google"
echo -e "   • Email\n"

echo -e "${YELLOW}⏸  I'll wait... Press ENTER when you've signed up...${NC}"
read -r

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 2: Get Your Authtoken${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "After signing up, you'll see your authtoken page automatically."
echo -e "If not, visit: ${GREEN}https://dashboard.ngrok.com/get-started/your-authtoken${NC}\n"

echo -e "You'll see something like this:"
echo -e "${YELLOW}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│ Your Authtoken                                              │${NC}"
echo -e "${YELLOW}│ ${GREEN}2abcXYZ123_4defGHI5678jklMNO9012pqrSTU${NC}                  ${YELLOW}│${NC}"
echo -e "${YELLOW}└─────────────────────────────────────────────────────────────┘${NC}\n"

echo -e "${YELLOW}⏸  Press ENTER when you can see your authtoken...${NC}"
read -r

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 3: Add Authtoken to Ngrok${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Now, let's add your authtoken:\n"

# Check if authtoken already exists
if [ -f "$HOME/.config/ngrok/ngrok.yml" ] && grep -q "authtoken:" "$HOME/.config/ngrok/ngrok.yml" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  You already have an authtoken configured!${NC}\n"
    echo -e "Current config: ${GREEN}$HOME/.config/ngrok/ngrok.yml${NC}\n"
    
    echo -e "Do you want to:"
    echo -e "  1) Keep existing authtoken"
    echo -e "  2) Replace with new authtoken"
    echo -e "\nChoice (1 or 2): "
    read -r choice
    
    if [ "$choice" = "1" ]; then
        echo -e "\n${GREEN}✅ Keeping existing authtoken${NC}"
        echo -e "\nLet's test if it works..."
        
        if ngrok config check 2>/dev/null; then
            echo -e "${GREEN}✅ Configuration is valid!${NC}"
        else
            echo -e "${YELLOW}⚠️  Configuration might need updating${NC}"
        fi
        
        echo -e "\n${CYAN}Ready to start validation engine + ngrok!${NC}"
        echo -e "Run: ${GREEN}./start_with_ngrok.sh${NC}\n"
        exit 0
    fi
fi

echo -e "Please paste your authtoken here:"
echo -e "(Copy it from the ngrok dashboard)\n"
echo -n "> "
read -r AUTHTOKEN

if [ -z "$AUTHTOKEN" ]; then
    echo -e "\n${RED}❌ No authtoken provided!${NC}"
    echo -e "Please run this script again and paste your authtoken.\n"
    exit 1
fi

# Validate authtoken format (basic check)
if [[ ! "$AUTHTOKEN" =~ ^[a-zA-Z0-9_-]{20,}$ ]]; then
    echo -e "\n${YELLOW}⚠️  Warning: This doesn't look like a valid authtoken.${NC}"
    echo -e "Authtokens are usually 40+ characters long.\n"
    echo -e "Continue anyway? (y/n): "
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo -e "\n${YELLOW}Setup cancelled. Please run again with correct authtoken.${NC}\n"
        exit 1
    fi
fi

echo -e "\n${CYAN}🔧 Configuring ngrok...${NC}"

# Add authtoken to ngrok
if ngrok config add-authtoken "$AUTHTOKEN" 2>&1; then
    echo -e "${GREEN}✅ Authtoken added successfully!${NC}\n"
    
    # Verify configuration
    echo -e "${CYAN}🔍 Verifying configuration...${NC}"
    if ngrok config check 2>/dev/null; then
        echo -e "${GREEN}✅ Configuration is valid!${NC}\n"
    else
        echo -e "${YELLOW}⚠️  Configuration check not available, but authtoken was added${NC}\n"
    fi
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ SUCCESS! Ngrok is now authenticated!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    echo -e "${CYAN}🎁 Benefits of your free ngrok account:${NC}"
    echo -e "   ✅ Unlimited tunnels"
    echo -e "   ✅ HTTPS tunnels included"
    echo -e "   ✅ Better connection stability"
    echo -e "   ✅ Traffic inspection dashboard"
    echo -e "   ✅ 40+ simultaneous connections\n"
    
    echo -e "${CYAN}📝 Next Steps:${NC}"
    echo -e "   1. Start validation engine + ngrok:"
    echo -e "      ${GREEN}./start_with_ngrok.sh${NC}\n"
    echo -e "   2. Copy the webhook URL from output\n"
    echo -e "   3. Add to GitHub:"
    echo -e "      Repository → Settings → Webhooks → Add webhook\n"
    echo -e "   4. Push code and watch real-time validation! ✨\n"
    
    echo -e "${YELLOW}💡 Pro tip:${NC} Your authtoken is saved to:"
    echo -e "   ${GREEN}$HOME/.config/ngrok/ngrok.yml${NC}"
    echo -e "   You only need to do this setup once!\n"
    
else
    echo -e "${RED}❌ Failed to add authtoken${NC}\n"
    echo -e "Please try running this command manually:"
    echo -e "   ${YELLOW}ngrok config add-authtoken YOUR_TOKEN${NC}\n"
    exit 1
fi
