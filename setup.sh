#!/bin/bash

# Heart Disease Prediction - Quick Start Script
# Automatically sets up backend and frontend

echo "❤️  Heart Disease Prediction - Setup Script"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi
echo -e "${GREEN}✓ Python found${NC}"

# Check Node
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Setup Backend
echo ""
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Create .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your OPENAI_API_KEY${NC}"
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Setup Frontend
echo ""
echo -e "${BLUE}Setting up Frontend...${NC}"
cd ../frontend

echo "Installing Node dependencies..."
npm install -q

echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Success message
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo "1. Start Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/Scripts/activate"
echo "   python app.py"
echo ""
echo "2. Start Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo -e "${YELLOW}Note: Set OPENAI_API_KEY in backend/.env for LLM features${NC}"
