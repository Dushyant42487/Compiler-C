#!/bin/bash
#
# Test Runner for C Compiler on Linux
# Runs all example programs and verifies compiler phases and CLI options
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXAMPLES_DIR="$PROJECT_ROOT/examples"
COMPILER_BIN="$PROJECT_ROOT/dist/bin/ccompiler"

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

write_header() {
    echo -e "${CYAN}"
    echo "======================================================================"
    echo "  C Compiler - Linux Test Suite"
    echo "======================================================================"
    echo -e "${NC}"
}

write_result() {
    local test_name="$1"
    local success="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$success" -eq 1 ]; then
        PASS_COUNT=$((PASS_COUNT + 1))
        echo -e "${GREEN}[PASS]${NC} $test_name ${GRAY}$message${NC}"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo -e "${RED}[FAIL]${NC} $test_name ${RED}$message${NC}"
    fi
}

check_compiler() {
    if [ ! -f "$COMPILER_BIN" ]; then
        echo -e "${RED}[ERROR] Compiler binary not found: $COMPILER_BIN${NC}"
        echo "Please build the compiler first with: ./build-linux.sh or make"
        exit 1
    fi
}

test_valid_programs() {
    echo ""
    echo -e "${YELLOW}Testing Valid Programs:${NC}"
    echo -e "${YELLOW}----------------------${NC}"
    
    for file in "$EXAMPLES_DIR"/*.c; do
        filename=$(basename "$file")
        # Skip error files
        if [[ "$filename" == error_* ]]; then
            continue
        fi
        
        if "$COMPILER_BIN" -q "$file" > /dev/null 2>&1; then
            write_result "$filename" 1 "(Passed all compilation phases)"
        else
            write_result "$filename" 0 "(Expected exit code 0)"
        fi
    done
}

test_error_programs() {
    echo ""
    echo -e "${YELLOW}Testing Error Detection:${NC}"
    echo -e "${YELLOW}------------------------${NC}"
    
    for file in "$EXAMPLES_DIR"/error_*.c; do
        filename=$(basename "$file")
        
        if "$COMPILER_BIN" -q "$file" > /dev/null 2>&1; then
            write_result "$filename" 0 "(Should have reported error and failed)"
        else
            write_result "$filename" 1 "(Error detected correctly)"
        fi
    done
}

test_cli_options() {
    echo ""
    echo -e "${YELLOW}Testing Command-Line Options:${NC}"
    echo -e "${YELLOW}-----------------------------${NC}"
    
    local sample="$EXAMPLES_DIR/simple.c"
    
    # Test --version
    local version_out
    version_out=$("$COMPILER_BIN" --version 2>&1 || true)
    if [[ "$version_out" == *"Version"* ]]; then
        write_result "--version" 1 ""
    else
        write_result "--version" 0 "(Output did not contain 'Version')"
    fi
    
    # Test --help
    local help_out
    help_out=$("$COMPILER_BIN" --help 2>&1 || true)
    if [[ "$help_out" == *"Usage:"* ]]; then
        write_result "--help" 1 ""
    else
        write_result "--help" 0 "(Output did not contain 'Usage:')"
    fi
    
    # Test --check
    local check_out
    check_out=$("$COMPILER_BIN" --check 2>&1 || true)
    if [[ "$check_out" == *"Installation Check"* ]]; then
        write_result "--check" 1 ""
    else
        write_result "--check" 0 "(Output did not contain 'Installation Check')"
    fi
    
    # Test individual phases
    for phase in "--tokens" "--symbols" "--parse-tree" "--semantic" "--ir" "--all"; do
        if "$COMPILER_BIN" "$phase" "$sample" > /dev/null 2>&1; then
            write_result "$phase" 1 ""
        else
            write_result "$phase" 0 "(Failed with flag $phase)"
        fi
    done
    
    # Test -o output file redirection
    local tmp_output="/tmp/ccompiler_test_out_$$.txt"
    if "$COMPILER_BIN" -o "$tmp_output" "$sample" > /dev/null 2>&1 && [ -s "$tmp_output" ]; then
        write_result "-o (output file)" 1 "(Output file created and non-empty)"
    else
        write_result "-o (output file)" 0 "(Failed to create output file)"
    fi
    rm -f "$tmp_output"
}

# Run test suite
write_header
check_compiler

echo -e "Compiler: ${GRAY}$COMPILER_BIN${NC}"
echo -e "Examples: ${GRAY}$EXAMPLES_DIR${NC}"

test_valid_programs
test_error_programs
test_cli_options

echo ""
echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  Test Summary${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed:      ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed:      ${RED}$FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    echo ""
    exit 1
fi
