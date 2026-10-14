# C Compiler Studio: Complete Phase-Wise Architecture, Technical Reference & Implementation Guide

---

## Executive Summary

**C Compiler Studio** is an educational, production-grade C compiler frontend and interactive development environment developed for undergraduate and graduate-level Compiler Design courses. The system demonstrates the classical multi-phase architecture of an optimizing compiler, translating a well-defined imperative subset of ANSI C into an Abstract Syntax Tree (AST), validating program semantics using an explicit Symbol Table, generating Three-Address Code (TAC) Intermediate Representation (IR), performing compile-time Constant Folding optimizations, and orchestrating native machine code generation and execution through a host backend compiler (GCC or Clang).

This document serves as the **Master Architectural Reference and Comprehensive Guide** for a team of **six computer science students**, each taking full ownership of one compiler phase or cohesive implementation domain.

---

## Table of Contents

1. [Project Overview & Core Philosophy](#1-project-overview--core-philosophy)
2. [End-to-End Compiler Pipeline Diagram](#2-end-to-end-compiler-pipeline-diagram)
3. [Six-Student Phase Allocation & Responsibilities](#3-six-student-phase-allocation--responsibilities)
4. [Phase 1: Lexical Analysis (Flex Scanner)](#4-phase-1-lexical-analysis-flex-scanner)
5. [Phase 2: Syntax Analysis & AST Generation (Bison LALR(1) Parser)](#5-phase-2-syntax-analysis--ast-generation-bison-lalr1-parser)
6. [Phase 3: Semantic Analysis & Symbol Table Management](#6-phase-3-semantic-analysis--symbol-table-management)
7. [Phase 4: Intermediate Code Generation (Three-Address Code)](#7-phase-4-intermediate-code-generation-three-address-code)
8. [Phase 5: Code Optimization (Constant Folding & Propagation)](#8-phase-5-code-optimization-constant-folding--propagation)
9. [Phase 6: Target Code Execution, CLI Driver & Web Integration](#9-phase-6-target-code-execution-cli-driver--web-integration)
10. [End-to-End Program Trace: Concrete Execution Walkthrough](#10-end-to-end-program-trace-concrete-execution-walkthrough)
11. [Master Source Code File Reference Table](#11-master-source-code-file-reference-table)
12. [Web Application Architecture & Execution Flow](#12-web-application-architecture--execution-flow)
13. [Live Academic Demonstration Plan](#13-live-academic-demonstration-plan)
14. [Compiler Limitations & Future Engineering Roadmap](#14-compiler-limitations--future-engineering-roadmap)

---

## 1. Project Overview & Core Philosophy

### 1.1 Custom Implementation vs. Delegated Backend Execution
A central academic requirement of compiler engineering is clearly delineating which parts of the compilation process are **custom-built** and which parts rely on existing host toolchains:

| Stage | Subsystem | Implementation Type | Description |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Lexical Scanner | **Custom Built** | Flex-generated DFA scanner in `compiler/lexer.l` reading raw characters and outputting classified token streams. |
| **Phase 2** | Syntax Parser | **Custom Built** | Bison-generated LALR(1) pushdown automaton in `compiler/parser_wrapper.y` verifying grammar and building the AST. |
| **Phase 3** | Semantic Analyzer | **Custom Built** | Scope checker, 47-function stdlib whitelist, type compatibility evaluator, and `symbol_table[300]` in `compiler/parser_wrapper.y`. |
| **Phase 4** | Intermediate Code (IR) | **Custom Built** | Quadruple-based Three-Address Code (TAC) generator synthesizing temporaries (`t0, t1...`) and labels (`L0, L1...`). |
| **Phase 5** | Optimizer | **Custom Built** | Compile-time constant folding pass in `binary_expression()` computing constant subexpressions at compile-time. |
| **Phase 6** | Code Gen & Execution | **Orchestrated Host Delegation** | Host backend driver in `cli/main.c` detecting system GCC or Clang to produce a runnable native executable binary (`a.out`/`a.exe`). |

### 1.2 Language Subset Supported
The compiler parses an imperative subset of ANSI C, including:
- **Primitive Data Types**: `int`, `float`, `double`, `char`, `void`, `long`, `short`, `unsigned`, `signed`, `const`.
- **Pointers & References**: Single pointer declarations (`int *ptr`), dereferencing (`*ptr = val`), and address-of operations (`&var`).
- **Array Aggregates**: Single-dimensional arrays (`int arr[10]`) and two-dimensional arrays (`int mat[3][3]`).
- **Control Flow**: `if`, `if-else`, `switch-case`, `for`, `while`, `do-while`, `break`, `continue`, `return`.
- **Operators**: Arithmetic (`+`, `-`, `*`, `/`, `%`), Relational (`<`, `>`, `<=`, `>=`, `==`, `!=`), Logical (`&&`, `||`, `!`), Bitwise (`&`, `|`, `^`, `~`, `<<`, `>>`), Compound Assignments (`+=`, `-=`, `*=`, `/=`, `%=`), and Ternary (`?:`).
- **Built-in Standard Library Whitelist**: 47 C standard library routines (e.g., `printf`, `scanf`, `malloc`, `free`, `strlen`, `strcpy`, `exit`) recognized natively as pre-declared functions.

---

## 2. End-to-End Compiler Pipeline Diagram

```
                       +-----------------------------------+
                       |         Source Code (.c)          |
                       +-----------------------------------+
                                         |
                                         | Character Stream
                                         v
   +-------------------------------------------------------------------------------+
   | PHASE 1: LEXICAL ANALYSIS (Flex Scanner)                                     |
   | File: compiler/lexer.l                                                        |
   | Regex Matching, Maximal Munch, Comment Skipping, Line Counting                |
   +-------------------------------------------------------------------------------+
                                         |
                                         | Token Stream: (TOKEN_TYPE, lexeme, line)
                                         v
   +-------------------------------------------------------------------------------+
   | PHASE 2: SYNTAX ANALYSIS & AST GENERATION (Bison Parser)                     |
   | File: compiler/parser_wrapper.y                                               |
   | LALR(1) Shift-Reduce Automaton, Operator Precedence, AST Construction (mknode)|
   +-------------------------------------------------------------------------------+
                                         |
                                         | Abstract Syntax Tree (struct node *head)
                                         v
   +-------------------------------------------------------------------------------+
   | PHASE 3: SEMANTIC ANALYSIS & SYMBOL TABLE                                    |
   | File: compiler/parser_wrapper.y                                               |
   | Undeclared ID Detection, Scope Lookup, Type Casting, symbol_table[300]        |
   +-------------------------------------------------------------------------------+
                                         |
                                         | Validated AST & Annotated Symbol Records
                                         v
   +-------------------------------------------------------------------------------+
   | PHASE 4: INTERMEDIATE CODE GENERATION (Three-Address Code)                    |
   | File: compiler/parser_wrapper.y                                               |
   | Linearization, Temporary Synthesis (t0, t1..), Jump Labels (L0, L1..), icg[500] |
   +-------------------------------------------------------------------------------+
                                         |
                                         | Linear TAC Quadruple Sequence
                                         v
   +-------------------------------------------------------------------------------+
   | PHASE 5: CODE OPTIMIZATION (Constant Folding & Propagation)                  |
   | File: compiler/parser_wrapper.y (binary_expression, can_eval)                |
   | Compile-time Arithmetic Evaluation, Zero-Divide Guards, Constant Substitution |
   +-------------------------------------------------------------------------------+
                                         |
                                         | Optimized Linear TAC & Verified Source
                                         v
   +-------------------------------------------------------------------------------+
   | PHASE 6: TARGET EXECUTION, CLI DRIVER & WEB INTEGRATION                      |
   | Files: cli/main.c, backend/src/services/compilerService.ts, frontend/src/     |
   | Host GCC/Clang Delegation, Sandbox Execution, REST API, IDE Visualization    |
   +-------------------------------------------------------------------------------+
                                         |
                                         v
                       +-----------------------------------+
                       |      Runnable Machine Binary      |
                       |    Standard Output (stdout)       |
                       |    Phase Visualization in Web UI  |
                       +-----------------------------------+
```

---

## 3. Six-Student Phase Allocation & Responsibilities

The implementation work is divided evenly among six computer science students, ensuring each student has a dedicated compiler phase and associated files:

```
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student   | Primary Compiler Phase            | Core Implementation Files         | Key Responsibilities               |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student 1 | Phase 1: Lexical Analysis         | compiler/lexer.l                  | Regular expressions, token stream, |
|           | (Flex Scanner)                    | compiler/lex.yy.c                 | line tracking, buffer safety guard |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student 2 | Phase 2: Syntax Analysis &        | compiler/parser_wrapper.y         | LALR(1) grammar, AST nodes,        |
|           | AST Construction (Bison)          | compiler/y.tab.c, y.tab.h         | mknode(), inorder tree traversal   |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student 3 | Phase 3: Semantic Analysis &      | compiler/parser_wrapper.y         | Symbol table struct, type checks,  |
|           | Symbol Table Management           | (symbol_table, check_declaration) | stdlib whitelist, scope lookup     |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student 4 | Phase 4: Intermediate Code        | compiler/parser_wrapper.y         | Three-Address Code, emit_ir(),     |
|           | Generation (Three-Address Code)   | (icg, temp_var, label, condition) | temporaries (t0, t1), labels (L0)  |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student 5 | Phase 5: Code Optimization        | compiler/parser_wrapper.y         | Constant folding, can_eval(),      |
|           | (Constant Folding & Propagation)  | (binary_expression, get_num_val)  | divide-by-zero compile-time check  |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
| Student 6 | Phase 6: Target Execution,        | cli/main.c                        | Host GCC/Clang delegation, sandbox |
|           | CLI Driver & Web IDE Studio       | backend/src/, frontend/src/       | process execution, REST API, UI    |
+-----------+-----------------------------------+-----------------------------------+------------------------------------+
```

---

## 4. Phase 1: Lexical Analysis (Flex Scanner)

### 4.1 Responsibility & Theoretical Foundation
Lexical analysis is the initial phase of compilation. Its objective is to scan the linear sequence of characters constituting the source code, eliminate irrelevant whitespace and comments, and group characters into meaningful syntactic tokens.

### 4.2 File Path & Key Data Structures
- **Source Specification**: `compiler/lexer.l` (100 lines)
- **Generated C Scanner**: `compiler/lex.yy.c`
- **Line Counter**: `int countn = 0;` (tracks line numbers for error reporting)
- **Token Semantic Buffer**: `yylval.nd_obj.name[100]`

### 4.3 Implementation Mechanics in `lexer.l`

```c
/* Buffer-safe token copy macro in compiler/lexer.l */
#define COPY_TOKEN() do { \
    if (yyleng >= sizeof(yylval.nd_obj.name)) { \
        fprintf(stderr, "Lexical Error: token exceeds 99 bytes at line %d\n", countn+1); \
        return 257; \
    } \
    strcpy(yylval.nd_obj.name, yytext); \
} while (0)

#define RETURN_TOKEN(token) do { \
    COPY_TOKEN(); \
    if (show_tokens && !quiet_mode) \
        printf("TOKEN line %d %-12s %s\n", countn+1, #token, yytext); \
    return token; \
} while (0)
```

#### Key Regex Rules
- **Identifiers**: `{alpha}({alpha}|{digit})*` returns `ID`
- **Integer Constants**: `{digit}+` returns `NUMBER`
- **Floating Constants**: `{digit}+\.{digit}{1,6}` returns `FLOAT_NUM`
- **String Literals**: `"([^"\\]|\\.)*"` returns `STR`
- **Single-Line Comments**: `\/\/[^\r\n]*` ignored safely
- **Multi-Line Comments**: `\/\*([^*]|\*+[^*/])*\*+\/` processed by iterating over characters and incrementing `countn` on `\n` to prevent line desynchronization.

### 4.4 Data Passed to Next Phase
Each token returned by `yylex()` produces an integer token code (e.g., `INT`, `ID`, `NUMBER`, `ADD`) defined in `y.tab.h`. The matched textual lexeme is copied into `yylval.nd_obj.name` for consumption by the parser.

---

## 5. Phase 2: Syntax Analysis & AST Generation (Bison LALR(1) Parser)

### 5.1 Responsibility & Theoretical Foundation
Syntax analysis verifies that the token sequence conforms to the formal context-free grammar of the programming language. Our parser builds an **Abstract Syntax Tree (AST)** that represents the hierarchical syntactic structure of the program while discarding redundant lexical punctuation (semicolons, parentheses, commas).

### 5.2 File Path & Grammar Declarations
- **Source Specification**: `compiler/parser_wrapper.y`
- **Generated Files**: `compiler/y.tab.c`, `compiler/y.tab.h`
- **Parsing Technique**: LALR(1) (Look-Ahead Left-to-right, Rightmost derivation with 1 token lookahead)

### 5.3 AST Node Data Structure & Construction

```c
/* Binary AST Node definition in compiler/parser_wrapper.y */
struct node { 
    struct node *left; 
    struct node *right; 
    char *token; 
};

struct node* mknode(struct node *left, struct node *right, const char *token) {	
    struct node *newnode = (struct node *)malloc(sizeof(struct node));
    char *newstr = (char *)malloc(strlen(token) + 1);
    strcpy(newstr, token);
    newnode->left = left;
    newnode->right = right;
    newnode->token = newstr;
    return newnode;
}
```

### 5.4 Grammar Productions Excerpt
```yacc
program: headers global_declarations main_func functions { 
    head = $3.nd; 
    $$.nd = mknode($1.nd, $3.nd, "program"); 
}
;

statement_or_block: '{' body '}' { $$.nd = $2.nd; }
| IF '(' condition ')' statement_or_block else { 
    struct node *iff = mknode($3.nd, $5.nd, "if"); 
    $$.nd = mknode(iff, $6.nd, "if-else"); 
}
| WHILE '(' condition ')' statement_or_block {
    $$.nd = mknode($3.nd, $5.nd, "while");
}
| RETURN expression ';' { 
    $$.nd = mknode(mknode(NULL, NULL, "return"), $2.nd, "RETURN"); 
}
;
```

### 5.5 Tree Output
The AST is traversed via recursive inorder traversal (`print_inorder(struct node *tree)`) and rendered as visual AST pills or textual hierarchy in both the CLI and web inspector.

---

## 6. Phase 3: Semantic Analysis & Symbol Table Management

### 6.1 Responsibility & Theoretical Foundation
While syntax analysis checks *grammatical structure*, semantic analysis ensures the program adheres to *language rules* that cannot be captured by context-free grammars alone: type compatibility, variable declaration before use, uniqueness of identifiers in a scope, and standard library binding.

### 6.2 Data Structure: Static Symbol Table
```c
/* Symbol Table Entry in compiler/parser_wrapper.y */
struct dataType {
    char * id_name;    /* Identifier or literal name */
    char * data_type;  /* "int", "float", "char", "void", "CONST" */
    char * type;       /* "Variable", "Constant", "Function", "Header" */
    int line_no;       /* Source line of declaration */
    char * value;      /* Known compile-time value or "NULL" */
} symbol_table[300];

int count = 0;         /* Current symbol count (max 300) */
```

### 6.3 Semantic Checks Implemented
1. **Undeclared Variable Check (`check_declaration(char *c)`)**: Searches the symbol table for identifier `c`. If missing, reports `Line X: Variable "c" not declared before use!`.
2. **Standard Library Whitelist**: Bypasses undeclared errors for 47 standard C functions (`printf`, `scanf`, `malloc`, `free`, `strlen`, `sqrt`, `exit`, etc.).
3. **Keyword Shadowing Prevention (`add_symbol()`)**: Prevents variables from using 20 reserved words (`int`, `for`, `while`, `main`, etc.).
4. **Duplicate Declaration Check**: Disallows multiple declarations of the same variable within the static symbol table.
5. **Type Compatibility & Implicit Coercion (`check_types(type1, type2)`)**: Evaluates type conversions and creates AST conversion wrapper nodes (`inttofloat`, `floattoint`, `chartoint`, `inttochar`, `chartofloat`, `floattochar`).

---

## 7. Phase 4: Intermediate Code Generation (Three-Address Code)

### 7.1 Responsibility & Theoretical Foundation
Intermediate Representation (IR) bridges the high-level frontend with target-specific machine code. Three-Address Code (TAC) linearizes nested hierarchical expressions into instructions containing at most one operator and three operand addresses: `result = operand1 op operand2`.

### 7.2 Implementation in `compiler/parser_wrapper.y`
- **Instruction Storage**: `char icg[500][512];` (capacity for 500 TAC quadruples)
- **Temporary Variable Counter**: `int temp_var = 0;` generates `t0`, `t1`, `t2`, etc.
- **Jump Label Counter**: `int label = 0;` generates `L0`, `L1`, `L2`, etc.

### 7.3 Emitting Control Flow Quadruples

```c
/* TAC emission routine */
void emit_ir(const char *format, ...) {
    if (ic_idx >= 500) { add_error("IR capacity (500) exceeded!\n"); return; }
    va_list args;
    va_start(args, format);
    vsnprintf(icg[ic_idx++], sizeof(icg[0]), format, args);
    va_end(args);
}

/* While loop translation excerpt */
| WHILE '(' condition ')' statement_or_block {
    emit_ir("JUMP to %s\n", $3.if_body);
    emit_ir("\nLABEL %s:\n", $3.else_body);
}
```

### 7.4 Example TAC Output
For the expression `x = a + b * c;`, the generated TAC is:
```
t0 = b * c
t1 = a + t0
x = t1
```

---

## 8. Phase 5: Code Optimization (Constant Folding & Propagation)

### 8.1 Responsibility & Theoretical Foundation
The optimizer improves execution efficiency without altering program output. In our compiler, optimization is integrated into expression evaluation through **Compile-Time Constant Folding** and **Constant Value Propagation**.

### 8.2 Implementation in `binary_expression()`
When evaluating a binary expression `left op right`:
1. `can_eval(left.name)` and `can_eval(right.name)` check whether both operands are immediate numeric literals or variables whose values are known constants in `symbol_table`.
2. If both evaluate to constants, the compiler performs the arithmetic operation at compile time.
3. If valid, the resulting constant string is stored directly in `result.name`, flagging `folded = 1` and bypassing the creation of a runtime temporary calculation.

```c
/* Constant folding implementation in compiler/parser_wrapper.y */
if (can_eval(left.name) && can_eval(right.name)) {
    double a = get_num_val(left.name), b = get_num_val(right.name), r = 0;
    if ((!strcmp(op, "/") || !strcmp(op, "%")) && b == 0) {
        add_error("Line %d: Constant division or modulo by zero!\n", countn+1);
    } else {
        if (!strcmp(op, "+")) r = a + b;
        else if (!strcmp(op, "-")) r = a - b;
        else if (!strcmp(op, "*")) r = a * b;
        else if (!strcmp(op, "/")) r = a / b;
        /* Integer bitwise folding (&, |, ^, <<, >>) */
        if (integers) snprintf(result.name, sizeof(result.name), "%d", (int)r);
        folded = 1;
    }
}
if (!folded) snprintf(result.name, sizeof(result.name), "t%d", temp_var++);
emit_ir("%s = %s %s %s\n", result.name, left.name, op, right.name);
```

### 8.3 Compile-Time Safety
Division and modulo by zero are caught at compile-time (`add_error("Line %d: Constant division or modulo by zero!\n", countn+1)`), turning potential runtime crashes into clean compiler diagnostics.

---

## 9. Phase 6: Target Code Execution, CLI Driver & Web Integration

### 9.1 Responsibility & System Architecture
Phase 6 coordinates the transition from frontend analysis into runnable native machine code and exposes the compiler through a command-line interface and modern web IDE.

### 9.2 Host Backend Compiler Delegation (`cli/main.c`)
To execute the user's C code natively, `cli/main.c` executes the host toolchain:
```c
const char* find_c_backend() {
    #ifdef _WIN32
    if (system("gcc --version >nul 2>&1") == 0) return "gcc";
    if (system("clang --version >nul 2>&1") == 0) return "clang";
    /* Checks fallback paths in w64devkit, MinGW, msys64 */
    #else
    if (system("gcc --version >/dev/null 2>&1") == 0) return "gcc";
    if (system("clang --version >/dev/null 2>&1") == 0) return "clang";
    #endif
    return NULL;
}
```
When compiled with `--run` (`-r`), the CLI runs the custom compiler frontend to validate all phases, and upon successful validation (0 errors), invokes `run_backend_compiler(backend, target, input)` and `run_binary(target)` directly without shell injection vulnerabilities.

### 9.3 Backend REST Service (`backend/src/services/compilerService.ts`)
- Implemented in Node.js, Express, and TypeScript.
- Accepts `POST /api/compile` with payload `{ sourceCode, runProgram, stdin }`.
- Creates an isolated scratch folder in `/tmp`, writes `input.c`, executes `./ccompiler`, and parses stdout into structured JSON tokens, AST nodes, symbol records, TAC lines, and execution output.

---

## 10. End-to-End Program Trace: Concrete Execution Walkthrough

Consider this source program:
```c
#include <stdio.h>

int main() {
    int x;
    int y;
    x = 5;
    y = 10;
    return 0;
}
```

### Trace Across All 6 Phases:

#### 1. Lexical Analysis Output (`compiler/lexer.l`)
```
TOKEN line 1 INCLUDE      #include<stdio.h>
TOKEN line 3 INT          int
TOKEN line 3 ID           main
TOKEN line 3 CHAR         (
TOKEN line 3 CHAR         )
TOKEN line 3 CHAR         {
TOKEN line 4 INT          int
TOKEN line 4 ID           x
TOKEN line 4 CHAR         ;
TOKEN line 5 INT          int
TOKEN line 5 ID           y
TOKEN line 5 CHAR         ;
TOKEN line 6 ID           x
TOKEN line 6 CHAR         =
TOKEN line 6 NUMBER       5
TOKEN line 6 CHAR         ;
TOKEN line 7 ID           y
TOKEN line 7 CHAR         =
TOKEN line 7 NUMBER       10
TOKEN line 7 CHAR         ;
TOKEN line 8 RETURN       return
TOKEN line 8 NUMBER       0
TOKEN line 8 CHAR         ;
TOKEN line 9 CHAR         }
```

#### 2. Syntax Analysis AST (`compiler/parser_wrapper.y`)
```
Inorder Traversal:
#include<stdio.h>, x, NULL, declaration, y, NULL, declaration, statements, 
x, 5, =, y, 10, =, statements, return, 0, RETURN, statements, main, program
```

#### 3. Symbol Table (`symbol_table[300]`)
```
SYMBOL               DATA TYPE       TYPE            LINE NO    VALUE          
#include<stdio.h>    Header          Header          1          -              
main                 int             Function        3          -              
x                    int             Variable        4          5              
y                    int             Variable        5          10             
5                    CONST           Constant        6          5              
10                   CONST           Constant        7          10             
0                    CONST           Constant        8          0              
```

#### 4. Three-Address Code (TAC) (`icg[500]`)
```
1: x = NULL
2: y = NULL
3: x = 5
4: y = 10
5: RETURN 0
```

#### 5. Optimization Pass
If the user assigns `x = 10 + 20;`, the optimizer in `binary_expression()` detects constants `10` and `20`, computes `30`, and emits `x = 30` directly instead of allocating temporary register `t0 = 10 + 20`.

#### 6. Target Execution Terminal Output
```
$ ./ccompiler --run main.c
Host backend: Host C Compiler (gcc / clang)
[Process exited with code 0 - clean termination]
Duration: 14ms
```

---

## 11. Master Source Code File Reference Table

| File Path | Primary Language | Role & Purpose | Key Functions / Structs | Phase Owned By |
| :--- | :--- | :--- | :--- | :--- |
| `compiler/lexer.l` | Flex / Lex | Lexical token scanner | `yylex()`, `COPY_TOKEN()`, `RETURN_TOKEN()` | **Student 1** |
| `compiler/parser_wrapper.y` | Bison / Yacc / C | Parser, AST, Semantics, TAC, Optimizer | `yyparse()`, `mknode()`, `print_inorder()`, `symbol_table`, `binary_expression()`, `emit_ir()` | **Students 2, 3, 4, 5** |
| `cli/main.c` | C99 | CLI binary driver & host GCC orchestrator | `main()`, `analyze_file()`, `find_c_backend()`, `run_process()` | **Student 6** |
| `backend/src/services/compilerService.ts` | TypeScript | REST compilation service & parser | `compile()`, `parseTokens()`, `parseAnalysisOutput()` | **Student 6** |
| `frontend/src/components/EditorPanel.tsx` | React / TypeScript | Monaco code editor & CTA buttons | `EditorPanel`, `handleCompile()` | **Student 6** |
| `frontend/src/components/ResultsPanel.tsx` | React / TypeScript | Phase results tabs & terminal | `ResultsPanel`, bento metrics, TAC table | **Student 6** |

---

## 12. Web Application Architecture & Execution Flow

1. **User Interaction**: The user enters C source code into the Monaco editor at `http://localhost:3005`.
2. **REST Dispatch**: Clicking **Analyze Phases** sends a POST request to `http://localhost:5005/api/compile` with `{ sourceCode: "..." }`.
3. **Sandbox Isolation**: The backend controller validates payload size (< 64KB) and writes the source to a randomized directory in `/tmp`.
4. **Binary Invocation**: The backend spawns `./ccompiler --tokens input.c` and `./ccompiler input.c`.
5. **Output Extraction**: The backend parser reads stdout streams and constructs typed JSON objects.
6. **Live Visualization**: The frontend receives the JSON response and updates the horizontal Phase Pipeline ribbon, symbol tables, AST pills, and TAC quadruples.
7. **Optional Binary Execution**: When **Run Binary** is clicked (`runProgram: true`), `./ccompiler -r input.c` compiles via GCC/Clang, passes standard input, and streams stdout into the terminal console.

---

## 13. Live Academic Demonstration Plan

| Time | Action | Screen / Visual State | Presenter |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:30** | Project introduction & pipeline overview | C Compiler Studio Home View | Student 1 |
| **0:30 - 1:15** | Load `Basic Variables & Assignment`, run **Analyze Phases** | Tokens Tab (Tokens stream) | Student 1 & 2 |
| **1:15 - 2:00** | Inspect Parse Tree and Symbol Table | AST Visual Nodes & Symbol Table Tab | Student 2 & 3 |
| **2:00 - 2:45** | Load `Diagnostic Error: Undeclared Variable`, run compiler | Diagnostics Tab showing syntax/semantic error | Student 3 |
| **2:45 - 3:30** | Load `Arithmetic & Constant Folding`, inspect TAC | 3-Address Code & Optimizer Tab | Student 4 & 5 |
| **3:30 - 4:15** | Click **Run Binary**, view live program stdout | Developer Terminal Console (`./a.out`) | Student 6 |
| **4:15 - 5:00** | Q&A from Viva Examiners | Architecture & Limits Modal (`Specifications`) | All Students |

---

## 14. Compiler Limitations & Future Engineering Roadmap

- **Scope Table**: Currently implemented with a flat 300-slot symbol table where inner-block shadowing is rejected. *Future work: Implement a linked-list cactus stack for scoped symbol tables.*
- **Target Architecture**: Currently delegates native machine code generation to GCC/Clang. *Future work: Implement a direct x86-64 assembly emitter from Three-Address Code quadruples.*
- **Optimization Passes**: Currently features compile-time constant folding. *Future work: Implement Dead Code Elimination and Common Subexpression Elimination (CSE) over TAC basic blocks.*
