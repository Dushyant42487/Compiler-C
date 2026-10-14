# Compiler Design ISE — Presentation Script & Slide Outline

This document provides a slide-by-slide presentation deck outline and verbatim speaking notes designed for a 7–10 minute Compiler Design In-Semester Evaluation (ISE) project review.

---

## Slide 1: Title & Project Overview

### Visual Content / Slide Bullets
- **Project Title**: Design and Implementation of an Educational C Compiler Frontend and Toolchain
- **Course**: Compiler Design (ISE Project Evaluation)
- **Implemented Phases**:
  - Lexical Analysis (Scanner) using Flex
  - Syntax Analysis (Parser & AST) using Bison
  - Semantic Validation & Diagnostic System
  - Flat Symbol Table with Type & Value Tracking
  - Three-Address Code (TAC) Intermediate Code Generation
  - Compile-Time Constant Folding Optimizer
  - Standalone Offline HTML Compiler Explorer
- **Host Execution Support**: Automated compilation and runtime verification via host C backend (`gcc`/`clang`).

### Code / Artifacts to Highlight
- Repository root: `Makefile`, `compiler/lexer.l`, `compiler/parser_wrapper.y`, `cli/main.c`.

### Speaker Script (45 seconds)
> "Good morning, respected professors and evaluators. Today, we present our Compiler Design project: a lightweight, robust C compiler frontend and execution toolchain built in C using Flex and Bison.
>
> In this project, we designed and implemented the complete classical frontend pipeline: tokenization, syntax tree construction, semantic validation, symbol table management, intermediate three-address code generation, and compile-time constant optimization.
>
> In addition to standard compiler phases, our tool features an interactive CLI driver, automated execution using the host compiler, and an offline HTML Compiler Explorer that visually demonstrates the internal state of each compiler phase."

---

## Slide 2: Problem Statement & Language Subset

### Visual Content / Slide Bullets
- **Objective**: Construct a fully transparent, modular C compiler frontend capable of analyzing and transforming imperative C programs.
- **Accepted Source Language Subset**:
  - **Data Types**: `int`, `float`, `char`, `double`, `void`, `long`, `short`, signed/unsigned, pointers (`int*`), 1D and 2D arrays.
  - **Control Flow**: `if-else`, `switch-case`, `while`, `do-while`, `for`, `break`, `continue`, `return`.
  - **Expressions**: Complete arithmetic (`+`, `-`, `*`, `/`, `%`), relational, logical, bitwise (`&`, `|`, `^`, `~`, `<<`, `>>`), compound assignments (`+=`, `-=`, etc.), and ternary operator (`?:`).
  - **Built-in Functions**: Whitelist of 47 standard C library functions (`printf`, `scanf`, `malloc`, `free`, `exit`, etc.).
  - **Preprocessor**: `#include` statements recognized into the symbol table; `#define` skipped.

### Speaker Script (45 seconds)
> "Writing a compiler for the full ISO C standard is massive, so for academic rigor and clarity, we scoped our compiler to a practical, feature-rich imperative subset of C.
>
> Our compiler parses primitive and modified numeric types, single-level pointers, and multidimensional arrays. It supports all standard C control structures—including nested if-else statements, switch statements, and for, while, and do-while loops.
>
> Expressions support the full spectrum of C operators with standard operator precedence. Furthermore, to make sample programs fully runnable, our frontend recognizes standard library headers and pre-declares common functions like `printf` and `scanf` so students can write meaningful test programs."

---

## Slide 3: Compiler Architecture & Data Flow

### Visual Content / Slide Bullets
- **High-Level Compilation Pipeline**:
  1. `Source (.c)` -> **Flex Lexer (`lexer.l`)** -> Token Stream (`yylval`)
  2. Token Stream -> **Bison Parser (`parser_wrapper.y`)** -> Binary AST (`struct node`)
  3. Reduction Actions -> **Semantic Checker** -> Diagnostic Array (`errors[100][100]`)
  4. Reduction Actions -> **Symbol Table** -> Identifiers, Types, Estimated Values (`symbol_table[300]`)
  5. Constant Expressions -> **Optimizer** -> Compile-time constant folding (`can_eval()`)
  6. Expression / Flow -> **IR Generator** -> Linear Three-Address Code (`icg[500]`)
  7. Optional Execution (`-r`): Host `gcc`/`clang` compiles native binary for execution.

### Diagram to Display
*(Display the Mermaid architecture diagram from `project_overview.md`)*

### Speaker Script (50 seconds)
> "Here is our complete system architecture. Data flows linearly from the source file through our frontend stages.
>
> First, the source file is fed through `lexer.l`, which scans characters and returns token IDs to Bison while packing token names into semantic values.
>
> As Bison performs bottom-up LALR parsing, our grammar productions build a binary Abstract Syntax Tree in memory. Simultaneously, semantic actions perform static checks, populate our Symbol Table, execute compile-time constant folding, and emit Three-Address Code into an instruction buffer.
>
> Finally, our CLI driver can print each phase’s output to the console, export an offline HTML report, or invoke the host compiler to build and execute the binary directly."

---

## Slide 4: Phase 1 — Lexical Analysis (Scanner)

### Visual Content / Slide Bullets
- **Implementation Tool**: Flex (`compiler/lexer.l`)
- **Key Features**:
  - Regular expressions for 26 keywords, identifiers, constants (integers, floats, characters, strings), and operators.
  - Accurate line numbering tracked via variable `countn` and `%option yylineno`.
  - Robust comment filtering: single-line `//` skipped; multiline `/* ... */` scanned for embedded newlines.
  - Guard against buffer overflow: `COPY_TOKEN()` macro rejects tokens exceeding 99 bytes (`sizeof(yylval.nd_obj.name)`).
  - Dedicated CLI Flag: `--tokens` displays line-by-line token category and lexeme.

### Code Snippet to Show (`compiler/lexer.l:10-16`)
```c
#define COPY_TOKEN() do { if (yyleng >= sizeof(yylval.nd_obj.name)) { \
    fprintf(stderr, "Lexical Error: token exceeds 99 bytes at line %d\n", countn+1); \
    return 257; \
} strcpy(yylval.nd_obj.name, yytext); } while (0)
#define RETURN_TOKEN(token) do { COPY_TOKEN(); \
    if (show_tokens && !quiet_mode) printf("TOKEN line %d %-12s %s\n", countn+1, #token, yytext); \
    return token; } while (0)
```

### Speaker Script (50 seconds)
> "Let us look at Phase 1: Lexical Analysis in `lexer.l`. Flex converts raw source characters into discrete tokens using deterministic finite automata.
>
> We defined over thirty regular expressions. Notice lines 10 through 16: to prevent buffer overflow vulnerabilities, we created the `COPY_TOKEN()` macro. Every token lexeme is safely copied into a 100-byte buffer; if an identifier exceeds 99 characters, the scanner immediately reports a Lexical Error and halts.
>
> Multi-line comments are handled cleanly by counting internal newline characters so line reporting in subsequent compiler phases remains perfectly synchronized. Using our `--tokens` flag, an evaluator can inspect every emitted token in real time."

---

## Slide 5: Phase 2 — Syntax Analysis (Parser & AST)

### Visual Content / Slide Bullets
- **Implementation Tool**: Bison / Yacc (`compiler/parser_wrapper.y`)
- **Parsing Technique**: LALR(1) Bottom-Up Shift-Reduce Parsing.
- **Disambiguation & Precedence**:
  - Explicit `%left` and `%right` precedence declarations resolve operator ambiguities without bloating grammar rules.
  - Resolves standard dangling-else ambiguity in favor of shift (matching closest `if`).
- **AST Generation**:
  - Binary tree representation: `struct node { struct node *left, *right; char *token; };`.
  - Built dynamically via `mknode()` during grammar reductions.
  - Traversed and displayed via `print_inorder()`.

### Code Snippet to Show (`compiler/parser_wrapper.y:14-18, 993-1001`)
```c
struct node { 
    struct node *left; 
    struct node *right; 
    char *token; 
};

struct node* mknode(struct node *left, struct node *right, const char *token) {	
    struct node *newnode = (struct node *)malloc(sizeof(struct node));
    newnode->left = left;
    newnode->right = right;
    newnode->token = strdup(token);
    return newnode;
}
```

### Speaker Script (55 seconds)
> "Phase 2 is Syntax Analysis, implemented in `parser_wrapper.y`. We use Bison to generate an LALR(1) parser.
>
> To avoid grammar explosion, we declared formal precedence and associativity levels for all twenty-plus operators at the top of the grammar file, ensuring mathematical precedence like multiplication over addition is strictly respected.
>
> As grammar rules reduce, we build an Abstract Syntax Tree using `mknode()`. Each node contains left and right pointers and a label. For example, when parsing `x = 5 + 3`, the expression reduces to an operator node `+` with operands `5` and `3`, which becomes the right child of an assignment node `=`.
>
> Our compiler displays this tree in the terminal using an inorder traversal and visually inside our HTML explorer."

---

## Slide 6: Phase 3 & Supporting Component — Semantics & Symbol Table

### Visual Content / Slide Bullets
- **Symbol Table Structure**:
  - Global array `struct dataType symbol_table[300]`.
  - Tracks symbol name, data type, category (`Variable`, `Constant`, `Header`, `Function`), declaration line, and evaluated value.
  - Linear reverse search (`search()`) for fast lookup of recently declared symbols.
- **Static Semantic Validations**:
  1. **Undeclared Variables**: Checked via `check_declaration()` against `symbol_table` with a 47-function stdlib whitelist.
  2. **Duplicate Declarations**: Detected in `add_symbol('V')` when `search()` succeeds on a new variable.
  3. **Keyword Shadowing**: Prevents declaring variables named after 20 reserved keywords (`int`, `while`, `return`).
  4. **Type Compatibility & Coercion**: `check_types()` injects explicit conversion nodes (`inttofloat`, `chartoint`) into the AST.
  5. **Compile-time Division-by-Zero**: Caught in constant arithmetic reductions.

### Code Snippet to Show (`compiler/parser_wrapper.y:856-874`)
```c
void check_declaration(char *c) {
    const char *stdlib_funcs[] = { "printf", "scanf", "strlen", "malloc", "free", "exit", ... };
    for(size_t i=0; i<sizeof(stdlib_funcs)/sizeof(stdlib_funcs[0]); i++) {
        if(strcmp(c, stdlib_funcs[i]) == 0) return;
    }
    if(!search(c)) {
        add_error("Line %d: Variable \"%s\" not declared before use!\n", countn+1, c);
    }
}
```

### Speaker Script (60 seconds)
> "Moving to Phase 3: Semantic Analysis and Symbol Table Management.
>
> Our Symbol Table stores up to 300 entries, recording not only the identifier name and data type, but also whether it is a Variable, Constant, Function, or Header, along with its declaration line and estimated value.
>
> During parsing, semantic checks run continuously. If an identifier is used in an expression, `check_declaration()` verifies that it exists in the symbol table, while automatically whitelisting 47 standard C library functions like `printf` and `malloc`.
>
> If a student declares a variable twice, or attempts to name a variable after a keyword like `int`, or attempts constant division by zero, our `add_error()` function logs the error with its exact line number without crashing the parser, allowing complete diagnostic reporting."

---

## Slide 7: Phase 4 & 5 — IR Generation & Constant Optimization

### Visual Content / Slide Bullets
- **Intermediate Representation (IR)**:
  - Format: Three-Address Code (TAC), stored in `char icg[500][512]`.
  - Instruction set: Direct assignments, array index assignments, pointer dereferences, function calls, and relational branches.
  - Temporary synthesis: Sequential temporaries (`t0`, `t1`, `t2`, ...) and branch labels (`L0`, `L1`, ...).
- **Compile-Time Constant Optimization**:
  - Implemented inside `binary_expression()` and unary operators.
  - Functions `can_eval()` and `get_num_val()` identify constant operands.
  - Folds arithmetic (`+`, `-`, `*`, `/`, `%`), bitwise (`&`, `|`, `^`, `<<`, `>>`), and unary operators directly at compile time, eliminating unnecessary runtime calculation.

### Sample IR Translation Comparison
```c
// Source Code
int a = 10;
int b = 20;
int sum = a + b;
```
```text
// Generated 3-Address Code
a = 10
b = 20
sum = NULL
30 = a + b
sum = 30
```

### Speaker Script (55 seconds)
> "In Phase 4, our compiler synthesizes Intermediate Representation in the form of Three-Address Code.
>
> Three-Address Code linearizes complex nested syntax trees into atomic operations with at most three addresses per instruction. Conditional statements like `if` and `while` are translated into relational condition checks and unconditional `GOTO` jumps to synthetic labels like `L0` and `L1`.
>
> Furthermore, in Phase 5, we implemented an active compile-time optimizer! When `binary_expression()` detects that both operands are known constants, it evaluates the mathematical or bitwise operation at compile time.
>
> As shown on the slide, `a + b` with known values 10 and 20 is folded directly into `30`, demonstrating real constant folding and propagation within our frontend."

---

## Slide 8: Execution Driver, Explorer & Error Diagnostics

### Visual Content / Slide Bullets
- **Target Execution Model (`-r` / `--run`)**:
  - The frontend validates semantics and produces TAC.
  - For native program execution, `cli/main.c` orchestrates host backend compilation via `gcc` or `clang` into `a.out`/`a.exe`.
  - Executes the generated binary and displays program runtime output and return code.
- **Offline HTML Compiler Explorer (`--explore`)**:
  - Implemented in `cli/explorer.h`: generates a zero-dependency HTML report.
  - Features: Source viewer, live searchable Symbol Detective, foldable syntax tree, and interactive IR Microscope with Next/Previous step buttons.
- **Interactive CLI Console Mode**:
  - Running `./ccompiler` with no arguments opens a numbered menu for interactive file analysis.

### Speaker Script (50 seconds)
> "For target execution and error diagnostics, we built a comprehensive CLI driver in `main.c`.
>
> If a developer passes `-r`, our compiler analyzes the frontend. If zero errors occur, it calls the host C compiler to produce an executable, runs it, and prints its runtime console output and exit code.
>
> For pedagogical demonstration, we built the Compiler Explorer via the `--explore` flag. This outputs a self-contained HTML file featuring an interactive 'IR Microscope' where students can step forward and backward through emitted three-address code instructions while inspecting live symbol values.
>
> If any syntax or semantic error occurs, the compiler halts target compilation and clearly prints line numbers and diagnostic explanations."

---

## Slide 9: Live Demonstration

### Visual Content / Slide Bullets
- **Demo 1: Comprehensive Frontend Analysis**
  ```bash
  ./ccompiler examples/arithmetic.c
  ```
  *(Displays Symbol Table, AST traversal, Semantic check passing, and TAC IR)*
- **Demo 2: Instant Compile and Execution**
  ```bash
  ./ccompiler -r examples/simple.c
  ```
  *(Runs frontend, builds binary, prints exit code 0)*
- **Demo 3: Semantic Error Detection**
  ```bash
  ./ccompiler examples/error_undeclared.c
  ```
  *(Catches undeclared variable `y` at line 9)*
- **Demo 4: Offline HTML Explorer**
  ```bash
  ./ccompiler --explore -o report.html examples/arithmetic.c
  ```
  *(Opens interactive HTML report in browser)*

### Speaker Script (60 seconds)
> "Now, we would like to present a live demonstration of our compiler in action.
>
> First, we run `./ccompiler examples/arithmetic.c`. Instantly, we see Phase 1's Symbol Table showing variable types, line numbers, and values. Next is the Inorder AST traversal, followed by the semantic report confirming zero errors, and the emitted Three-Address Code with folded constants.
>
> Next, we demonstrate error handling using `examples/error_undeclared.c`. Notice how the compiler detects that variable `y` was used on line 9 before declaration, reporting a semantic error and returning exit code 1.
>
> Finally, we generate an interactive HTML report using `--explore`. In the browser, we can search the symbol table and step through each three-address instruction one by one."

---

## Slide 10: Limitations & Future Scope

### Visual Content / Slide Bullets
- **Current Limitations (Honest Evaluation)**:
  - **Flat Symbol Table**: Lacks nested block scopes; local variables in separate inner blocks share a global table.
  - **Grammar Conflicts**: 23 shift/reduce and 13 reduce/reduce conflicts in Bison due to dangling-else and type specifiers.
  - **Fixed Buffer Capacities**: Static maximums (300 symbols, 500 IR entries, 100 diagnostics).
  - **External Target Generation**: Machine code is compiled via host backend rather than an internal assembler.
- **Future Enhancements**:
  - Implementing a hierarchical scoped symbol table (linked list of hash tables).
  - Constructing a formal Control Flow Graph (CFG) with basic blocks for dead-code elimination.
  - Native x86-64 / ARM64 assembly code generator with graph-coloring register allocation.

### Speaker Script (45 seconds)
> "To conclude with an honest technical assessment:
>
> Our current frontend uses a flat symbol table rather than a scoped stack, meaning variables declared in separate nested blocks cannot share names. Furthermore, our Bison grammar has 23 shift/reduce conflicts which resolve in favor of shift, and target code generation is delegated to GCC or Clang.
>
> As future scope, we plan to refactor the symbol table into a scoped hash map, build a formal Control Flow Graph to perform dead-code elimination and loop-invariant code motion, and implement a native x86-64 backend code generator.
>
> Thank you, and we are now ready to answer your questions during the viva."
