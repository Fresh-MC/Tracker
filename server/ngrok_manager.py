#!/usr/bin/env python3
"""
Ngrok Tunnel Manager
Manages ngrok tunnel for Flask validation engine with auto-restart capabilities.

Features:
- Starts ngrok tunnel on port 5002
- Fetches and displays public URL from ngrok API
- Auto-restarts on disconnect
- Saves public URL to file for easy access
- Monitors tunnel health

Author: Fresh-MC
Created: October 24, 2025
"""

import subprocess
import time
import requests
import json
import signal
import sys
from datetime import datetime
from pathlib import Path

# ==================== CONFIGURATION ====================

FLASK_PORT = 5002
NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels"
URL_FILE = Path(__file__).parent / "ngrok_url.txt"
MAX_RESTART_ATTEMPTS = 5
HEALTH_CHECK_INTERVAL = 30  # seconds

# ==================== GLOBAL STATE ====================

ngrok_process = None
restart_count = 0

# ==================== SIGNAL HANDLERS ====================

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n\n🛑 Shutting down ngrok tunnel...')
    cleanup()
    sys.exit(0)

def cleanup():
    """Clean up ngrok process"""
    global ngrok_process
    if ngrok_process:
        print('   Terminating ngrok process...')
        ngrok_process.terminate()
        try:
            ngrok_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            ngrok_process.kill()
        print('   ✅ ngrok stopped')
    
    # Clean up URL file
    if URL_FILE.exists():
        URL_FILE.unlink()
        print(f'   🗑️  Removed {URL_FILE.name}')

# ==================== NGROK FUNCTIONS ====================

def start_ngrok():
    """Start ngrok tunnel"""
    global ngrok_process, restart_count
    
    try:
        print(f'\n🚀 Starting ngrok tunnel on port {FLASK_PORT}...')
        
        # Start ngrok as background process
        ngrok_process = subprocess.Popen(
            ['ngrok', 'http', str(FLASK_PORT), '--log=stdout'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for ngrok to start
        print('   ⏳ Waiting for ngrok to initialize...')
        time.sleep(3)
        
        # Check if process is still running
        if ngrok_process.poll() is not None:
            stderr = ngrok_process.stderr.read()
            raise Exception(f"ngrok failed to start: {stderr}")
        
        print('   ✅ ngrok process started')
        return True
        
    except Exception as e:
        print(f'   ❌ Failed to start ngrok: {e}')
        restart_count += 1
        return False

def get_public_url():
    """Fetch public URL from ngrok API"""
    max_retries = 10
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            response = requests.get(NGROK_API_URL, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            tunnels = data.get('tunnels', [])
            
            if not tunnels:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                return None
            
            # Get HTTPS tunnel (preferred) or first tunnel
            for tunnel in tunnels:
                if tunnel.get('proto') == 'https':
                    return tunnel.get('public_url')
            
            # Fallback to first tunnel
            return tunnels[0].get('public_url')
            
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print(f'   ⚠️  Failed to fetch ngrok URL: {e}')
                return None
    
    return None

def save_url_to_file(url):
    """Save public URL to file"""
    try:
        with open(URL_FILE, 'w') as f:
            f.write(f"{url}\n")
            f.write(f"Webhook URL: {url}/webhook/github\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        print(f'   💾 Saved URL to {URL_FILE.name}')
    except Exception as e:
        print(f'   ⚠️  Failed to save URL: {e}')

def display_webhook_info(url):
    """Display webhook configuration info"""
    webhook_url = f"{url}/webhook/github"
    
    print('\n' + '='*70)
    print('🎉 NGROK TUNNEL ACTIVE')
    print('='*70)
    print(f'\n📡 Public URL:     {url}')
    print(f'🔗 Webhook URL:    {webhook_url}')
    print(f'🏠 Local Server:   http://localhost:{FLASK_PORT}')
    print(f'\n📋 GitHub Webhook Configuration:')
    print(f'   1. Go to: GitHub Repo → Settings → Webhooks → Add webhook')
    print(f'   2. Payload URL: {webhook_url}')
    print(f'   3. Content type: application/json')
    print(f'   4. Events: Just the push event')
    print(f'   5. Active: ✅ Check this box')
    print('\n💡 Tips:')
    print(f'   - URL saved to: {URL_FILE.name}')
    print(f'   - Dashboard: http://localhost:4040')
    print(f'   - Press Ctrl+C to stop')
    print('='*70 + '\n')

def check_tunnel_health():
    """Check if ngrok tunnel is still active"""
    try:
        response = requests.get(NGROK_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        tunnels = data.get('tunnels', [])
        return len(tunnels) > 0
    except:
        return False

def monitor_tunnel():
    """Monitor tunnel and auto-restart if needed"""
    global restart_count
    
    print(f'\n👀 Monitoring tunnel health (checking every {HEALTH_CHECK_INTERVAL}s)...')
    
    while True:
        try:
            time.sleep(HEALTH_CHECK_INTERVAL)
            
            # Check if ngrok process is alive
            if ngrok_process and ngrok_process.poll() is not None:
                print(f'\n⚠️  ngrok process died! Exit code: {ngrok_process.returncode}')
                attempt_restart()
                continue
            
            # Check tunnel health via API
            if not check_tunnel_health():
                print('\n⚠️  Tunnel health check failed!')
                attempt_restart()
                continue
            
            # Tunnel is healthy
            print(f'✅ Tunnel active [{datetime.now().strftime("%H:%M:%S")}]')
            
        except KeyboardInterrupt:
            raise
        except Exception as e:
            print(f'\n⚠️  Monitor error: {e}')
            time.sleep(5)

def attempt_restart():
    """Attempt to restart ngrok tunnel"""
    global restart_count
    
    if restart_count >= MAX_RESTART_ATTEMPTS:
        print(f'\n❌ Max restart attempts ({MAX_RESTART_ATTEMPTS}) reached!')
        print('   Please check ngrok configuration and try again.')
        cleanup()
        sys.exit(1)
    
    restart_count += 1
    print(f'\n🔄 Attempting restart #{restart_count}...')
    
    cleanup()
    time.sleep(5)
    
    if start_ngrok():
        time.sleep(3)
        url = get_public_url()
        if url:
            save_url_to_file(url)
            display_webhook_info(url)
            restart_count = 0  # Reset counter on successful restart
        else:
            print('   ❌ Failed to get public URL after restart')
    else:
        print('   ❌ Failed to restart ngrok')

# ==================== MAIN ====================

def main():
    """Main function"""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print('\n' + '='*70)
    print('🔒 NGROK TUNNEL MANAGER - Validation Engine')
    print('='*70)
    
    # Check if Flask server is running
    print(f'\n🔍 Checking if Flask server is running on port {FLASK_PORT}...')
    try:
        response = requests.get(f'http://localhost:{FLASK_PORT}/api/health', timeout=3)
        if response.status_code == 200:
            print('   ✅ Flask validation engine is running')
        else:
            print('   ⚠️  Flask server responded but may not be healthy')
    except requests.exceptions.RequestException:
        print('   ⚠️  WARNING: Flask server not detected on port 5002')
        print('   💡 Make sure to start validation_engine.py first!')
        print('   📝 You can still start ngrok, but webhooks won\'t work until Flask is running')
        
        user_input = input('\n   Continue anyway? (y/n): ').lower()
        if user_input != 'y':
            print('   Exiting...')
            sys.exit(0)
    
    # Start ngrok
    if not start_ngrok():
        print('\n❌ Failed to start ngrok. Exiting...')
        sys.exit(1)
    
    # Get public URL
    print('\n📡 Fetching public URL from ngrok API...')
    url = get_public_url()
    
    if not url:
        print('\n❌ Failed to get public URL. Exiting...')
        cleanup()
        sys.exit(1)
    
    # Save and display info
    save_url_to_file(url)
    display_webhook_info(url)
    
    # Monitor tunnel
    try:
        monitor_tunnel()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == '__main__':
    main()
