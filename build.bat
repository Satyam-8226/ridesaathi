@echo off
REM Production build & test script for Windows

setlocal enabledelayedexpansion

echo.
echo 🚀 Starting RideSaathi production build...
echo.

REM Check for .env files
echo 📋 Checking environment configuration...
if not exist "backend\.env" (
  echo ⚠️  Warning: backend\.env not found
  echo    Copy backend\.env.production.template to backend\.env and configure
)

if not exist "frontend\.env" (
  echo ⚠️  Warning: frontend\.env not found
  echo    Copy frontend\.env.production.template to frontend\.env and configure
)

REM Backend
echo.
echo 📦 Building backend...
cd backend
echo    Installing dependencies...
call npm install --production
if errorlevel 1 (
  echo ❌ Backend build failed
  exit /b 1
)
echo    Backend ready ✅
cd ..

REM Frontend
echo.
echo 📦 Building frontend...
cd frontend
echo    Installing dependencies...
call npm install
if errorlevel 1 (
  echo ❌ Frontend dependency installation failed
  exit /b 1
)
echo    Building frontend...
call npm run build
if errorlevel 1 (
  echo ❌ Frontend build failed
  exit /b 1
)
if exist "dist\index.html" (
  echo    Frontend build successful ✅
) else (
  echo ❌ Frontend build failed - dist\index.html not found
  exit /b 1
)
cd ..

REM Verify critical files
echo.
echo 🔍 Verifying production setup...
if exist "backend\.env.production.template" echo    ✅ backend\.env.production.template
if exist "frontend\.env.production.template" echo    ✅ frontend\.env.production.template

REM Final summary
echo.
echo ✅ Production build complete!
echo.
echo 📝 Next steps:
echo    1. Verify all environment variables: type backend\.env
echo    2. Test locally: npm run dev
echo    3. Verify frontend API URL and backend CORS settings
echo    4. Push to GitHub: git push origin main
echo.
echo 📋 Checklist:
echo    - [ ] Generate new JWT_SECRET
echo    - [ ] Configure MongoDB Atlas
echo    - [ ] Set email (SMTP) credentials
echo    - [ ] Update FRONTEND_URL
echo    - [ ] Test locally
echo    - [ ] Review security settings
echo.

pause
