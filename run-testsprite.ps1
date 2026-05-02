# TestSprite Runner Script for depi-code-review
# Usage:
#   .\run-testsprite.ps1                         # uses key already stored in config.json
#   $env:TESTSPRITE_API_KEY = "sk-..."           # set once to persist a new key
#   .\run-testsprite.ps1 -ApiKey "sk-..."        # pass directly
#   .\run-testsprite.ps1 -LoginUser "e@m.com" -LoginPassword "pass"
#
# Get your API key at: https://www.testsprite.com/dashboard/settings/apikey

param(
    [string]$ApiKey        = $env:TESTSPRITE_API_KEY,
    [string]$ProjectUrl    = "http://localhost:3000",
    [ValidateSet("development", "production")]
    [string]$ServerMode    = "development",
    [string[]]$TestIds     = @(),
    [string]$LoginUser     = $env:TESTSPRITE_LOGIN_USER,
    [string]$LoginPassword = $env:TESTSPRITE_LOGIN_PASSWORD
)

$ErrorActionPreference = "Stop"

# ── Resolve project & config paths ───────────────────────────────────────────
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$configPath  = Join-Path $projectPath "testsprite_tests\tmp\config.json"
$configDir   = Split-Path $configPath
if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }

# ── Resolve API key (param/env > stored config > fail) ───────────────────────
$storedKey = ""
if (Test-Path $configPath) {
    try {
        $existingCfg = Get-Content $configPath -Raw | ConvertFrom-Json
        $storedKey   = $existingCfg.executionArgs.envs.API_KEY
    } catch {}
}

# Treat obvious placeholders as "not set"
$placeholders = @("", "ts-your-key-here", "ts-xxxx...", "`${TESTSPRITE_API_KEY}")
if ($ApiKey -in $placeholders) { $ApiKey = "" }
if ($storedKey -in $placeholders) { $storedKey = "" }

# Prefer the explicitly supplied key; fall back to whatever is stored
$resolvedKey = if ($ApiKey) { $ApiKey } else { $storedKey }

if (-not $resolvedKey) {
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Yellow
    Write-Host "           TestSprite API Key Required" -ForegroundColor Yellow
    Write-Host "===========================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Get your key at: https://www.testsprite.com/dashboard/settings/apikey" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Then run:" -ForegroundColor White
    Write-Host '    $env:TESTSPRITE_API_KEY = "sk-user-..."' -ForegroundColor Gray
    Write-Host '    .\run-testsprite.ps1' -ForegroundColor Gray
    Write-Host ""
    exit 1
}

$keyPreview = $resolvedKey.Substring(0, [Math]::Min(20, $resolvedKey.Length)) + "..."
Write-Host "  API key resolved ($keyPreview)" -ForegroundColor DarkGray

# ── Verify the dev server is running ─────────────────────────────────────────
Write-Host "Checking dev server at $ProjectUrl ..." -ForegroundColor Cyan
$tcp       = New-Object System.Net.Sockets.TcpClient
$connected = $false
try {
    $uri = [System.Uri]$ProjectUrl
    $tcp.Connect($uri.Host, $uri.Port)
    $connected = $true
} catch {}
finally { $tcp.Close() }

if (-not $connected) {
    Write-Host ""
    Write-Host "  Dev server is NOT running. Starting it now ..." -ForegroundColor Yellow
    Write-Host "  (waiting 15 s for the server to be ready)" -ForegroundColor Gray
    Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "dev" -PassThru | Out-Null
    Start-Sleep -Seconds 15
} else {
    Write-Host "  Dev server is running." -ForegroundColor Green
}

# ── Build config, preserving proxy/serverPort from last run ──────────────────
$proxy      = ""
$serverPort = 0
if (Test-Path $configPath) {
    try {
        $prev        = Get-Content $configPath -Raw | ConvertFrom-Json
        $proxy       = if ($prev.proxy)      { $prev.proxy }      else { "" }
        $serverPort  = if ($prev.serverPort) { $prev.serverPort } else { 0 }
    } catch {}
}

$config = [ordered]@{
    status        = "init"
    type          = "frontend"
    loginUser     = $LoginUser
    loginPassword = $LoginPassword
    serverMode    = $ServerMode
    localEndpoint = $ProjectUrl
    executionArgs = [ordered]@{
        projectName           = "depi-code-review"
        projectPath           = $projectPath
        testIds               = $TestIds
        additionalInstruction = ""
        serverMode            = $ServerMode
        envs                  = [ordered]@{
            API_KEY        = $resolvedKey
            API_URL        = "https://api.testsprite.com"
            TESTSPRITE_URL = "https://www.testsprite.com"
        }
    }
}
if ($proxy)      { $config["proxy"]      = $proxy }
if ($serverPort) { $config["serverPort"] = $serverPort }

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8
Write-Host "  Config written to $configPath" -ForegroundColor Green

# ── Set env vars for the child process ───────────────────────────────────────
$env:API_KEY        = $resolvedKey
$env:API_URL        = "https://api.testsprite.com"
$env:TESTSPRITE_URL = "https://www.testsprite.com"

# ── Run TestSprite ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Running TestSprite..." -ForegroundColor Cyan
Set-Location $projectPath
npx @testsprite/testsprite-mcp generateCodeAndExecute


