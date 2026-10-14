#!/bin/bash
#
# Linux Build Script for C Compiler
# Builds the compiler on Linux systems
#

set -e  # Exit on error
cd "$(dirname "${BASH_SOURCE[0]}")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "======================================================================"
echo "  C Compiler - Linux Build"
echo "======================================================================"
echo -e "${NC}"

# Check for required tools
echo -e "${GREEN}===> Checking dependencies...${NC}"

MISSING=0

if ! command -v flex &> /dev/null; then
    echo -e "${RED}[MISSING] flex${NC}"
    echo "  Install: sudo apt install flex (Ubuntu/Debian) or sudo dnf install flex (Fedora/RHEL)"
    MISSING=1
else
    echo -e "     ${GREEN}[OK]${NC} flex found"
fi

if ! command -v bison &> /dev/null; then
    echo -e "${RED}[MISSING] bison${NC}"
    echo "  Install: sudo apt install bison (Ubuntu/Debian) or sudo dnf install bison (Fedora/RHEL)"
    MISSING=1
else
    echo -e "     ${GREEN}[OK]${NC} bison found"
fi

if ! command -v gcc &> /dev/null; then
    echo -e "${RED}[MISSING] gcc${NC}"
    echo "  Install: sudo apt install gcc (Ubuntu/Debian) or sudo dnf install gcc (Fedora/RHEL)"
    MISSING=1
else
    echo -e "     ${GREEN}[OK]${NC} gcc found"
fi

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}[ERROR] Missing required dependencies${NC}"
    exit 1
fi

# Create directories
echo ""
echo -e "${GREEN}===> Creating directories...${NC}"
mkdir -p build dist/bin

# Generate lexer
echo ""
echo -e "${GREEN}===> Generating lexical analyzer...${NC}"
cd compiler
flex -o lex.yy.c lexer.l
echo -e "     ${GREEN}[OK]${NC} Generated lex.yy.c"

# Generate parser
echo ""
echo -e "${GREEN}===> Generating parser...${NC}"
bison -d -v -o y.tab.c parser_wrapper.y
echo -e "     ${GREEN}[OK]${NC} Generated y.tab.c and y.tab.h"

# Compile
echo ""
echo -e "${GREEN}===> Compiling executable...${NC}"
cd ..
gcc -o dist/bin/ccompiler \
    cli/main.c \
    compiler/y.tab.c \
    -DBUILD_AS_LIBRARY \
    -Icompiler \
    -O2 \
    -w

cp -f dist/bin/ccompiler ./ccompiler
chmod +x ./ccompiler ./dist/bin/ccompiler

if [ $? -eq 0 ]; then
    echo -e "     ${GREEN}[OK]${NC} Created dist/bin/ccompiler and ./ccompiler"
else
    echo -e "${RED}[ERROR] Compilation failed${NC}"
    exit 1
fi

# Test the executable
echo ""
echo -e "${GREEN}===> Testing executable...${NC}"
if ./ccompiler --version > /dev/null 2>&1; then
    echo -e "     ${GREEN}[OK]${NC} Executable works"
else
    echo -e "${YELLOW}[WARNING] Executable test failed${NC}"
fi

# Summary
echo ""
echo -e "${CYAN}"
echo "======================================================================"
echo -e "${GREEN}  Build completed successfully!${NC}"
echo "======================================================================"
echo -e "${NC}"
echo "Executable location: ./ccompiler (and dist/bin/ccompiler)"
echo ""
echo "Next steps:"
echo "  1. Test: ./ccompiler --version"
echo "  2. Try an example: ./ccompiler -r examples/simple.c"
echo "  3. Run test suite: make test"
echo ""
