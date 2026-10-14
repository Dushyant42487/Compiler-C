# Compiler Design ISE — Comprehensive Viva Questions & Model Answers

This document contains 35+ targeted viva questions and answers categorized by compiler theory, architectural design decisions, and deep codebase-specific inquiries based on `lexer.l`, `parser_wrapper.y`, and `cli/main.c`.

---

## Category 1: Fundamental Compiler Theory

### Q1: What is a compiler, and how does it fundamentally differ from an interpreter?
**Answer**:
A compiler translates an entire source program written in a high-level language into machine code or an intermediate representation all at once before execution. Once compiled, the target program executes natively and rapidly without needing the original source or the compiler.
An interpreter, in contrast, reads, analyzes, and executes source code line-by-line or statement-by-statement at runtime without producing a standalone executable.
In our project, `ccompiler` acts as a compiler frontend: it parses the full C program, verifies grammar and semantics, translates it to Three-Address Code, and allows the host backend compiler to generate a standalone executable (`a.out`/`a.exe`).

### Q2: What are the classical phases of a compiler, and which ones are implemented in our project?
**Answer**:
The classical phases are:
1. Lexical Analysis (Scanner) — **Implemented** in `compiler/lexer.l`.
2. Syntax Analysis (Parser) — **Implemented** in `compiler/parser_wrapper.y`.
3. Semantic Analysis — **Implemented** in `compiler/parser_wrapper.y`.
4. Intermediate Code Generation (IR) — **Implemented** in `compiler/parser_wrapper.y` (Three-Address Code).
5. Code Optimization — **Partially implemented** in `compiler/parser_wrapper.y` (Constant folding & propagation).
6. Target Code Generation — **Orchestrated via host delegation** in `cli/main.c` (invokes `gcc`/`clang`).
Two supporting systems are also implemented:
- Symbol Table Management — `struct dataType symbol_table[300]`.
- Error Handling & Diagnostics — `yyerror()`, `add_error()`, `errors[100][100]`.

### Q3: What is the difference between a Parse Tree (Concrete Syntax Tree) and an Abstract Syntax Tree (AST)?
**Answer**:
- A **Parse Tree (CST)** is a complete, pictorial representation of the formal grammar derivation. It includes all terminals and nonterminals, including punctuation like semicolons, parentheses, and commas that carry no semantic value during code generation.
- An **Abstract Syntax Tree (AST)** is a condensed, semantic representation where interior nodes represent operators/actions (e.g., `+`, `=`, `if`) and children represent operands. Punctuation and non-essential grammatical wrapper symbols are discarded.
In our codebase (`compiler/parser_wrapper.y:14-18`), `struct node` constructs an AST using `mknode()`. For `x = 5 + 3`, it constructs an assignment node with left child `x` and right child `+`, discarding semicolons.

### Q4: What is the difference between a Syntax Error and a Semantic Error? Give examples from our project.
**Answer**:
- A **Syntax Error** occurs when the token sequence violates the Context-Free Grammar rules of the language. For example, `int x = 10` without a semicolon violates the statement production. It is caught by Bison in `yyerror()` at `parser_wrapper.y:1026`.
- A **Semantic Error** occurs when the syntax is grammatically valid, but the program violates type, scope, or logical constraints of the language. For example, `y = x + 5;` where `y` was never declared is syntactically a valid assignment, but semantically invalid. It is caught by `check_declaration()` at `parser_wrapper.y:872`.

### Q5: What is the difference between Intermediate Code Generation (IR) and Target Code Generation?
**Answer**:
- **IR Generation** transforms the AST into a machine-independent, linear representation (such as Three-Address Code or Quadruples) that is easy to optimize and decoupled from any specific CPU architecture.
- **Target Code Generation** maps the IR into concrete target assembly language or machine instructions (such as x86-64, ARM, or MIPS) taking into account CPU registers, stack frame layouts, memory alignment, and instruction set architectures.
In our project, Phase 4 generates machine-independent Three-Address Code in `compiler/parser_wrapper.y`. We do not have a custom x86 assembler; native binary generation is delegated to `gcc`/`clang`.

---

## Category 2: Lexical Analysis (`compiler/lexer.l`)

### Q6: How does Flex work under the hood?
**Answer**:
Flex takes regular expression patterns specified in `lexer.l`, constructs non-deterministic finite automata (NFAs) using Thompson's construction, and converts them into a deterministic finite automaton (DFA) using subset construction. At runtime, the DFA reads characters from `yyin` and transitions between states to match the longest possible prefix (maximal munch rule). When a final state is reached, it executes the corresponding C action block.

### Q7: How does our scanner handle comments and prevent line number desynchronization?
**Answer**:
In `compiler/lexer.l:83-88`:
- Single-line comments are ignored via rule: `\/\/[^\r\n]* { ; }`.
- Multi-line comments use:
  ```c
  \/\*([^*]|\*+[^*/])*\*+\/ { 
      for(int i = 0; yytext[i]; i++) {
          if(yytext[i] == '\n') countn++;
      }
  }
  ```
  Instead of discarding the comment as an opaque block, it loops through `yytext` counting `\n` characters to update `countn`. This ensures error reporting in subsequent phases accurately reflects the true source line number.

### Q8: What does `yywrap()` do, and why does our implementation return 1?
**Answer**:
`yywrap()` is called by Flex when it encounters end-of-file (`EOF`) on `yyin`.
If `yywrap()` returns `0`, it tells the scanner that another input stream has been set up and scanning should continue.
If it returns `1`, it signals that no further input files exist and lexical analysis is complete.
Our implementation in `compiler/lexer.l:97-99` returns `1` because our compiler processes one source file per invocation.

### Q9: What is the purpose of the `COPY_TOKEN()` macro in `lexer.l`?
**Answer**:
`COPY_TOKEN()` (line 10) prevents buffer overflow vulnerabilities:
```c
#define COPY_TOKEN() do { if (yyleng >= sizeof(yylval.nd_obj.name)) { \
    fprintf(stderr, "Lexical Error: token exceeds 99 bytes at line %d\n", countn+1); \
    return 257; \
} strcpy(yylval.nd_obj.name, yytext); } while (0)
```
The semantic value structure `yylval.nd_obj.name` is a fixed 100-byte character array. If a malicious or malformed identifier exceeds 99 bytes, the macro prints an error and returns token 257 to abort parsing safely.

### Q10: How are invalid or unrecognized characters handled by the scanner?
**Answer**:
At line 93 of `lexer.l`, there is a fallback rule:
```c
. { if (show_tokens && !quiet_mode) printf("TOKEN line %d CHAR %s\n", countn+1, yytext); return *yytext; }
```
Any single character not matched by earlier rules is returned directly as its ASCII integer value. If that character does not form a valid token in the Bison grammar, Bison immediately triggers a syntax error.

---

## Category 3: Syntax Analysis (`compiler/parser_wrapper.y`)

### Q11: What parsing algorithm does Bison use, and what is LALR(1)?
**Answer**:
Bison generates an **LALR(1)** (Look-Ahead Left-to-Right Rightmost derivation with 1 token lookahead) bottom-up parser.
LALR(1) merges states in an LR(1) parser that share identical sets of LR(0) items (the same cores), which drastically reduces the size of the parse table while retaining the lookahead token capability needed to resolve shift-reduce choices.

### Q12: Why does our Bison grammar report 23 shift/reduce and 13 reduce/reduce conflicts?
**Answer**:
As documented in `tests/VALIDATION.md:33`:
1. **Shift/Reduce conflicts**: Primarily stem from the classical "dangling-else" ambiguity where an optional `else` can bind to an inner or outer `if`, as well as ambiguous pointer dereference vs multiplication rules. Bison defaults to shifting, which resolves dangling-else correctly according to the ANSI C standard.
2. **Reduce/Reduce conflicts**: Arise from overlapping type specifiers (e.g., combinations of `long`, `int`, `unsigned`, and pointer syntax in `type_specifier`).
These conflicts do not prevent successful compilation because Bison's default shift preference resolves the ambiguity as intended for our supported subset.

### Q13: How does our parser resolve operator precedence and associativity?
**Answer**:
In `compiler/parser_wrapper.y:97-110`, we declare explicit precedence directives:
- `%left` for left-associative operators (`ADD`, `SUBTRACT`, `MULTIPLY`, `DIVIDE`, etc.).
- `%right` for right-associative operators (`=`, `+=`, `-=`, ternary `?:`, `NOT`, unary).
Bison uses the declaration order (lowest to highest) to resolve shift-reduce conflicts when parsing expressions, ensuring `a + b * c` shifts `*` rather than reducing `a + b`.

### Q14: How are Abstract Syntax Tree (AST) nodes created and represented in memory?
**Answer**:
In `parser_wrapper.y:14-18`, an AST node is defined as:
```c
struct node { 
    struct node *left; 
    struct node *right; 
    char *token; 
};
```
The helper function `mknode(left, right, token)` dynamically allocates a node using `malloc()` and duplicates the string label using `strdup()`. Binary operations store the left and right operands in `left` and `right`. Non-binary structures chain multiple statements using composite `"statements"` branch nodes.

### Q15: How does the parser traverse and print the AST?
**Answer**:
In `parser_wrapper.y:1003-1020`, `print_tree(head)` calls `print_inorder(tree)`:
```c
void print_inorder(struct node *tree) {
    if (!tree) return;
    if (tree->left) print_inorder(tree->left);
    printf("%s", tree->token);
    if(tree->left || tree->right) printf(", ");
    if (tree->right) print_inorder(tree->right);
}
```
It visits the left subtree, prints the current node token, and visits the right subtree, outputting a comma-separated inorder sequence.

---

## Category 4: Semantic Analysis & Symbol Table

### Q16: What data structure is used for the Symbol Table, and what are its trade-offs?
**Answer**:
In `compiler/parser_wrapper.y:52-58`:
```c
struct dataType {
    char * id_name;
    char * data_type;
    char * type;       // "Variable", "Constant", "Header", "Function"
    int line_no;
    char * value;
} symbol_table[300];
```
- **Trade-off**:
  - *Pros*: Extremely simple to implement, debug, reset, and traverse sequentially for reporting.
  - *Cons*: O(N) linear search time instead of O(1) hash map lookup; static capacity fixed at 300 entries; flat global namespace without support for nested lexical block scopes.

### Q17: Why does `search(char *type)` scan backwards from `count-1` down to 0?
**Answer**:
In `parser_wrapper.y:845-854`:
```c
int search(char *type) {
    for(int i=count-1; i>=0; i--) {
        if(strcmp(symbol_table[i].id_name, type)==0) return -1;
    }
    return 0;
}
```
Scanning in reverse order ensures that the most recently inserted identifier is found first. This is a common idiom in symbol tables to support shadowing and fast lookup of local symbols.

### Q18: How does `check_declaration()` distinguish between undeclared user variables and standard C library functions?
**Answer**:
In `parser_wrapper.y:856-874`, `check_declaration()` maintains an explicit string whitelist of 47 standard C library functions (`printf`, `scanf`, `strlen`, `strcpy`, `malloc`, `free`, `exit`, `sqrt`, `rand`, `sin`, etc.).
When an identifier is checked, it first loops through this whitelist. If matched, it returns immediately without error. Otherwise, it calls `search(c)` against `symbol_table`. If not found, it reports an undeclared variable semantic error.

### Q19: How are implicit type conversions handled during semantic analysis?
**Answer**:
In `compiler/parser_wrapper.y:891-917`, `check_types(type1, type2)` evaluates operand type compatibility and returns numeric codes:
- `1`: int assigned float (truncation) -> AST node `"floattoint"`
- `2`: float assigned int (promotion) -> AST node `"inttofloat"`
- `3` & `4`: int and char conversions -> AST nodes `"chartoint"`, `"inttochar"`
- `5` & `6`: float and char conversions -> AST nodes `"chartofloat"`, `"floattochar"`
In `declarator` and `binary_expression()`, an explicit conversion node is inserted into the AST, ensuring downstream code generation is aware of type conversions.

### Q20: What happens if a program contains duplicate declarations?
**Answer**:
In `parser_wrapper.y:988-990`, inside `add_symbol()`:
When inserting a variable (`c == 'V'`), it checks `q = search(name)`. If `q` is non-zero (meaning the identifier already exists), it invokes:
```c
add_error("Line %d: Multiple declarations of \"%s\" not allowed!\n", countn+1, name);
```
It does not abort parsing immediately, allowing the compiler to report all semantic errors in one pass before returning exit code 1.

---

## Category 5: Intermediate Code Generation & Optimization

### Q21: What format of Intermediate Representation does our compiler generate?
**Answer**:
Our compiler generates **Three-Address Code (TAC)**. Each instruction has at most one operator and at most three operand addresses (e.g., `t0 = a + b`).
The instructions are stored as null-terminated strings in a global array `char icg[500][512]` with instruction count `ic_idx`.

### Q22: How are temporary variables and jump labels managed?
**Answer**:
In `compiler/parser_wrapper.y:67-68`:
- Global integer `temp_var` acts as a monotonic counter. When an intermediate computation occurs, it formats the temporary as `t0`, `t1`, `t2`, etc. via `sprintf(..., "t%d", temp_var++)`.
- Global integer `label` acts as a monotonic label counter. Control flow constructs allocate labels `L0`, `L1`, etc. via `sprintf(..., "L%d", label++)`.

### Q23: How are `if-else` statements translated into Three-Address Code?
**Answer**:
In `compiler/parser_wrapper.y:209-213`:
1. The condition `expression relop expression` generates a conditional jump:
   `if (a < b) GOTO L0 else GOTO L1`
2. It assigns `$$.if_body = "L0"` and `$$.else_body = "L1"`.
3. Before the `then` block, it emits `LABEL L0:`.
4. Before the `else` block, it emits `LABEL L1:`.
5. After the `if-else` construct, it emits `GOTO next`.

### Q24: What compile-time optimizations did we implement, and where are they in the code?
**Answer**:
We implemented **Constant Folding** and **Constant Propagation** in `compiler/parser_wrapper.y:682-755` inside `binary_expression()`:
1. `can_eval(name)` checks if both operands are numeric literals or known constant identifiers in the symbol table.
2. If true, `get_num_val()` extracts values, and the compiler performs the operation directly at compile time (addition, subtraction, multiplication, integer division, modulus, bitwise AND/OR/XOR, left/right shifts).
3. If the result is valid and within 32-bit limits, it writes the calculated number string directly into `result.name` instead of generating a temporary variable.
4. Constant folding is also applied to unary negation (`-`), logical NOT (`!`), bitwise NOT (`~`), explicit casts, and ternary expressions.

### Q25: Codebase Trap Question: In `binary_expression()`, why does the compiler sometimes emit `30 = a + b` in the IR?
**Answer**:
In `compiler/parser_wrapper.y:746-753`:
```c
if (integers) snprintf(result.name, sizeof(result.name), "%d", (int)r);
folded = 1;
...
if (!folded) snprintf(result.name, sizeof(result.name), "t%d", temp_var++);
emit_ir( "%s = %s %s %s\n", result.name, left.name, op, right.name);
```
When constant folding succeeds, `result.name` is assigned the pre-computed value (e.g., `"30"`). Because line 753 unconditionally calls `emit_ir("%s = %s %s %s\n", result.name, left.name, op, right.name)`, it emits the folded result on the left-hand side of the TAC string.
While this is an educational quirk of the IR printer, the downstream assignment `sum = 30` correctly propagates the folded constant value.

---

## Category 6: Target Code Generation, Execution & Toolchain

### Q26: Does our compiler generate assembly or machine code directly?
**Answer**:
No. As documented in `START_HERE.md` and `cli/main.c`, `ccompiler` is an educational C compiler frontend. It carries out Phases 1 through 4 (Scanner, Parser, Semantics, IR).
For native binary execution (`-b` or `-r`), `cli/main.c` orchestrates target generation by finding and invoking the host system's C compiler (`gcc` or `clang`).

### Q27: How does `cli/main.c` discover the host backend compiler?
**Answer**:
In `cli/main.c:175-195`, `find_c_backend()`:
1. First executes `gcc --version` and `clang --version` via system calls.
2. On Windows, it additionally searches common development installation paths (`w64devkit\bin\gcc.exe`, `C:\msys64\ucrt64\bin\gcc.exe`, `C:\MinGW\bin\gcc.exe`).
3. If found, it returns the executable path; if absent, it returns `NULL` and warns the user that backend compilation requires GCC/Clang.

### Q28: How does `run_process()` execute backend commands safely without command shell injection?
**Answer**:
In `cli/main.c:116-157`:
- On Unix/macOS, it uses `fork()` and `execvp()`, passing arguments directly as an array of pointers without invoking `/bin/sh`. This prevents shell injection vulnerabilities.
- On Windows, it safely escapes and quotes each argument before invoking `_spawnvp()`.

### Q29: What is the Compiler Explorer (`--explore`), and how was it implemented?
**Answer**:
Implemented in `cli/explorer.h`, the Compiler Explorer is an offline, zero-dependency HTML diagnostic tool generated when passing `--explore -o report.html`.
It parses the source file and writes an HTML5 document featuring:
1. Source code viewer with escaped HTML entities.
2. Searchable "Symbol Detective" table.
3. Collapsible AST tree built using native HTML `<details>` and `<summary>` tags.
4. Diagnostics section for syntax and semantic errors.
5. Interactive "IR Microscope" with JavaScript Next/Previous buttons that step through each emitted TAC instruction.

### Q30: Why is `reset_compiler_state()` necessary in `parser_wrapper.y`?
**Answer**:
In `compiler/parser_wrapper.y:757-778`, `reset_compiler_state()` frees all dynamic string allocations in `symbol_table`, resets `count=0`, `countn=0`, `sem_errors=0`, `ic_idx=0`, `temp_var=0`, `label=0`, zeroes the diagnostic arrays, and resets `yylineno=1`.
This is critical because in interactive console mode (`cli/main.c:356`) or during automated regression testing, multiple files are analyzed sequentially in the same process; without a complete reset, symbols and errors from previous runs would leak into subsequent compilations.

---

## Category 7: Limitations, Defense & Future Scope

### Q31: What are the main limitations of our Symbol Table implementation?
**Answer**:
1. **Flat Scope**: It does not maintain a scope stack. A variable declared inside a nested `{ ... }` block shares the global namespace with outer variables and cannot shadow an outer variable.
2. **Fixed Capacity**: The table is bounded to 300 entries (`struct dataType symbol_table[300]`).
3. **Linear Search**: Lookup is O(N) rather than O(1).
In a production compiler, we would implement a scoped symbol table using a linked list of hash tables (one per lexical scope level).

### Q32: What happens if a variable is used inside an expression before it is declared?
**Answer**:
When Bison reduces `value: ID`, it calls `check_declaration($1.name)`.
`check_declaration()` calls `search($1.name)`. Since the variable has not been declared, `search()` returns `0`.
`add_error()` logs `"Variable \"%s\" not declared before use!"` with the line number.
Parsing continues to collect any additional errors, but `sem_errors` is incremented. At the end of frontend analysis, `cli/main.c` detects `sem_errors > 0` and terminates with exit code `1`.

### Q33: How would you implement genuine Target Code Generation (e.g., x86-64 assembly) if given two more weeks?
**Answer**:
To implement native x86-64 code generation:
1. Partition the Three-Address Code into **Basic Blocks** (sequences of instructions with one entry and one exit).
2. Construct a **Control Flow Graph (CFG)** connecting basic blocks with directed jump edges.
3. Implement a **Register Allocator**: either a simple linear-scan register allocator or graph-coloring algorithm to map temporaries (`t0`, `t1`, ...) to hardware registers (`%rax`, `%rbx`, `%rcx`, etc.) and spill excess variables to stack offsets (`-8(%rbp)`, `-16(%rbp)`).
4. Implement an instruction selector that translates each TAC instruction into x86-64 assembly (e.g., `t0 = a + b` -> `movl a, %eax; addl b, %eax; movl %eax, t0`).
5. Output the assembly text to a `.s` file and assemble with `as` or `gcc`.

### Q34: How did we test and validate our compiler?
**Answer**:
We implemented a comprehensive automated test framework:
1. **Examples Suite**: 15 representative C programs in `examples/` covering arithmetic, loops, conditionals, strings, type conversion, and error scenarios.
2. **Automated Regression Suite (`tests/test_regressions.py`)**: 21 parameterized Python unit tests verifying token correctness, arithmetic precedence, bitwise operations, constant division by zero, capacity limits, line ending support (LF and CRLF), and exit codes. All 21 tests pass with 100% success.

### Q35: What would happen if we removed the Semantic Analysis phase entirely?
**Answer**:
If semantic analysis were removed, grammatically valid but logically nonsensical programs would be accepted. For instance:
- Variables could be used without being declared, resulting in uninitialized memory reads or undefined assembly references.
- Conflicting redeclarations with different types would corrupt data layouts.
- Incompatible type operations (like assigning an array pointer to a char) would occur without explicit coercion.
- Constant divide-by-zero operations would crash at runtime instead of being caught at compile time.
Semantic analysis ensures that a syntactically correct program also obeys the type and semantic contracts of the language before code generation.
