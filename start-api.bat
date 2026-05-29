@echo off
echo Starting RxVault API on port 4000...
cd apps\api
npx ts-node-dev --respawn --transpile-only --exit-child src/index.ts
pause
