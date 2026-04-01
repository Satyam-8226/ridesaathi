#!/bin/bash
# Production build & test script

set -e

echo "🚀 Starting RideSaathi production build..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for .env files
echo "📋 Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  Warning: backend/.env not found${NC}"
  echo "   Copy backend/.env.production.template to backend/.env and configure"
fi

if [ ! -f "frontend/.env" ]; then
  echo -e "${YELLOW}⚠️  Warning: frontend/.env not found${NC}"
  echo "   Copy frontend/.env.production.template to frontend/.env and configure"
fi

# Backend
echo ""
echo -e "${YELLOW}📦 Building backend...${NC}"
cd backend
echo "   Installing dependencies..."
npm install --production
echo "   Backend ready ✅"
cd ..

# Frontend
echo ""
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
echo "   Installing dependencies..."
npm install
echo "   Building frontend..."
npm run build
if [ -f "dist/index.html" ]; then
  echo "   Frontend build successful ✅"
else
  echo -e "${RED}   Frontend build failed ❌${NC}"
  exit 1
fi
cd ..

# Verify critical files
echo ""
echo -e "${YELLOW}🔍 Verifying production setup...${NC}"
check_file() {
  if [ -f "$1" ]; then
    echo "   ✅ $1"
  else
    echo -e "   ${RED}❌ $1 missing${NC}"
  fi
}

check_file "backend/.env.production.template"
check_file "frontend/.env.production.template"

# Security checks
echo ""
echo -e "${YELLOW}🔐 Security checks...${NC}"
if [ -z "$JWT_SECRET" ]; then
  echo -e "   ${YELLOW}⚠️  JWT_SECRET not set in environment${NC}"
else
  echo "   ✅ JWT_SECRET configured"
fi

if grep -r "mongodb+srv://.*@" backend/.env 2>/dev/null | grep -v ".example" > /dev/null; then
  echo "   ✅ MongoDB URI configured"
fi

# Final summary
echo ""
echo -e "${GREEN}✅ Production build complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Verify all environment variables: cat backend/.env"
echo "   2. Test locally: npm run dev (backend) and npm run dev (frontend)"
echo "   3. Verify frontend API URL and backend CORS settings"
echo "   4. Push to GitHub: git push origin main"
echo ""
echo "📋 Checklist:"
echo "   - [ ] Generate new JWT_SECRET"
echo "   - [ ] Configure MongoDB Atlas"
echo "   - [ ] Set email (SMTP) credentials"
echo "   - [ ] Update FRONTEND_URL"
echo "   - [ ] Test locally"
echo "   - [ ] Review security settings"
echo ""
