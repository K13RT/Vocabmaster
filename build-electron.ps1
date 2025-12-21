# Build script for Electron app
Write-Host "Building VocabMaster Electron App..." -ForegroundColor Cyan

# Step 1: Build the client
Write-Host "`n[1/3] Building client..." -ForegroundColor Yellow
Set-Location client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Client build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Step 2: Copy to public directory
Write-Host "`n[2/3] Copying build to public directory..." -ForegroundColor Yellow
if (Test-Path "public") {
    Remove-Item -Path "public" -Recurse -Force
}
New-Item -Path "public" -ItemType Directory -Force | Out-Null
Copy-Item -Path "client\dist\*" -Destination "public\" -Recurse -Force

# Step 3: Build Electron app
Write-Host "`n[3/3] Building Electron application..." -ForegroundColor Yellow
npx electron-builder

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "Check the 'release' directory for your executable." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    exit 1
}
