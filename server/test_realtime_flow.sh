#!/bin/bash

echo "=================================================="
echo "Real-time Validation Flow Test"
echo "=================================================="
echo ""

echo "1. Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5002/api/health)
echo "✅ Health: $HEALTH"
echo ""

echo "2. Getting current in-progress modules count..."
IN_PROGRESS_BEFORE=$(curl -s http://localhost:5002/api/modules | jq '[.modules[] | select(.status == "in-progress")] | length')
echo "📊 In-progress modules before: $IN_PROGRESS_BEFORE"
echo ""

echo "3. Simulating GitHub push from Fresh-MC..."
echo "   Repository: Tracker"
echo "   Action: Validating work completion"
echo ""

WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:5002/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"pusher": {"name": "Fresh-MC"}, "repository": {"name": "Tracker"}}')

echo "✅ Webhook Response:"
echo "$WEBHOOK_RESPONSE" | jq '.'
echo ""

MODULE_TITLE=$(echo "$WEBHOOK_RESPONSE" | jq -r '.module.title')
ASSIGNED_TO=$(echo "$WEBHOOK_RESPONSE" | jq -r '.module.assignedToName')
STATUS=$(echo "$WEBHOOK_RESPONSE" | jq -r '.module.status')

echo "4. Validation Results:"
echo "   📝 Module: $MODULE_TITLE"
echo "   👤 Assigned to: $ASSIGNED_TO"
echo "   ✅ New Status: $STATUS"
echo ""

echo "5. Checking updated modules count..."
sleep 1
IN_PROGRESS_AFTER=$(curl -s http://localhost:5002/api/modules | jq '[.modules[] | select(.status == "in-progress")] | length')
COMPLETED=$(curl -s http://localhost:5002/api/modules | jq '[.modules[] | select(.status == "completed")] | length')
echo "📊 In-progress modules after: $IN_PROGRESS_AFTER"
echo "📊 Completed modules: $COMPLETED"
echo ""

echo "=================================================="
echo "Expected Frontend Behavior:"
echo "=================================================="
echo "1. Socket.IO connection established"
echo "2. Toast notification appears: '🎉 Work Verified! $MODULE_TITLE completed by $ASSIGNED_TO'"
echo "3. Dashboard progress bars update automatically"
echo "4. No page refresh needed"
echo ""

echo "✅ Test completed! Check your browser at http://localhost:5174"
echo "   - Open browser console to see Socket.IO logs"
echo "   - Login as manager to see toast notifications"
echo ""
