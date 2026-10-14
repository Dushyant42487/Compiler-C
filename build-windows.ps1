# Windows Build Script for C Compiler (PowerShell)
# Builds ccompiler.exe on Windows

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  C Compiler - Windows Build (PowerShell)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure MSYS2 tools are in PATH if available
$msysPaths = @("C:\msys64\usr\bin", "C:\msys64\mingw64\bin", "C:\msys64\ucrt64\bin")
foreach ($p in $msysPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;$env:PATH"
        Write-Host "[INFO] Added $p to PATH" -ForegroundColor Gray
    }
}

# Check gcc
try { $gccVersion = & gcc --version 2>&1 | Select-Object -First 1; Write-Host "[OK] gcc found: $gccVersion" -ForegroundColor Green }
catch {
    Write-Host "[ERROR] gcc not found. Install MSYS2 gcc:" -ForegroundColor Red
    Write-Host "  pacman -S mingw-w64-ucrt-x86_64-gcc" -ForegroundColor Yellow
    Write-Host "  Or install w64devkit / MinGW-w64" -ForegroundColor Yellow
    exit 1
}

# Create directories
Write-Host ""
Write-Host "===> Creating directories..." -ForegroundColor Green
if (!(Test-Path "dist\bin")) { New-Item -ItemType Directory -Path "dist\bin" -Force | Out-Null }

# Try to regenerate lexer/parser if flex/bison available
$flexTool = Get-Command flex -ErrorAction SilentlyContinue
if (!$flexTool) { $flexTool = Get-Command win_flex -ErrorAction SilentlyContinue }
$bisonTool = Get-Command bison -ErrorAction SilentlyContinue
if (!$bisonTool) { $bisonTool = Get-Command win_bison -ErrorAction SilentlyContinue }
if ($flexTool -and $bisonTool) {
    Push-Location compiler
    try {
        & $flexTool.Source -o lex.yy.c lexer.l
        if ($LASTEXITCODE -ne 0) { throw "Lexer generation failed" }
        & $bisonTool.Source -d -v -o y.tab.c parser_wrapper.y
        if ($LASTEXITCODE -ne 0) { throw "Parser generation failed" }
    } finally { Pop-Location }
} else {
    foreach ($generated in @("compiler/lex.yy.c", "compiler/y.tab.c", "compiler/y.tab.h")) {
        if (!(Test-Path $generated)) { throw "Missing $generated. Install Flex/Bison or WinFlexBison and rebuild." }
    }
    foreach ($pair in @(@("compiler/lexer.l", "compiler/lex.yy.c"), @("compiler/parser_wrapper.y", "compiler/y.tab.c"))) {
        if ((Get-Item $pair[0]).LastWriteTimeUtc -gt (Get-Item $pair[1]).LastWriteTimeUtc) {
            throw "Generated files are stale. Install Flex/Bison or WinFlexBison and regenerate."
        }
    }
    Write-Host "[INFO] Using existing generated sources" -ForegroundColor Yellow
}

# Compile
Write-Host ""
Write-Host "===> Compiling executable..." -ForegroundColor Green
& gcc -o "dist\bin\ccompiler.exe" "cli\main.c" "compiler\y.tab.c" -DBUILD_AS_LIBRARY -I"compiler" -O2 -w
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Compilation failed" -ForegroundColor Red
    exit 1
}
Write-Host "     [OK] Created dist\bin\ccompiler.exe" -ForegroundColor Green

Copy-Item -Force "dist\bin\ccompiler.exe" ".\ccompiler.exe"
Write-Host "     [OK] Copied to .\ccompiler.exe" -ForegroundColor Green

# Test
Write-Host ""
Write-Host "===> Testing executable..." -ForegroundColor Green
& ".\ccompiler.exe" --version | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "     [OK] Executable works" -ForegroundColor Green
    & ".\ccompiler.exe" --check
} else {
    Write-Host "     [WARNING] Executable test failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Build completed successfully!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Executable: .\ccompiler.exe (and dist\bin\ccompiler.exe)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Test: .\ccompiler.exe --version"
Write-Host "  2. Try:  .\ccompiler.exe -r examples\simple.c"
Write-Host "  3. Double-click ccompiler.exe for interactive mode"
Write-Host "  4. Test suite: .\tests\run-tests-win.ps1"
Write-Host ""
