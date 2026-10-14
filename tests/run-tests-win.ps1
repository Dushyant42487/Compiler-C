# Test Runner for C Compiler on Windows (PowerShell)
# Mirrors tests/run-tests.sh for Linux

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ExamplesDir = Join-Path $ProjectRoot "examples"
$CompilerBin = Join-Path $ProjectRoot "dist\bin\ccompiler.exe"
if (!(Test-Path $CompilerBin)) { $CompilerBin = Join-Path $ProjectRoot "ccompiler.exe" }

$PassCount = 0
$FailCount = 0
$TotalTests = 0

function Write-Result {
    param([string]$TestName, [bool]$Success, [string]$Message = "")
    $script:TotalTests++
    if ($Success) {
        $script:PassCount++
        Write-Host "[PASS] $TestName $Message" -ForegroundColor Green
    } else {
        $script:FailCount++
        Write-Host "[FAIL] $TestName $Message" -ForegroundColor Red
    }
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  C Compiler - Windows Test Suite" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Compiler: $CompilerBin" -ForegroundColor Gray
Write-Host "Examples: $ExamplesDir" -ForegroundColor Gray

if (!(Test-Path $CompilerBin)) {
    Write-Host "[ERROR] Compiler binary not found: $CompilerBin" -ForegroundColor Red
    Write-Host "Please build first: .\build-windows.ps1  or  .\build-windows.bat  or  gcc -o ccompiler.exe cli\main.c compiler\y.tab.c -DBUILD_AS_LIBRARY -Icompiler -O2 -w" -ForegroundColor Yellow
    exit 1
}

# --- Valid programs ---
Write-Host ""
Write-Host "Testing Valid Programs:" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow
Get-ChildItem "$ExamplesDir\*.c" | ForEach-Object {
    $filename = $_.Name
    if ($filename -like "error_*") { return }
    $file = $_.FullName
    & $CompilerBin -q "$file" > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Result $filename $true "(Passed all phases)"
    } else {
        Write-Result $filename $false "(Expected exit 0, got $LASTEXITCODE)"
    }
}

# --- Error detection ---
Write-Host ""
Write-Host "Testing Error Detection:" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow
Get-ChildItem "$ExamplesDir\error_*.c" | ForEach-Object {
    $filename = $_.Name
    $file = $_.FullName
    & $CompilerBin -q "$file" > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Result $filename $false "(Should have reported error and failed)"
    } else {
        Write-Result $filename $true "(Error detected correctly)"
    }
}

# --- CLI options ---
Write-Host ""
Write-Host "Testing Command-Line Options:" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow
$sample = Join-Path $ExamplesDir "simple.c"

$versionOut = & $CompilerBin --version 2>&1 | Out-String
if ($versionOut -like "*Version*") { Write-Result "--version" $true "" } else { Write-Result "--version" $false "(Missing 'Version')" }

$helpOut = & $CompilerBin --help 2>&1 | Out-String
if ($helpOut -like "*Usage:*") { Write-Result "--help" $true "" } else { Write-Result "--help" $false "(Missing 'Usage:')" }

$checkOut = & $CompilerBin --check 2>&1 | Out-String
if ($checkOut -like "*Installation Check*") { Write-Result "--check" $true "" } else { Write-Result "--check" $false "(Missing 'Installation Check')" }

foreach ($phase in @("--tokens","--symbols","--parse-tree","--semantic","--ir","--all")) {
    & $CompilerBin $phase "$sample" > $null 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Result $phase $true "" } else { Write-Result $phase $false "(Failed with $phase)" }
}

# -o output file
$tmpOutput = Join-Path $env:TEMP "ccompiler_test_$PID.txt"
& $CompilerBin -o $tmpOutput "$sample" > $null 2>&1
if ((Test-Path $tmpOutput) -and ((Get-Item $tmpOutput).Length -gt 0)) {
    Write-Result "-o (output file)" $true "(Output file created and non-empty)"
} else {
    Write-Result "-o (output file)" $false "(Failed to create output file)"
}
Remove-Item $tmpOutput -ErrorAction SilentlyContinue

# -r execution
Write-Host ""
Write-Host "Testing Execution (-r):" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow
# Simple run should exit 0 and produce PHASE 5
$runOut = & $CompilerBin -r "$sample" 2>&1 | Out-String
if ($runOut -like "*PHASE 5*") { Write-Result "-r execution" $true "(PHASE 5 present)" } else { Write-Result "-r execution" $false "(Missing PHASE 5)" }

# Test with input (even_odd)
$evenOdd = Join-Path $ExamplesDir "even_odd.c"
$runInput = "7" | & $CompilerBin -r "$evenOdd" 2>&1 | Out-String
if ($runInput -like "*Odd*") { Write-Result "-r with stdin (even_odd)" $true "(Correct Odd output)" } else { Write-Result "-r with stdin (even_odd)" $false "(Expected 'Odd')" }

# Test -b build
$tmpExe = Join-Path $env:TEMP "ccompiler_test_build_$PID.exe"
& $CompilerBin -b -o $tmpExe "$sample" > $null 2>&1
if (Test-Path $tmpExe) {
    Write-Result "-b build" $true "(Binary created)"
    Remove-Item $tmpExe -Force -ErrorAction SilentlyContinue
} else {
    Write-Result "-b build" $false "(Binary not created)"
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $TotalTests"
Write-Host "Passed:      $PassCount" -ForegroundColor Green
Write-Host "Failed:      $FailCount" -ForegroundColor Red
Write-Host ""

if ($FailCount -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed." -ForegroundColor Red
    exit 1
}
