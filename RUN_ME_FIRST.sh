#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║         🚀 Straightner - Quick Start Demo 🚀         ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "Select an option:"
echo ""
echo "1️⃣  Test CLI - Flatten Contract"
echo "2️⃣  Test CLI - Compile Contract"
echo "3️⃣  Start API Server"
echo "4️⃣  Run Full API Test"
echo "5️⃣  View Available Commands"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Flattening contract..."
        echo "Command: node index.js flatten contracts/MyToken.sol"
        echo ""
        node index.js flatten contracts/MyToken.sol | head -50
        echo ""
        echo "... (output truncated)"
        ;;
    2)
        echo ""
        echo "🔨 Compiling contract..."
        echo "Command: node index.js compile contracts/MyToken.sol"
        echo ""
        node index.js compile contracts/MyToken.sol
        ;;
    3)
        echo ""
        echo "🚀 Starting API Server on port 3000..."
        echo "Command: node server/app.js"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        node server/app.js
        ;;
    4)
        echo ""
        echo "🧪 Running Full API Test..."
        echo ""
        ./test_api.sh
        ;;
    5)
        echo ""
        echo "📋 Available Commands:"
        echo "===================="
        echo ""
        echo "CLI Commands:"
        echo "  node index.js flatten contracts/MyToken.sol"
        echo "  node index.js compile contracts/MyToken.sol"
        echo "  node index.js --help"
        echo ""
        echo "API Server:"
        echo "  node server/app.js"
        echo ""
        echo "Test API (after starting server):"
        echo "  curl -X POST http://localhost:3000/api/process \\"
        echo "    -H 'Content-Type: application/json' \\"
        echo "    -d '{\"contractPath\": \"contracts/MyToken.sol\"}'"
        echo ""
        echo "Run Tests:"
        echo "  npm test"
        echo "  ./test_api.sh"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

echo ""
echo "📖 For more information, see QUICK_START.md"
