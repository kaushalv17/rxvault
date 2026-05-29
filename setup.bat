@echo off
echo ============================================
echo   RxVault - Setup Script
echo ============================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js 18+ is installed.
    pause
    exit /b 1
)

echo.
echo [2/4] Generating Prisma client...
cd apps\api
call npx prisma generate
if errorlevel 1 (
    echo ERROR: prisma generate failed.
    pause
    exit /b 1
)

echo.
echo [3/4] Creating database...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ERROR: prisma migrate failed.
    pause
    exit /b 1
)

echo.
echo [4/4] Seeding demo data...
call npx ts-node src/seed.ts
if errorlevel 1 (
    echo ERROR: seed failed.
    pause
    exit /b 1
)

cd ..\..

echo.
echo ============================================
echo   Setup complete!
echo ============================================
echo.
echo Demo logins:
echo   Doctor:  dr.sharma@rxvault.com / password123
echo   Patient: rahul.kumar@gmail.com / password123
echo.
echo To run the project:
echo   Terminal 1: double-click start-api.bat
echo   Terminal 2: double-click start-web.bat
echo.
echo Then open: http://localhost:3000
echo ============================================
pause
