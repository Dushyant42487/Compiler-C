# Compiler Project Presentation Slide Outline
## Professional Six-Student Academic Defense Slide Deck
**Project:** C Compiler Studio — Custom Multi-Phase Compiler with Modern Web IDE  
**Target Duration:** 18–20 Minutes (approx. 2.5–3 minutes per student + shared demo)  
**Target Audience:** University Examination Board, External Evaluators, Academic Mentors  

---

## Slide 1: Title & Team Allocation
- **Slide Title:** C Compiler Studio: Design, Implementation & Pipeline Visualization of a Multi-Phase C Compiler
- **Subtitle:** Undergraduate Computer Science Capstone / Academic Project Presentation
- **Speaker:** Student 1 (Opening Team Representative)
- **Visual Elements:** 
  - Central system branding logo.
  - 6-Column or 2x3 Grid showing each student's name, assigned compiler phase, and primary source module:
    1. **Student 1:** Phase 1 — Lexical Analysis (`compiler/lexer.l`)
    2. **Student 2:** Phase 2 — Syntax Analysis & AST Generation (`compiler/parser_wrapper.y`)
    3. **Student 3:** Phase 3 — Semantic Analysis & Symbol Table Management (`compiler/parser_wrapper.y`)
    4. **Student 4:** Phase 4 — Intermediate Code Generation (Three-Address Code) (`compiler/parser_wrapper.y`)
    5. **Student 5:** Phase 5 — Machine-Independent Code Optimization (`compiler/parser_wrapper.y`)
    6. **Student 6:** Phase 6 — Target Code Execution, CLI Driver & Web Studio Integration (`cli/main.c`, `backend/`, `frontend/`)
- **Key Talking Points:**
  - Strict phase-based decomposition: every team member owns an authentic implementation phase.
  - Transparent engineering boundaries: custom pipeline covers phases 1 through 5; target binary execution integrates host GCC/Clang via native CLI driver.

---

## Slide 2: End-to-End Compiler Pipeline & Architecture
- **Slide Title:** Master Compilation Pipeline & Data Flow Architecture
- **Speaker:** Student 1 (Bridge to Phase 1)
- **Visual Elements:**
  - High-resolution horizontal flow diagram:
    `Source Code (.c)` ➔ `[Lexer (Flex)]` ➔ `Token Stream` ➔ `[Parser (Bison)]` ➔ `Abstract Syntax Tree (AST)` ➔ `[Semantic Analyzer]` ➔ `Decorated AST + Symbol Table` ➔ `[ICG Quadruple Engine]` ➔ `Linear TAC (icg[])` ➔ `[Constant Folding Optimizer]` ➔ `Optimized TAC` ➔ `[CLI Driver / Host Backend]` ➔ `Target Executable / stdout`
  - Dual Execution Mode indicator: Native Terminal CLI (`./c_compiler_cli`) vs. Full-Stack Web Studio (`/api/compile` ➔ Monaco UI).
- **Key Talking Points:**
  - The classic dragon-book compiler model brought to life in C99, Flex, and Bison.
  - Data structures passed cleanly between phases via global shared registries and synthesized grammar attributes (`$$.nd`, `$$.name`).

---

## Slide 3: Codebase Structure & Physical File Mapping
- **Slide Title:** Repository Organization & Phase Responsibility Matrix
- **Speaker:** Student 1
- **Visual Elements:**
  - Summary table linking compiler phases to source files, lines of code, and key functions:
    | Phase | Primary Source File | Lines of Code | Key Functions / Structures |
    |---|---|---|---|
    | 1. Lexical Analysis | `compiler/lexer.l` | 100 LOC | `yylex()`, `COPY_TOKEN()`, `countn()` |
    | 2. Syntax Analysis | `compiler/parser_wrapper.y` | 1042 LOC | `yyparse()`, `mknode()`, `print_inorder()` |
    | 3. Semantic Analysis | `compiler/parser_wrapper.y` | ~250 LOC | `symbol_table[300]`, `check_declaration()` |
    | 4. Intermediate Code | `compiler/parser_wrapper.y` | ~200 LOC | `emit_ir()`, `icg[500]`, `temp_var`, `label` |
    | 5. Code Optimization | `compiler/parser_wrapper.y` | ~150 LOC | `binary_expression()`, `can_eval()` |
    | 6. Target Exec & Web | `cli/main.c`, `backend/` | 629 LOC + Express | `find_c_backend()`, `run_backend_compiler()` |
- **Key Talking Points:**
  - Single-repository cohesion with zero hidden black boxes.

---

## Slide 4: Student 1 — Phase 1: Lexical Analysis
- **Slide Title:** Phase 1: Lexical Analysis & Token Stream Scanning
- **Speaker:** Student 1 (Duration: 2.5 Minutes)
- **Visual Elements:**
  - Flex scanning mechanism diagram: Regex Pattern Matching ➔ Deterministic Finite Automaton (DFA) transitions.
  - Token Classification Card:
    - **Keywords:** `int`, `float`, `char`, `if`, `else`, `while`, `for`, `return`, `include`
    - **Identifiers:** `[a-zA-Z_][a-zA-Z0-9_]*`
    - **Constants:** Decimal Integers (`[0-9]+`), Real Floats (`[0-9]+\.[0-9]+`), Quoted Strings, Character Literals
    - **Operators & Punctuation:** Multi-char (`==`, `!=`, `<=`, `>=`, `&&`, `||`) vs Single-char (`+`, `-`, `*`, `/`, `;`, `{`, `}`)
- **Key Talking Points:**
  - Purpose of scanning: converting raw ASCII text into discrete syntactic tokens while stripping non-semantic whitespace and comments.
  - Multiline & Single-line comment handling via `countn()` maintaining source synchronization.
  - Safe memory handling: the `COPY_TOKEN()` macro enforcing 99-byte bounds to prevent buffer overflow vulnerabilities.

---

## Slide 5: Student 1 — Lexer Code & Token Stream Demonstration
- **Slide Title:** Lexer Implementation Deep-Dive & Concrete Token Stream
- **Speaker:** Student 1
- **Visual Elements:**
  - Side-by-side comparison:
    - **Left (Source C Code):**
      ```c
      int main() {
          int a = 10 + 20;
          return a;
      }
      ```
    - **Right (Emitted Token Stream & Attributes):**
      - `<INT, "int">` (Line 1)
      - `<IDENTIFIER, "main">` (Line 1)
      - `<LPAREN, "(">` `<RPAREN, ")">`
      - `<LBRACE, "{">` (Line 1)
      - `<INT, "int">` (Line 2)
      - `<IDENTIFIER, "a">` (Line 2)
      - `<ASSIGN, "=">` (Line 2)
      - `<INTEGER, "10">` `<PLUS, "+">` `<INTEGER, "20">`
      - `<SEMICOLON, ";">`
      - `<RETURN, "return">` (Line 3)
      - `<IDENTIFIER, "a">` (Line 3)
      - `<SEMICOLON, ";">`
      - `<RBRACE, "}">` (Line 4)
  - Code Excerpt of `COPY_TOKEN()` macro from `compiler/lexer.l`:
    ```c
    #define COPY_TOKEN() do { \
        strncpy(yylval.nd_obj.name, yytext, 99); \
        yylval.nd_obj.name[99] = '\0'; \
    } while(0)
    ```
- **Key Talking Points:**
  - Every token carries both syntactic class (`yytokentype`) and semantic value (`yylval.nd_obj.name`).
  - Strict handoff to Student 2's LALR(1) parser.

---

## Slide 6: Student 2 — Phase 2: Syntax Analysis & Grammar Specification
- **Slide Title:** Phase 2: Syntax Analysis & Grammar Verification
- **Speaker:** Student 2 (Duration: 2.5 Minutes)
- **Visual Elements:**
  - Bison LALR(1) Parsing Diagram: Shift-Reduce state automaton, Parse Stack, and Lookahead Token evaluation.
  - Operator Precedence & Associativity Table (`compiler/parser_wrapper.y` lines 120–135):
    - `%right '='` (Right-associative assignment)
    - `%left OR`, `%left AND` (Logical short-circuit operations)
    - `%left EQ NE`, `%left '<' '>' LE GE` (Relational comparisons)
    - `%left '+' '-'` (Additive arithmetic)
    - `%left '*' '/'` (Multiplicative arithmetic)
    - Dangling-Else disambiguation: `%nonassoc LOWER_THAN_ELSE`, `%nonassoc ELSE`
- **Key Talking Points:**
  - Converting a 1D token stream into a hierarchical syntactic structure according to Context-Free Grammar (CFG) rules.
  - Resolving shift-reduce grammar conflicts mathematically using Bison declarations.

---

## Slide 7: Student 2 — Abstract Syntax Tree (AST) Construction & Traversal
- **Slide Title:** AST Node Generation & Inorder Traversal
- **Speaker:** Student 2
- **Visual Elements:**
  - Structure Diagram of `struct node`:
    ```c
    struct node {
        struct node *left;
        struct node *right;
        char *token;
    };
    ```
  - AST Tree Diagram for `int a = 10 + 20;`:
    ```
            [ = ]
           /     \
      [ a ]       [ + ]
                 /     \
             [ 10 ]   [ 20 ]
    ```
  - Code Excerpt: `mknode()` and recursive `print_inorder()` function.
- **Key Talking Points:**
  - Bottom-up AST synthesis: terminal nodes created during token matching; operator nodes combine left and right subtrees.
  - `print_inorder()` provides concrete verification of syntactic validity and structural precedence.

---

## Slide 8: Student 3 — Phase 3: Semantic Analysis & Symbol Table
- **Slide Title:** Phase 3: Semantic Validation & Symbol Table Architecture
- **Speaker:** Student 3 (Duration: 2.5 Minutes)
- **Visual Elements:**
  - Static Symbol Table Array Diagram (`symbol_table[300]`):
    - Columns: `id_name`, `data_type`, `type` (VAR / FUNC), `line_no`, `scope`
  - Semantic Rule Enforcement Engine:
    1. **Variable Declaration Check:** Identifying undeclared variables before use (`check_declaration()`).
    2. **Multiple Declaration Detection:** Preventing duplicate identifiers in the same scope.
    3. **Keyword Shadowing Guard:** Blocking reserved words (`if`, `while`, `return`) from being declared as variables.
    4. **47-Function Standard Library Whitelist:** Auto-recognizing `printf`, `scanf`, `malloc`, `exit`, etc., without false undeclared errors.
- **Key Talking Points:**
  - Syntax answers "Is the program grammatically valid?"; Semantics answers "Does the program make logical sense?".
  - Type inference and implicit coercion handling (`inttofloat`, `floattoint`).

---

## Slide 9: Student 3 — Semantic Error Detection & Table State
- **Slide Title:** Semantic Diagnostics & Symbol Table Visualization
- **Speaker:** Student 3
- **Visual Elements:**
  - Real Symbol Table State Snapshot from execution of a test program:
    | Name | Data Type | Kind | Line Number | Scope |
    |---|---|---|---|---|
    | `main` | `INT` | `FUNC` | Line 1 | Global (0) |
    | `count` | `INT` | `VAR` | Line 2 | Local (1) |
    | `rate` | `FLOAT` | `VAR` | Line 3 | Local (1) |
    | `msg` | `CHAR*` | `VAR` | Line 4 | Local (1) |
  - Error Interception Example:
    ```
    SEMANTIC ERROR: Line 5: Variable 'x' used without prior declaration.
    SEMANTIC ERROR: Line 7: Duplicate declaration of identifier 'count' in scope 1.
    ```
- **Key Talking Points:**
  - Safe symbol resolution enables error resilience: semantic errors are collected and reported with line numbers without crashing the compiler.

---

## Slide 10: Student 4 — Phase 4: Intermediate Code Generation (ICG)
- **Slide Title:** Phase 4: Intermediate Code Generation & Three-Address Code
- **Speaker:** Student 4 (Duration: 2.5 Minutes)
- **Visual Elements:**
  - Intermediate Representation Model: Quadruple Format `(operator, operand1, operand2, result)`
  - Storage buffer: `struct quad icg[500]` with `emit_ir()` emission engine.
  - Linearization Strategy:
    - Flattening nested expression trees into sequential atomic operations.
    - Systematic Temporary Variable Allocation: `t0, t1, t2, ... tn` via `temp_var++`.
    - Control-Flow Label Synthesis: `L0, L1, L2, ... Ln` for conditional jumps and loop targets.
- **Key Talking Points:**
  - Why ICG matters: decouples language-specific frontend parsing from machine-specific target architecture.
  - Machine independence: the emitted TAC can target x86_64, ARM64, or RISC-V equally well.

---

## Slide 11: Student 4 — ICG Control Flow & Quadruple Trace
- **Slide Title:** Expression Flattening & Control Flow Linearization
- **Speaker:** Student 4
- **Visual Elements:**
  - C Control-Flow Statement:
    ```c
    while (count < 10) {
        sum = sum + count;
        count++;
    }
    ```
  - Emitted Three-Address Code (TAC):
    ```
    L0:
        t0 = count < 10
        ifFalse t0 goto L1
        t1 = sum + count
        sum = t1
        t2 = count + 1
        count = t2
        goto L0
    L1:
    ```
  - Internal Quadruple representation showing exact array indices in `icg[]`.
- **Key Talking Points:**
  - High-level looping abstractions are translated into elementary comparison, conditional branch (`ifFalse`), and unconditional jump (`goto`) instructions.

---

## Slide 12: Student 5 — Phase 5: Machine-Independent Code Optimization
- **Slide Title:** Phase 5: Machine-Independent Code Optimization
- **Speaker:** Student 5 (Duration: 2.5 Minutes)
- **Visual Elements:**
  - Optimization Taxonomy Diagram: Machine-Independent vs. Machine-Dependent.
  - Implemented Techniques in `compiler/parser_wrapper.y`:
    1. **Compile-Time Constant Folding:** Evaluating arithmetic expressions involving pure numeric literals during AST reduction (`binary_expression()`, `can_eval()`).
    2. **Constant Propagation:** Propagating compile-time known constants through temporary registers.
    3. **Zero-Division Safety Guard:** Detecting division by literal zero at compile time and warning the developer while halting illegal foldings.
- **Key Talking Points:**
  - Optimization preserves exact semantic program behavior while minimizing runtime instructions and memory cycles.
  - Compile-time evaluation occurs directly inside Bison grammar action reductions.

---

## Slide 13: Student 5 — Optimization Before & After Comparison
- **Slide Title:** Concrete Optimization Trace & Instruction Reduction
- **Speaker:** Student 5
- **Visual Elements:**
  - Side-by-Side Code Trace:
    - **Source Code:**
      ```c
      int a = 10 + 20 * 3;
      int b = a + 0;
      ```
    - **Unoptimized Intermediate Code:**
      ```
      t0 = 20 * 3        (runtime multiplication)
      t1 = 10 + t0       (runtime addition)
      a = t1
      t2 = a + 0         (redundant addition)
      b = t2
      (Total: 5 instructions, 3 temporaries)
      ```
    - **Optimized Intermediate Code (Our Compiler):**
      ```
      a = 70             (Folded at compile time!)
      b = a              (Algebraic simplification!)
      (Total: 2 instructions, 0 temporaries — 60% instruction reduction!)
      ```
  - Code Excerpt: `can_eval()` and literal reduction routine.
- **Key Talking Points:**
  - Significant reduction in CPU instruction count and register pressure before target code generation.

---

## Slide 14: Student 6 — Phase 6: Target Execution & CLI Driver
- **Slide Title:** Phase 6: Target Code Execution & Native CLI Driver
- **Speaker:** Student 6 (Duration: 3 Minutes)
- **Visual Elements:**
  - Native CLI Driver Architecture (`cli/main.c`):
    - Subprocess execution flow: `fork()` ➔ `execvp()` ➔ `waitpid()` with exit code harvesting.
  - Auto-Detection Engine: `find_c_backend()`:
    - Probing host system for `/usr/bin/gcc`, `/usr/bin/clang`, or environment overrides (`$CC`).
  - Terminal Command Interface:
    ```bash
    ./c_compiler_cli program.c --tokens --ast --symtab --ir --opt -o program
    ```
- **Key Talking Points:**
  - Architectural honesty: custom pipeline handles phases 1–5; host native GCC/Clang is delegated for machine code generation and ABI linkage.
  - Native driver provides complete pipeline inspection flags (`--tokens`, `--ast`, `--ir`, `--symtab`).

---

## Slide 15: Student 6 — Web Studio Architecture & End-to-End Pipeline
- **Slide Title:** Full-Stack Web Studio Integration & Deployment
- **Speaker:** Student 6
- **Visual Elements:**
  - Full-Stack Architecture Diagram:
    - **Frontend:** React 19 + TypeScript + Monaco Code Editor + Tailwind/CSS Visualizer Panels (`http://localhost:3005`).
    - **Backend API:** Node.js + Express REST API (`POST /api/compile`, port 5005).
    - **Execution Environment:** Isolated scratch directories (`fs.mkdtemp()`), timeout guards, Dockerized container deployment on Render.
  - Browser UI Screenshot: Showing multi-tab interface with live code editor, console terminal, Token table, AST tree viewer, Symbol table, and TAC output.
- **Key Talking Points:**
  - Real-time compiler inspection tool for students and instructors: transforms abstract compiler concepts into interactive visual panels.

---

## Slide 16: Live Demonstration Plan (3–5 Minutes)
- **Slide Title:** Live System Demonstration Workflow
- **Speaker:** Shared / Led by Student 6 & Student 1
- **Visual Elements:**
  - Step-by-Step Live Demo Action Plan:
    1. **Action 1:** Launch Web Studio at `http://localhost:3005` with clean C program.
    2. **Action 2 (Student 1):** Click Compile ➔ Open **Tokens Panel** (Demonstrate regex classification & buffer guard).
    3. **Action 3 (Student 2):** Open **AST Panel** (Demonstrate parsed syntax tree hierarchy & precedence).
    4. **Action 4 (Student 3):** Open **Symbol Table Panel** (Inspect scope, type descriptors, and stdlib whitelist).
    5. **Action 5 (Student 4 & 5):** Open **Intermediate Code Panel** (Inspect TAC quadruples and constant folding: `10 + 20` ➔ `30`).
    6. **Action 6 (Student 6):** Run the program and inspect output in the integrated terminal.
    7. **Action 7 (Negative Case):** Introduce an undeclared variable `y = 5;` ➔ Trigger semantic diagnostics without crashing.
  - Offline Fallback Plan: Pre-compiled CLI binary `./c_compiler_cli demo.c --all`.
- **Key Talking Points:**
  - Demonstrates system stability, error recovery, and cross-platform reliability.

---

## Slide 17: Technical Defense & Viva Quick Reference
- **Slide Title:** Key Architectural Decisions & Viva Defense Matrix
- **Speaker:** All Students
- **Visual Elements:**
  - Summary Table of Core Defense Questions:
    | Student | Core Viva Question | Our Architectural Answer |
    |---|---|---|
    | **Student 1** | Why Flex over manual `getchar()`? | Guarantees minimal DFA states via Thompson's construction and regex rigor. |
    | **Student 2** | How do you prevent shift-reduce conflicts? | Bison `%left` and `%right` precedence declarations resolve ambiguities mathematically. |
    | **Student 3** | Why use a static symbol table? | $O(1)$ indexed access with predictable cache-friendly memory footprint for educational scopes. |
    | **Student 4** | Why Three-Address Code? | Quadruples linearize high-level trees into atomic instructions directly mappable to registers. |
    | **Student 5** | Is Constant Folding machine-dependent? | No. It operates entirely on the AST/IR independent of target CPU registers or memory widths. |
    | **Student 6** | Why delegate to host GCC/Clang? | Honors production engineering boundaries: leverages mature backend optimizations and OS ABI linkers. |

---

## Slide 18: Project Strengths, Engineering Limitations & Future Roadmap
- **Slide Title:** Project Evaluation, Known Limitations & Roadmap
- **Speaker:** Student 6 / Team
- **Visual Elements:**
  - **Key Accomplishments:**
    - Fully operational 6-phase compiler with complete custom frontend and intermediate representation.
    - Integrated web-based educational studio with synchronized phase visualization.
    - Robust error recovery in scanning, parsing, and semantic analysis.
  - **Known Engineering Limitations:**
    - Fixed static symbol table capacity (300 symbols) without dynamically allocated hash buckets.
    - Single-scope / global variable shadowing limitations in deep nested blocks.
    - Target code generation delegated rather than native LLVM IR or custom ASM emission.
  - **Future Roadmap:**
    - Implementation of dynamic hash-table symbol tables with hierarchical lexical scoping.
    - Native LLVM IR emitter for direct machine-code generation without external GCC dependency.
    - Control-Flow Graph (CFG) visualizer with Common Subexpression Elimination (CSE).

---

## Slide 19: Conclusion & Q&A
- **Slide Title:** Conclusion & Open Defense
- **Speaker:** All Students
- **Visual Elements:**
  - Summary recap banner:
    - 6 Students, 6 Dedicated Phases, 1 Unified Compiler System.
    - Source code available on GitHub.
  - "Thank You! We are now open for questions from the examination board."
- **Key Talking Points:**
  - Ready for individual student questioning on specific source code lines and compiler theory.
