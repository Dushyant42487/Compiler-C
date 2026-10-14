# Makefile for C Compiler (Linux)
# Frontend compiler tool performing lexical, syntax, semantic analysis & IR generation

# Directories
COMPILER_DIR := compiler
CLI_DIR := cli
BUILD_DIR := build
DIST_DIR := dist
DIST_BIN_DIR := $(DIST_DIR)/bin

# Source files
LEXER_SRC := $(COMPILER_DIR)/lexer.l
PARSER_SRC := $(COMPILER_DIR)/parser_wrapper.y
CLI_SRC := $(CLI_DIR)/main.c

# Generated files
LEXER_GEN := $(COMPILER_DIR)/lex.yy.c
PARSER_GEN := $(COMPILER_DIR)/y.tab.c
PARSER_HDR := $(COMPILER_DIR)/y.tab.h

# Output binaries
NATIVE_EXE := $(DIST_BIN_DIR)/ccompiler
ROOT_EXE := ccompiler

# Tools
FLEX := flex
BISON := bison
CC := gcc

# Compiler flags
CFLAGS := -DBUILD_AS_LIBRARY -I$(COMPILER_DIR) -O2 -w

# Windows exe paths
WIN_EXE := $(DIST_BIN_DIR)/ccompiler.exe
WIN_ROOT_EXE := ccompiler.exe

# Phony targets
.PHONY: all build clean test check-deps help windows test-win

# Default target: build Linux executable
all: check-deps $(NATIVE_EXE)
	@cp -f $(NATIVE_EXE) $(ROOT_EXE)
	@echo ""
	@echo "========================================================================"
	@echo "  Build completed successfully!"
	@echo "========================================================================"
	@echo "  Executable: $(ROOT_EXE) (and $(NATIVE_EXE))"
	@echo ""

# Windows target: build native Windows exe (uses pre-generated files if flex/bison missing)
windows: $(LEXER_GEN) $(PARSER_GEN) $(PARSER_HDR) $(CLI_SRC) $(CLI_DIR)/explorer.h | $(DIST_BIN_DIR)
	@echo "Compiling Windows executable..."
	@$(CC) -o $(WIN_EXE) $(CLI_SRC) $(PARSER_GEN) $(CFLAGS)
	@cp -f $(WIN_EXE) $(WIN_ROOT_EXE)
	@echo "[OK] Created $(WIN_EXE) and $(WIN_ROOT_EXE)"
	@echo ""
	@echo "========================================================================"
	@echo "  Windows build completed successfully!"
	@echo "========================================================================"
	@echo "  Executable: $(WIN_ROOT_EXE) (and $(WIN_EXE))"
	@echo ""

# Check build dependencies
check-deps:
	@command -v $(FLEX) >/dev/null 2>&1 || { echo "[ERROR] Flex not found. Install with: sudo apt install flex (or sudo dnf install flex)"; exit 1; }
	@command -v $(BISON) >/dev/null 2>&1 || { echo "[ERROR] Bison not found. Install with: sudo apt install bison (or sudo dnf install bison)"; exit 1; }
	@command -v $(CC) >/dev/null 2>&1 || { echo "[ERROR] GCC not found. Install with: sudo apt install gcc (or sudo dnf install gcc)"; exit 1; }

# Create directories
$(DIST_BIN_DIR):
	@mkdir -p $(DIST_BIN_DIR)

# Generate lexer
$(LEXER_GEN): $(LEXER_SRC)
	@echo "Generating lexical analyzer..."
	@cd $(COMPILER_DIR) && $(FLEX) -o lex.yy.c lexer.l
	@echo "[OK] Generated $(LEXER_GEN)"

# Generate parser
$(PARSER_GEN) $(PARSER_HDR) &: $(PARSER_SRC) $(LEXER_SRC)
	@echo "Generating parser..."
	@cd $(COMPILER_DIR) && $(BISON) -d -v -o y.tab.c parser_wrapper.y
	@echo "[OK] Generated $(PARSER_GEN) and $(PARSER_HDR)"

# Compile native executable
$(NATIVE_EXE): $(LEXER_GEN) $(PARSER_GEN) $(PARSER_HDR) $(CLI_SRC) $(CLI_DIR)/explorer.h | $(DIST_BIN_DIR)
	@echo "Compiling native executable..."
	@$(CC) -o $(NATIVE_EXE) $(CLI_SRC) $(PARSER_GEN) $(CFLAGS)
	@echo "[OK] Created $(NATIVE_EXE)"

# Run tests
test: all
	@bash tests/run-tests.sh
	@python3 tests/test_regressions.py $(ROOT_EXE)

test-win: windows
	@powershell -ExecutionPolicy Bypass -File tests/run-tests-win.ps1
	@python tests/test_regressions.py $(WIN_ROOT_EXE)

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -f $(COMPILER_DIR)/lex.yy.c $(COMPILER_DIR)/y.tab.c $(COMPILER_DIR)/y.tab.h $(COMPILER_DIR)/y.output $(COMPILER_DIR)/*.output $(COMPILER_DIR)/*.o
	@rm -f $(CLI_DIR)/*.o
	@rm -f a.out temp_run.out temp_run.exe myprog.exe report_test.txt
	@rm -f ccompiler.exe
	@rm -rf $(DIST_DIR) $(BUILD_DIR)
	@echo "[OK] Cleaned."

# Show help
help:
	@echo ""
	@echo "C Compiler - Linux Makefile"
	@echo "==========================="
	@echo ""
	@echo "Targets:"
	@echo "  make               - Build Linux compiler executable (default)"
	@echo "  make test          - Run full automated test suite"
	@echo "  make clean         - Remove generated files and build outputs"
	@echo "  make help          - Show this help message"
	@echo ""
	@echo "Requirements: flex, bison, gcc"
	@echo ""
