# C Compiler - Educational Frontend for Windows and Linux

A lightweight, powerful C compiler frontend and execution tool built with Flex, Bison, and C on Windows and Linux. It performs lexical analysis, syntax tree construction, semantic validation, intermediate representation (3-address code) generation, and provides instant program building & execution.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue.svg)](#)

---

For the shared ZIP, read [START_HERE.md](START_HERE.md) first.

## 🎯 Features

- **Phase 1: Lexical Analysis** - Tokenization, keyword/operator recognition, and Symbol Table construction.
- **Phase 2: Syntax Analysis** - Full grammar validation and Parse Tree / AST visualization.
- **Phase 3: Semantic Analysis** - Type checking, scope validation, redeclaration & undeclared identifier detection.
- **Phase 4: Intermediate Code Generation (IR)** - 3-Address Code (TAC) generation with temporaries and control flow labels.
- **Phase 5: Compile-Time Optimization** - Active constant folding and constant propagation across expressions.
- **Full-Stack Web IDE** - React 18, TypeScript, Monaco Editor, and Tailwind CSS frontend connected via Express REST API to the real compiler.
- **Instant Execution Mode (`-r` / `--run`)** - Automatically compiles and runs your C source file so you see program output immediately.
- **Interactive Console Mode** - Launch without arguments (`./ccompiler`) for a friendly interactive CLI menu.
- **Offline HTML Compiler Explorer** - Standalone interactive report generator via `--explore`.

---

## ⚡ Full-Stack Web Application (React + Node.js + C Compiler)

You can run the compiler as a modern, responsive web application:

```bash
# 1. Build the compiler and all apps
npm run build

# 2. Run in development mode (starts backend and frontend concurrently)
npm run dev:backend   # In terminal 1: http://localhost:5001 (API)
npm run dev:frontend  # In terminal 2: http://localhost:3000 (React Web UI)

# Or start the unified production server:
npm start             # Open http://localhost:5001 in your browser
```

See [ARCHITECTURE.md](ARCHITECTURE.md) and [DEPLOYMENT.md](DEPLOYMENT.md) for full architecture and hosting guides.

---

## 📦 Project Structure

```
Compiler/
├── ccompiler             # Native Linux executable binary
├── Makefile              # Clean Linux Makefile (make, make test, make clean)
├── build-linux.sh        # Standalone Linux build script
├── compiler/             # Compiler frontend core (Flex & Bison)
│   ├── lexer.l
│   ├── parser_wrapper.y
│   └── y.tab.c, y.tab.h, lex.yy.c  # Generated sources included in ZIP
├── cli/                  # CLI driver & interactive interface
│   └── main.c
├── examples/             # Sample C programs and test cases
│   ├── simple.c
│   ├── arithmetic.c
│   ├── conditionals.c
│   ├── loops.c
│   ├── even_odd.c
│   ├── strings.c
│   ├── type_conversion.c
│   ├── input1.c, input2.c, input3.c
│   └── error_*.c
├── tests/                # Automated test runner
│   ├── run-tests.sh
│   └── README.md
├── ui/                   # Visual AST and Symbol Table Web Explorer
│   └── index.html
└── LICENSE
```

---

## 🚀 Quick Start

### 1. Requirements

Install standard build tools on your Linux distribution:

```bash
# Ubuntu / Debian
sudo apt install flex bison gcc make

# Fedora / RHEL
sudo dnf install flex bison gcc make

# Arch Linux
sudo pacman -S flex bison gcc make
```

### Windows requirements and build

Install native GCC (MinGW-w64 or MSYS2 UCRT64), plus Flex/Bison or WinFlexBison.
The builder recognizes `flex`/`bison` and `win_flex`/`win_bison`. A fresh checkout
requires the generators. Without them, existing generated files must be up to date.

```powershell
.\build-windows.ps1
# The batch entry point uses the same checked workflow:
.\build-windows.bat
.\tests\run-tests-win.ps1
python tests/test_regressions.py ccompiler.exe
```

### 2. Build the Compiler

```bash
make
# Or alternatively: bash build-linux.sh
```

This creates the native Linux binary `./ccompiler` (and `dist/bin/ccompiler`).

---

## 💻 Usage

### Run & See Output Immediately (`-r` / `--run`)

Analyze frontend phases and execute the program directly:

```bash
./ccompiler -r examples/simple.c
```

### Interactive Console Mode

Run `./ccompiler` with no arguments to enter interactive mode:

```bash
./ccompiler
```

### Frontend Analysis (All Phases)

```bash
./ccompiler examples/arithmetic.c
```

Analysis does not execute programs; use `-r` explicitly. Build failures and
program exit codes are returned to the calling shell.

Outputs:
1. **Symbol Table** (Types, dimensions, scopes, line numbers)
2. **Syntax Tree** (Inorder parse tree structure)
3. **Semantic Analysis** (Type consistency checks, undeclared/redeclaration errors)
4. **Intermediate Representation** (Three-address code)

### Compiler Explorer: an offline journey through compilation

```powershell
.\ccompiler.exe --explore -o explorer.html examples/arithmetic.c
```

```bash
./ccompiler --explore -o explorer.html examples/arithmetic.c
```

Open the HTML file in a browser. It includes source, searchable symbols, a
collapsible main-function tree, diagnostics, and an IR microscope with
Previous / Next / Reset controls. It works offline without external libraries.
Rejected programs also get reports; the CLI still exits with failure.
The default path is `compiler-explorer.html`. Explorer cannot be combined with
build/run mode. It steps through emitted entries, not runtime execution.
Symbol values are estimates and can be inaccurate after branches, loops,
input, or calls.

### Specific Phase Flags

```bash
./ccompiler --tokens examples/simple.c      # Lexical tokens only
./ccompiler --symbols examples/simple.c     # Symbol table only
./ccompiler --parse-tree examples/simple.c  # Parse tree only
./ccompiler --semantic examples/simple.c    # Semantic analysis only
./ccompiler --ir examples/simple.c          # Intermediate 3-address code only
```

### Build a Named Binary Without Running

```bash
./ccompiler -b -o my_prog examples/loops.c
./my_prog
```

### Save Analysis Report to File

```bash
./ccompiler -o report.txt examples/conditionals.c
```

---

## 🧪 Running Tests

Run the example suite and portable regression checks (Python 3 required):

```bash
make test
```

---

## Supported scope and validation

This is an educational C subset frontend; GCC/Clang provides native code
compilation. It is not a complete C implementation. The parser still has grammar
conflicts, uses a flat symbol table rather than C block scopes, and simplifies
pointer types, `sizeof`, function signatures, and control flow IR. Frontend
acceptance alone does not prove valid standard C.

Limits: 300 symbols, 500 IR entries, 100 recorded diagnostics, and textual tokens
shorter than 100 bytes. Exceeding a limit produces an error. Integer expression
estimates use a 32-bit int model.

See [tests/VALIDATION.md](tests/VALIDATION.md) for observed results and limits.
Windows and Linux CI jobs are in [.github/workflows/compiler.yml](.github/workflows/compiler.yml).

## 🌐 Web UI Visualizer

To explore parse trees and symbol tables in your browser:

```bash
xdg-open ui/index.html
```

---

## 📄 License

MIT License - Copyright (c) Anjaneya Tripathi, Isha Waghulde, Khushali Patel
# Compiler-C
