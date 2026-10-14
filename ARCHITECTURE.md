# System Architecture & Technical Specification

This document provides a comprehensive architectural specification of the **C Compiler Studio** full-stack web application, detailing the interaction between the React frontend, the Node.js/Express backend, and the native Flex/Bison compiler executable.

---

## 1. System Overview & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                              Client Web Browser                                   |
|  - Monaco Editor (C syntax highlighting, custom stdin, presets)                   |
|  - Phase Pipeline Visualizer (Real-time completion & diagnostic status)           |
|  - Tabbed Results Panel (Tokens, AST, Symbol Table, TAC IR, Optimization, Output) |
+-----------------------------------------------------------------------------------+
                                         │
                         HTTP REST API   │  JSON (over TLS in prod)
                         POST /api/compile
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Node.js / Express Backend (TypeScript)                     |
|  - Security Middleware: Helmet (headers), CORS (origin validation), Rate Limiter  |
|  - Request Validation: 64KB size guard, empty string check, sanitization          |
|  - Compiler Controller: Dispatches compilation jobs to CompilerService            |
+-----------------------------------------------------------------------------------+
                                         │
                           Safe Process  │  child_process.spawn()
                           Invocation    │  (shell: false, no injection)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Isolated Temporary Workspace (/tmp/compile_*)               |
|  - Unique execution directory per request (UUID-isolated)                         |
|  - input.c written safely                                                         |
|  - Execution timeouts (5-8 seconds max)                                           |
|  - Automatic recursive cleanup in finally block                                   |
+-----------------------------------------------------------------------------------+
                                         │
                             Executes    │  Native Binary
                                         ▼
+-----------------------------------------------------------------------------------+
|                   Real C Compiler Frontend Binary (./ccompiler)                   |
|  - Phase 1: Lexical Analyzer (Flex: lexer.l) -> Token stream                      |
|  - Phase 2: Syntax Analyzer (Bison: parser_wrapper.y) -> Inorder AST              |
|  - Phase 3: Semantic Analyzer -> Scopes, types, redeclaration checks              |
|  - Supporting: Symbol Table (struct dataType symbol_table[300])                   |
|  - Phase 4: Intermediate Code Generator -> Three-Address Code (TAC)               |
|  - Phase 5: Optimizer -> Constant Folding in binary_expression()                  |
|  - Optional Execution (-r) -> Host GCC / Clang compiles and runs native binary   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Frontend Architecture (`frontend/`)

### 2.1 Technology Choices & Rationale
- **React 18 & TypeScript**: Provides strict type safety matching the backend API contracts.
- **Vite**: Ultra-fast build tool and development server with hot module replacement (HMR).
- **Tailwind CSS**: Utility-first CSS providing a sleek, dark-themed online IDE interface.
- **Monaco Editor (`@monaco-editor/react`)**: The industry-standard code editor engine powering VS Code, offering authentic C language syntax highlighting, bracket matching, and line numbers.
- **Lucide React**: Clean, accessible icon library.

### 2.2 Component Hierarchy & Responsibilities
- `App.tsx`: Central coordinator managing active code, compilation states, selected tabs, and backend health polling.
- `Header.tsx`: Branding, navigation, and live backend connection badge (green/amber/red indicator).
- `PhasePipeline.tsx`: Visual step-by-step pipeline representing the compiler's 6 stages. Displays real execution status, execution times, and acts as an interactive tab navigator.
- `EditorPanel.tsx`: Houses the Monaco Editor, example program selector, custom stdin input drawer, clear confirmation safeguard, and action buttons (`Analyze Phases` and `Run Binary`).
- `ResultsPanel.tsx`: Tabbed panel rendering authentic compiler outputs across 8 dedicated views:
  - **Overview**: Status banner, metrics cards, and phase checklist.
  - **Tokens**: Searchable table of scanned tokens and line references.
  - **Parse Tree**: Inorder AST traversal with syntax node tags.
  - **Symbol Table**: Searchable table of variables, constants, headers, and functions with data types and estimated values.
  - **3-Address Code**: Line-numbered Three-Address Code (TAC) with syntax highlighting and copy button.
  - **Optimization**: Evidence and explanations of compile-time constant folding and propagation.
  - **Execution**: Console terminal displaying stdout and return code from native program execution (`-r`).
  - **Diagnostics**: Error reports with line numbers and phase origins.
- `AboutModal.tsx`: Academic specifications, grammar subset, and documented limitations.

---

## 3. Backend Architecture (`backend/`)

### 3.1 Technology Choices & Rationale
- **Node.js & Express (TypeScript)**: Lightweight, asynchronous, and high-performance server.
- **Helmet**: Injects HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.).
- **Express Rate Limit**: Prevents automated Denial of Service (DoS) attacks by limiting clients to 60 compilation requests per minute.
- **CORS**: Configurable cross-origin resource sharing.

### 3.2 Compiler Service & Safe Invocation (`CompilerService.ts`)
The backend communicates with the compiled C binary without replacing or modifying any compilation logic:

1. **Binary Auto-Resolution**:
   `CompilerService` resolves the native binary path in priority order:
   `process.env.COMPILER_BIN` -> `../../ccompiler` -> `../ccompiler` -> `ccompiler`.
2. **Workspace Isolation**:
   Every incoming request creates a temporary directory using `os.tmpdir()` and a unique random token (e.g. `/tmp/compile_1697200000_a8f93e/`).
3. **Shell-Free Process Spawning**:
   The binary is invoked using `child_process.spawn()` with `shell: false`:
   ```typescript
   spawn(binaryPath, ['--tokens', sourceFilePath], { cwd: tempDir, shell: false });
   ```
   User code is stored in `input.c` on disk; it is **never passed as a shell command line argument**, eliminating command injection vulnerabilities.
4. **Output Parsing & Extraction**:
   - `parseTokens()` extracts lines matching `TOKEN line <N> <TYPE> <LEXEME>`.
   - `parseAnalysisOutput()` splits sections marked by the compiler's output headers (`PHASE 1`, `PHASE 2`, `PHASE 3`, `PHASE 4`) into structured JSON arrays.
   - Syntax and semantic errors are identified with line numbers.
5. **Guaranteed Cleanup**:
   A `finally` block removes the temporary directory immediately after compilation completes, ensuring no file leaks.

---

## 4. Security Model & Sandbox Boundaries

| Threat / Vulnerability | Mitigation in Current Architecture |
|---|---|
| **Command Injection** | Process invocation strictly uses `spawn()` with `shell: false`. Arguments are discrete array elements, never concatenated into shell strings. |
| **Path Traversal** | The server does not accept file paths from users. All source code is written to randomized, temporary workspaces inside the OS temp directory. |
| **Denial of Service (Oversized Payloads)** | Request bodies are limited to 128KB by Express, and source code is strictly rejected if it exceeds 64KB (`HTTP 413 Payload Too Large`). |
| **Denial of Service (CPU Exhaustion / Infinite Loops)** | Hard execution timeout enforced: process is killed via `SIGKILL` if analysis exceeds 5 seconds (or 8 seconds for program execution). Output buffer is capped at 2MB to prevent memory exhaustion. |
| **Rate Abuse** | `express-rate-limit` enforces a maximum of 60 requests per minute per IP address. |
| **Container Privilege Escalation** | Dockerfile creates and runs as an unprivileged, non-root user (`compileruser`, UID 1001). |

> [!WARNING]
> **Execution Mode Security Warning**:
> When a user clicks **Run Binary** (`runProgram: true`), the toolchain uses GCC to compile and execute the submitted C code on the host machine.
> While the compilation frontend is safe, untrusted C code executed natively can theoretically perform system calls. In public internet deployments, either:
> 1. Disable execution mode and use analysis mode only, OR
> 2. Run the Docker container with read-only root filesystems, dropped capabilities (`--cap-drop=ALL`), and seccomp filters.

---

## 5. Documented Limitations & Trade-Offs

1. **Flat Symbol Table**: The compiler's underlying symbol table is a flat array bounded to 300 entries. It does not support block-level variable shadowing.
2. **Simplified Grammar**: The compiler parses a large subset of ANSI C, but does not support preprocessor macros (`#define` is skipped), structs, unions, or multi-level pointers.
3. **Host Compiler Dependency**: For Phase 5 native program execution (`-r`), the backend host must have `gcc` or `clang` installed in `PATH`.
