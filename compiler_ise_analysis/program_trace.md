# Program Trace — End-to-End Compilation Walkthrough

This document traces actual valid and invalid programs through all implemented phases of the compiler, using verified outputs produced by the compiled `ccompiler` binary.

---

## 1. Trace of a Valid Program (`examples/simple.c`)

### 1.1 Source Code Input
The source file is `examples/simple.c`:
```c
// Simple C program demonstrating basic features
// This is a minimal example to test the compiler

#include<stdio.h>

int main() {
    int x;
    int y;
    x = 5;
    y = 10;
    return 0;
}
```

---

### 1.2 Phase 1: Lexical Analysis (Scanner)

- **Responsible File & Function**: `compiler/lexer.l` (`yylex()`, `RETURN_TOKEN()`, `COPY_TOKEN()`).
- **Input**: Raw text characters from `examples/simple.c`.
- **Processing**:
  1. Comment lines 1 and 2 match `\/\/[^\r\n]*` and are discarded without token emission.
  2. `#include<stdio.h>` matches `[ \t]*"#include"[ \t]*[<"][^>\r\n\"]+[>"]` -> returns token `INCLUDE`.
  3. Newline characters increment `countn`.
  4. `int` matches keyword rule -> returns `INT`.
  5. `main`, `x`, `y` match `{alpha}({alpha}|{digit})*` -> return `ID`.
  6. Symbols `(`, `)`, `{`, `}`, `;`, `=` match punctuation rules.
  7. Constants `5`, `10`, `0` match `{digit}+` -> return `NUMBER`.
  8. `return` matches keyword rule -> returns `RETURN`.
- **Actual Tokens Emitted** (verified with `./ccompiler --tokens examples/simple.c`):
  ```text
  TOKEN line 4 INCLUDE      #include<stdio.h>
  TOKEN line 6 INT          int
  TOKEN line 6 ID           main
  TOKEN line 6 CHAR         (
  TOKEN line 6 CHAR         )
  TOKEN line 6 CHAR         {
  TOKEN line 7 INT          int
  TOKEN line 7 ID           x
  TOKEN line 7 CHAR         ;
  TOKEN line 8 INT          int
  TOKEN line 8 ID           y
  TOKEN line 8 CHAR         ;
  TOKEN line 9 ID           x
  TOKEN line 9 CHAR         =
  TOKEN line 9 NUMBER       5
  TOKEN line 9 CHAR         ;
  TOKEN line 10 ID           y
  TOKEN line 10 CHAR         =
  TOKEN line 10 NUMBER       10
  TOKEN line 10 CHAR         ;
  TOKEN line 11 RETURN       return
  TOKEN line 11 NUMBER       0
  TOKEN line 11 CHAR         ;
  TOKEN line 12 CHAR         }
  ```
- **How Output is Passed**: Flex passes token integer IDs as return values of `yylex()` to `yyparse()`. Semantic values (lexemes) are placed in global variable `yylval.nd_obj.name`.

---

### 1.3 Supporting Component: Symbol Table Creation

- **Responsible Functions**: `add_symbol()`, `set_symbol_value()`, `search()` in `compiler/parser_wrapper.y`.
- **Processing During Reductions**:
  - `header` reduction inserts `#include<stdio.h>` (`type = Header`, line 3).
  - `statement: datatype id_list` for `int x;` calls `add_symbol('V', "x")` (`type = Variable`, `data_type = int`, line 6).
  - `statement: datatype id_list` for `int y;` calls `add_symbol('V', "y")` (`type = Variable`, `data_type = int`, line 7).
  - Assignment `x = 5;` parses `5` as `Constant` (`add_symbol('C', "5")`, line 8) and updates `x`'s value via `set_symbol_value("x", "5")`.
  - Assignment `y = 10;` parses `10` as `Constant` (`add_symbol('C', "10")`, line 9) and updates `y`'s value via `set_symbol_value("y", "10")`.
  - `return 0;` parses `0` as `Constant` (`add_symbol('C', "0")`, line 10).
  - `main_func` reduction inserts `main` as `Function` (`data_type = int`, line 11).
- **Actual Symbol Table Produced** (verified with `./ccompiler --symbols examples/simple.c`):
  ```text
  SYMBOL               DATA TYPE       TYPE            LINE NO    VALUE          
  -----------------------------------------------------------------------------------------
  #include<stdio.h>                    Header          3          -              
  x                    int             Variable        6          5              
  y                    int             Variable        7          10             
  5                    CONST           Constant        8          5              
  10                   CONST           Constant        9          10             
  0                    CONST           Constant        10         0              
  main                 int             Function        11         -              
  ```

---

### 1.4 Phase 2: Syntax Analysis (Parser & AST Construction)

- **Responsible Functions**: `yyparse()`, `mknode()` in `compiler/parser_wrapper.y`.
- **Grammar Reductions & Tree Linking**:
  1. `direct_declarator: ID` creates leaf node `"x"`.
  2. `init: empty` sets initial node `"NULL"`.
  3. `declarator` creates node `mknode("x", "NULL", "declaration")`.
  4. Same sequence creates node `mknode("y", "NULL", "declaration")`.
  5. `expression: ID '=' expression` creates assignment node `mknode("x", "5", "=")`.
  6. Same sequence creates assignment node `mknode("y", "10", "=")`.
  7. `statement_or_block: RETURN expression ';'` creates `mknode(mknode(NULL, NULL, "return"), "0", "RETURN")`.
  8. `statement_list` chains all statements with `"statements"` branch nodes.
  9. `main_func` binds the body under `"main"`.
  10. `program` binds headers and main under root node `"program"`.
- **Actual Parse Tree Traversal Output** (verified with `./ccompiler --parse-tree examples/simple.c`):
  ```text
  Inorder traversal: xdeclaration, NULLstatements, ydeclaration, NULLstatements, x=, 5statements, y=, 10statements, returnRETURN, 0main, 
  ```
- **How Output is Passed**: Pointer to the root of the parsed AST is saved in global pointer `head = $3.nd` (`parser_wrapper.y:115`).

---

### 1.5 Phase 3: Semantic Analysis

- **Responsible Functions**: `check_declaration()`, `check_types()`, `check_return_type()` in `compiler/parser_wrapper.y`.
- **Validation Checks Applied**:
  - `check_declaration("x")` called on line 9: `search("x")` finds entry at index 1 -> **PASSED**.
  - `check_declaration("y")` called on line 10: `search("y")` finds entry at index 2 -> **PASSED**.
  - `check_types("int", "int")` for `x = 5` and `y = 10` returns `0` (types match) -> **PASSED**.
  - Duplicate check in `add_symbol('V')`: each variable name declared once -> **PASSED**.
  - Reserved keyword check: `"x"` and `"y"` do not collide with C keywords -> **PASSED**.
- **Actual Semantic Analysis Output**:
  ```text
  Semantic analysis completed successfully with no errors.
  ```
- **How Output is Passed**: Global error counter `sem_errors` remains `0`.

---

### 1.6 Phase 4: Intermediate Code Generation (3-Address Code)

- **Responsible Functions**: Actions in `declarator`, assignment productions, and `emit_ir()` in `compiler/parser_wrapper.y`.
- **Instruction Synthesis**:
  - Variable `x` declared without initializer -> `emit_ir("%s = %s\n", "x", "NULL")` -> emits `x = NULL`.
  - Variable `y` declared without initializer -> emits `y = NULL`.
  - Assignment `x = 5;` -> `emit_ir("%s = %s\n", "x", "5")` -> emits `x = 5`.
  - Assignment `y = 10;` -> `emit_ir("%s = %s\n", "y", "10")` -> emits `y = 10`.
  - Return statement `return 0;` -> `emit_ir("RETURN %s\n", "0")` -> emits `RETURN 0`.
- **Actual Intermediate Code Generated** (verified with `./ccompiler --ir examples/simple.c`):
  ```text
  x = NULL
  y = NULL
  x = 5
  y = 10
  RETURN 0
  ```

---

### 1.7 Phase 5: Code Optimization (Constant Folding Demonstration)

In `examples/simple.c`, variables are assigned constants directly without intermediate expressions. To observe the active **Constant Folding and Propagation** pass, consider `examples/arithmetic.c`:
```c
int a = 10;
int b = 20;
int sum;
sum = a + b;
```
- In `binary_expression()` (`parser_wrapper.y:723`), `can_eval("a")` fetches `10`, `can_eval("b")` fetches `20`.
- It folds `10 + 20` into `30` at compile time and stores `"30"` in `result.name`.
- Emitted IR from `examples/arithmetic.c`:
  ```text
  a = 10
  b = 20
  sum = NULL
  30 = a + b
  sum = 30
  ```

---

### 1.8 Phase 6 & 7: Target Code Generation & Runtime Execution

- **Responsible Functions**: `cli/main.c:292-342` (`find_c_backend()`, `run_backend_compiler()`, `run_binary()`).
- **Processing**:
  1. Frontend analysis finishes with `0` syntax errors and `0` semantic errors.
  2. When executed with `./ccompiler -r examples/simple.c`, `cli/main.c` triggers host backend compilation.
  3. `find_c_backend()` discovers system `clang` (or `gcc`).
  4. It invokes `clang -o temp_run.out examples/simple.c`.
  5. It executes `./temp_run.out` via `fork()`/`execvp()`.
  6. The process completes with exit code `0`.
- **Actual Runtime Console Output**:
  ```text
  =========================================================================================
    PHASE 5: PROGRAM RUNTIME EXECUTION OUTPUT
  =========================================================================================

  =========================================================================================
    Program execution finished (exit code: 0)
  =========================================================================================
  ```

---

## 2. Trace of Invalid Programs (Failure Analysis)

### 2.1 Case 1: Syntax Error (Missing Semicolon)
- **Source File**: `examples/error_syntax.c`
  ```c
  #include<stdio.h>

  int main() {
      int x = 10
      int y = 20;
      return 0;
  }
  ```
- **Failing Phase**: **Phase 2: Syntax Analysis (Parser)**.
- **Where & Why It Fails**:
  - Lexer tokenizes `NUMBER` (`10`).
  - Next token returned by lexer is `INT` (`int` on line 8).
  - In Bison production `declarator: pointer_opt direct_declarator init`, a statement must be terminated by `;` before the next statement begins (`statement_or_block: statement ';'`).
  - When Bison receives token `INT` in shift state expecting `;`, no valid shift or reduce transition exists.
  - Bison calls `yyerror("syntax error")` (`parser_wrapper.y:1026`).
- **Actual Output Produced**:
  ```text
  Analyzing: examples/error_syntax.c

  Syntax Error: syntax error at line 8

  Analysis failed with syntax errors.
  ```
  *Process exits immediately with status code `1`.*

---

### 2.2 Case 2: Semantic Error (Undeclared Variable)
- **Source File**: `examples/error_undeclared.c`
  ```c
  #include<stdio.h>

  int main() {
      int x = 10;
      y = x + 5;
      return 0;
  }
  ```
- **Failing Phase**: **Phase 3: Semantic Analysis**.
- **Where & Why It Fails**:
  - The syntax of assignment `y = x + 5;` is completely valid according to grammar rule `expression: ID '=' expression`.
  - However, the semantic action at `parser_wrapper.y:449` invokes `check_declaration("y")`.
  - `check_declaration` calls `search("y")`. Because `y` was never declared via a type specifier, `search()` returns `0`.
  - `check_declaration` invokes `add_error("Line %d: Variable \"%y\" not declared before use!\n", 9, "y")`.
  - Parsing completes, but `sem_errors` equals `1`.
- **Actual Output Produced**:
  ```text
  Analyzing: examples/error_undeclared.c

  [Phase 1: Symbol Table printed]
  [Phase 2: Parse Tree printed]

  =========================================================================================
    PHASE 3: SEMANTIC ANALYSIS
  =========================================================================================

  Semantic Errors Found: 1
    - Line 9: Variable "y" not declared before use!

  [Phase 4: Intermediate Code Generation printed]

  Analysis failed with 1 semantic error(s).
  ```
  *Process exits with status code `1`; target execution is blocked.*

---

### 2.3 Case 3: Semantic Error (Variable Redeclaration)
- **Source File**: `examples/error_redeclaration.c`
  ```c
  #include<stdio.h>

  int main() {
      int x = 10;
      int y = 20;
      int x = 30;
      return 0;
  }
  ```
- **Failing Phase**: **Phase 3: Semantic Analysis**.
- **Where & Why It Fails**:
  - On line 10, Bison parses `statement: datatype id_list` with `direct_declarator: ID` where `ID` is `"x"`.
  - This calls `add_symbol('V', "x")` (`parser_wrapper.y:945`).
  - `q = search("x")` searches existing entries in `symbol_table`.
  - Because `"x"` was already inserted on line 7, `search()` returns `-1` (non-zero).
  - The branch `else if(c == 'V' && q)` executes (`parser_wrapper.y:988`), logging:
    ```c
    add_error("Line 10: Multiple declarations of \"x\" not allowed!\n");
    ```
- **Actual Output Produced**:
  ```text
  Semantic Errors Found: 1
    - Line 10: Multiple declarations of "x" not allowed!

  Analysis failed with 1 semantic error(s).
  ```

---

### 2.4 Case 4: Semantic / Optimization Error (Divide-by-Zero)
- **Code Snippet**: `int main() { int x = 10 / 0; return 0; }`
- **Failing Phase**: **Phase 3 / Constant Folding Optimizer**.
- **Where & Why It Fails**:
  - In `binary_expression()` (`parser_wrapper.y:727`):
  - `can_eval("10")` and `can_eval("0")` both evaluate to true.
  - The operator is `"/"` and right operand `b == 0`.
  - It triggers:
    ```c
    add_error("Line 1: Constant division or modulo by zero!\n");
    ```
- **Actual Output Produced**:
  ```text
  Semantic Errors Found: 1
    - Line 1: Constant division or modulo by zero!
  ```

---

### 2.5 Case 5: Lexical Error (Overlong Token)
- **Input**: Identifier with length > 99 characters (`int xxxxx... = 1;`).
- **Failing Phase**: **Phase 1: Lexical Analysis**.
- **Where & Why It Fails**:
  - In `compiler/lexer.l:10`, the macro `COPY_TOKEN()` evaluates:
    ```c
    if (yyleng >= sizeof(yylval.nd_obj.name)) {
        fprintf(stderr, "Lexical Error: token exceeds 99 bytes at line %d\n", countn+1);
        return 257;
    }
    ```
  - It immediately prints to `stderr`:
    ```text
    Lexical Error: token exceeds 99 bytes at line 1
    ```
  - And forces an invalid token return code, halting compilation.
