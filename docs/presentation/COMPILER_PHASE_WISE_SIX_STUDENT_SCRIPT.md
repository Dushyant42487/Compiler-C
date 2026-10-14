# C Compiler Studio: Six-Student Academic Presentation Speaking Scripts & Viva Defense Guide

---

## Presentation Overview & Timing Strategy

- **Format**: 6-Student Computer Science Final Year / ISE Project Defense
- **Total Duration**: Approximately 18–20 minutes (3 minutes per student) + 5 minutes Live Demo & Examiner Q&A
- **Core Rule**: **ONE STUDENT = ONE MAJOR COMPILER PHASE**
- **Examiner Expectation**: Each student must speak with deep familiarity regarding their assigned phase, cite exact files and line numbers in the repository, explain data flow into and out of their phase, perform a live demo action, and defend against technical viva inquiries.

```
+-----------+-----------------------------------------------+---------------+-----------------------------------+
| Student   | Assigned Compiler Domain & Phase              | Target Time   | Primary Repository File           |
+-----------+-----------------------------------------------+---------------+-----------------------------------+
| Student 1 | Phase 1: Lexical Analysis (Flex Scanner)      | 3 mins        | compiler/lexer.l                  |
| Student 2 | Phase 2: Syntax Analysis & AST (Bison LALR)   | 3 mins        | compiler/parser_wrapper.y         |
| Student 3 | Phase 3: Semantic Analysis & Symbol Table     | 3 mins        | compiler/parser_wrapper.y         |
| Student 4 | Phase 4: Intermediate Code Generation (TAC)   | 3 mins        | compiler/parser_wrapper.y         |
| Student 5 | Phase 5: Code Optimization (Constant Folding) | 3 mins        | compiler/parser_wrapper.y         |
| Student 6 | Phase 6: Target Execution & System Integration| 3 mins        | cli/main.c, backend/, frontend/   |
+-----------+-----------------------------------------------+---------------+-----------------------------------+
```

---

## Student 1: Lexical Analysis & Tokenization (Flex Scanner)

- **Assigned Phase**: Phase 1 — Lexical Analysis
- **Target Duration**: 3 Minutes
- **Repository Files to Open**: `compiler/lexer.l` (and `compiler/lex.yy.c`)
- **Key Code Sections to Reference**:
  - `COPY_TOKEN()` and `RETURN_TOKEN()` macros (Lines 10–16)
  - Regular expressions for identifiers, numbers, and strings (Lines 19–22, 54–56)
  - Multiline and single-line comment filtering (Lines 83–88)
  - Line counting logic (`countn++`, `%option yylineno`)

### Speaking Script

> "Respected professors and examiners, good morning. My name is [Student 1 Name], and I will begin our project presentation by explaining **Phase 1: Lexical Analysis**.
>
> When a developer writes a C program, the computer sees only an unstructured linear stream of ASCII characters. The goal of lexical analysis is to transform this raw character stream into meaningful syntactic units called **Tokens**, while eliminating elements that have no semantic value to the compiler, such as spaces, tabs, and comments.
>
> In our project, Phase 1 is implemented in `compiler/lexer.l` using the **Flex** lexical scanner generator. 
>
> If you look at lines 10 to 16 in `compiler/lexer.l`, we have engineered a robust token copy safety mechanism:
>
> ```c
> #define COPY_TOKEN() do { \
>     if (yyleng >= sizeof(yylval.nd_obj.name)) { \
>         fprintf(stderr, "Lexical Error: token exceeds 99 bytes at line %d\n", countn+1); \
>         return 257; \
>     } \
>     strcpy(yylval.nd_obj.name, yytext); \
> } while (0)
> ```
>
> In many student compilers, an oversized identifier or string literal causes a buffer overflow crash. In our implementation, `COPY_TOKEN()` checks `yyleng` against our 100-byte semantic value buffer, preventing memory corruption.
>
> Flex processes rules based on the principle of **Maximal Munch**—it always selects the longest valid matching prefix. For example:
> - The regular expression `{digit}+` recognizes integer numbers.
> - `{digit}+\.{digit}{1,6}` recognizes floating-point numbers.
> - `{alpha}({alpha}|{digit})*` recognizes identifiers.
>
> Notice lines 83 to 88 for comments. For single-line comments `//`, the lexer simply discards characters up to the newline. For multi-line block comments `/* ... */`, our lexer actively iterates through the matched text and increments our global line counter `countn` for every newline character encountered. This ensures that compiler diagnostics in later phases never suffer from line desynchronization.
>
> When a token is matched, `RETURN_TOKEN()` returns an integer token identifier defined in `y.tab.h` to the parser, and passes the lexeme text in `yylval.nd_obj.name`.
>
> To conclude Phase 1, our lexer converts raw C code into a clean, typed token stream that feeds directly into the syntax parser. I now hand over to [Student 2 Name] to explain Phase 2: Syntax Analysis."

### Live Demonstration Action
- In the web IDE, select `1. Basic Variables & Assignment`.
- Click **Analyze Phases** and navigate to the **Tokens Tab**.
- Point out the 24 extracted tokens with their line numbers, token classes (`INCLUDE`, `INT`, `ID`, `NUMBER`), and exact matched lexemes.

### Likely Viva Questions & Technical Model Answers

1. **Q: How does Flex resolve conflicts when an input matches multiple regular expressions?**
   - **Answer**: Flex applies two disambiguation rules: (1) **Longest Match (Maximal Munch)**: The pattern that matches the greatest number of characters is chosen (e.g., `for_loop` is recognized as an `ID`, not keyword `for`). (2) **First Rule Specified**: If two patterns match the same length, the pattern appearing earlier in `lexer.l` wins (e.g., keyword `int` appears before `{alpha}({alpha}|{digit})*`, so `int` is recognized as keyword `INT`, not `ID`).

2. **Q: What is `yytext`, `yyleng`, and `yylval`?**
   - **Answer**: `yytext` is a pointer to the matched lexeme string. `yyleng` is the length of the matched string. `yylval` is the shared global union variable used by Bison and Flex to exchange semantic values (in our code, `yylval.nd_obj.name` holds the textual string).

3. **Q: How does your lexer handle lexical errors?**
   - **Answer**: At line 93 of `lexer.l`, the catch-all rule `.` matches any unrecognized character, prints an informative token message, and returns the literal character value to the parser, which triggers syntax recovery if unexpected.

4. **Q: Why do you need both `%option yylineno` and manual `countn++`?**
   - **Answer**: `%option yylineno` is Flex's built-in line tracker, while our custom `countn` integer variable is maintained for legacy synchronization across error arrays and terminal reports.

---

## Student 2: Syntax Analysis & AST Generation (Bison LALR(1) Parser)

- **Assigned Phase**: Phase 2 — Syntax Analysis & AST Construction
- **Target Duration**: 3 Minutes
- **Repository Files to Open**: `compiler/parser_wrapper.y` (Lines 14–18, 91–118, 196–228, 993–1020)
- **Key Code Sections to Reference**:
  - `struct node` and `mknode()` (Lines 14–18, 993–1001)
  - Operator precedence declarations (`%left`, `%right`) (Lines 97–111)
  - Grammar productions for `program`, `statement_or_block`, `condition`
  - Inorder AST traversal `print_inorder()` (Lines 1010–1020)

### Speaking Script

> "Thank you, [Student 1 Name]. Good morning professors. My name is [Student 2 Name], and I am responsible for **Phase 2: Syntax Analysis and Abstract Syntax Tree (AST) Generation**.
>
> While the lexer validates individual words, the syntax analyzer validates the **grammatical structure** of the sentences according to a formal Context-Free Grammar. It verifies that statements, declarations, and expressions appear in legal sequence.
>
> In our project, Phase 2 is implemented in `compiler/parser_wrapper.y` using **Bison**, which generates an **LALR(1) (Look-Ahead Left-to-right, Rightmost derivation with 1 token lookahead)** pushdown automaton.
>
> In lines 97 to 111 of `parser_wrapper.y`, we resolve classical grammar ambiguities—such as the dangling-else problem and operator precedence—using explicit associativity declarations:
>
> ```yacc
> %right '=' ADD_ASSIGN SUB_ASSIGN MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN
> %right '?' ':'
> %left OR
> %left AND
> %left EQ NE
> %left LT GT LE GE
> %left ADD SUBTRACT
> %left MULTIPLY DIVIDE MODULO
> %right NOT BITNOT UNARY CAST
> ```
>
> By declaring `%left MULTIPLY DIVIDE` below `%left ADD SUBTRACT`, Bison automatically assigns higher precedence to multiplication and division, resolving shift/reduce conflicts during arithmetic parsing.
>
> A distinctive feature of our parser is that it does not merely check correctness—it actively constructs a binary **Abstract Syntax Tree (AST)**. 
>
> In lines 14 to 18 and 993 to 1001, we define our AST node structure and creation function:
>
> ```c
> struct node { 
>     struct node *left; 
>     struct node *right; 
>     char *token; 
> };
> 
> struct node* mknode(struct node *left, struct node *right, const char *token);
> ```
>
> As grammar productions reduce, actions call `mknode()`. For example, when reducing an assignment:
>
> ```yacc
> ID '=' expression {
>     $$.nd = mknode(mknode(NULL, NULL, $1.name), $3.nd, "=");
> }
> ```
>
> The left child becomes the identifier leaf, the right child becomes the evaluated expression subtree, and the root is the operator `=`. 
>
> If a syntax error occurs—such as a missing semicolon or unmatched brace—Bison interrupts parsing and invokes our `yyerror()` routine, reporting the exact line number.
>
> Once `yyparse()` completes, `print_inorder()` performs an inorder tree traversal, producing the structural AST nodes that you see in our IDE interface.
>
> Next, [Student 3 Name] will explain how we validate the semantic meaning of these tree structures."

### Live Demonstration Action
- In the web IDE, navigate to the **Parse Tree Tab**.
- Toggle between **Visual Nodes** and **Raw Traversal**.
- Show the visual pills representing the hierarchical AST nodes: `declaration`, `statements`, `=`, `return`.

### Likely Viva Questions & Technical Model Answers

1. **Q: What is the difference between a Parse Tree (CST) and an Abstract Syntax Tree (AST)?**
   - **Answer**: A Concrete Syntax Tree (Parse Tree) contains every grammatical token from the grammar, including punctuation such as parentheses, commas, and semicolons. An Abstract Syntax Tree (AST) preserves only the semantic hierarchy of operations and operands, omitting non-semantic syntactic sugar.

2. **Q: What is an LALR(1) parser, and how does it compare to SLR(1) and canonical LR(1)?**
   - **Answer**: LALR(1) merges states of a canonical LR(1) parser that share identical sets of LR(0) items (cores) but differing lookaheads. It has the same compact state count as SLR(1) but possesses significantly stronger lookahead parsing power without the state explosion of full LR(1).

3. **Q: What causes shift/reduce conflicts and how did you resolve them?**
   - **Answer**: Shift/reduce conflicts occur when the parser cannot decide whether to shift the next token onto the parse stack or reduce a grammar production. We resolved them using Bison's `%left`, `%right`, and `%prec` declarations, specifically giving `*` higher precedence than `+`, and binding `else` to the nearest preceding `if`.

4. **Q: What is `%union` in Bison?**
   - **Answer**: The `%union` declaration in lines 76 to 89 defines the data types that grammar symbols (`$$`, `$1`, `$2`) can hold. We use `struct var_name` to store both the node pointer (`struct node* nd`) and the token text (`char name[100]`).

---

## Student 3: Semantic Analysis & Symbol Table Management

- **Assigned Phase**: Phase 3 — Semantic Analysis & Symbol Table
- **Target Duration**: 3 Minutes
- **Repository Files to Open**: `compiler/parser_wrapper.y` (Lines 52–65, 845–991)
- **Key Code Sections to Reference**:
  - `struct dataType symbol_table[300]` (Lines 52–59)
  - `add_symbol()` and keyword collisions (Lines 933–991)
  - `check_declaration()` and stdlib whitelist (Lines 856–874)
  - `check_types()` and automatic conversion AST nodes (Lines 891–917)

### Speaking Script

> "Thank you, [Student 2 Name]. Respected faculty, my name is [Student 3 Name], and I will present **Phase 3: Semantic Analysis and Symbol Table Management**.
>
> A program can be syntactically perfect but semantically meaningless. For instance, the statement `x = y + 5;` is syntactically valid C grammar, but if `y` was never declared, or if `x` is a function pointer and `y` is an integer, it violates the semantics of C.
>
> In our compiler, Phase 3 is implemented in `compiler/parser_wrapper.y` using a static **Symbol Table** and custom semantic validation functions.
>
> In lines 52 to 59, we define each symbol table entry:
>
> ```c
> struct dataType {
>     char * id_name;    /* Variable or constant identifier */
>     char * data_type;  /* "int", "float", "char", "void", "CONST" */
>     char * type;       /* "Variable", "Constant", "Function", "Header" */
>     int line_no;       /* Line number of declaration */
>     char * value;      /* Known compile-time value or "NULL" */
> } symbol_table[300];
> ```
>
> Whenever a declarator is processed, `add_symbol()` inserts the identifier into the table. Our semantic analyzer enforces four critical safety checks:
>
> 1. **Keyword Collision Prevention**: Lines 938 to 943 check whether the declared variable matches any of 20 reserved C keywords (`int`, `while`, `return`, `main`, etc.). If so, it logs a semantic error: `Variable name "x" is a reserved keyword!`.
> 2. **Duplicate Declaration Detection**: Line 988 verifies that if an identifier has already been recorded as a variable, a second declaration triggers `Multiple declarations of "x" not allowed!`.
> 3. **Undeclared Variable Detection**: In `check_declaration()` (lines 856 to 874), every identifier used in an expression must exist in `symbol_table`.
> 4. **Standard Library Function Whitelist**: Lines 858 to 868 contain a whitelist of 47 standard C library functions, including `printf`, `scanf`, `malloc`, `free`, and `strlen`. This allows student programs to call standard I/O functions without triggering undeclared symbol errors.
>
> Furthermore, in `check_types()`, when an integer is assigned to a float, or a float to an integer, our semantic analyzer detects the mismatch and inserts explicit conversion AST nodes: `floattoint` or `inttofloat`.
>
> All semantic errors are accumulated in `errors[100][100]` without aborting parsing immediately, allowing the compiler to report multiple diagnostics in a single run.
>
> I now invite [Student 4 Name] to explain Phase 4: Intermediate Code Generation."

### Live Demonstration Action
- In the web IDE, navigate to the **Symbols Tab**.
- Point out the registered symbols: identifier names, data types, categories (`Variable`, `Constant`, `Header`), and the live gauge showing `x / 300` symbols tracked.
- Select `8. [Error] Syntax Error (Missing Semicolon)` or `9. [Error] Undeclared Variable` from Diagnostic Tests to show how the system detects and reports semantic errors.

### Likely Viva Questions & Technical Model Answers

1. **Q: Why is the Symbol Table necessary in a compiler?**
   - **Answer**: The symbol table is the central repository of compile-time information about program entities. It records data types, memory sizes, scope levels, and known values, which are required for type checking, semantic validation, and generating intermediate code addresses.

2. **Q: What is the difference between static semantic checks and dynamic semantic checks?**
   - **Answer**: Static semantic checks are performed at compile time without running the code (e.g., verifying variable declarations and type compatibility). Dynamic semantic checks occur at runtime during program execution (e.g., detecting array bounds violations or null pointer dereferences).

3. **Q: How does your compiler handle scopes?**
   - **Answer**: Our implementation currently utilizes a static symbol table with reverse-linear lookup (`search()`). Because scope lookup searches backwards from the most recent symbol, it supports global and function-level declarations. As documented in our limitations, inner-block shadowing is restricted.

4. **Q: How does type coercion work in your `check_types()` function?**
   - **Answer**: Lines 891 to 917 compare `type1` and `type2`. If one is `int` and the other is `float`, it returns code `1` or `2`, which prompts the grammar rule to wrap the child node in an `inttofloat` or `floattoint` AST node.

---

## Student 4: Intermediate Code Generation (Three-Address Code)

- **Assigned Phase**: Phase 4 — Intermediate Code Generation (IR)
- **Target Duration**: 3 Minutes
- **Repository Files to Open**: `compiler/parser_wrapper.y` (Lines 66–73, 259–284, 672–680)
- **Key Code Sections to Reference**:
  - `char icg[500][512]` and `emit_ir()` (Lines 73, 672–680)
  - Temporary counter `temp_var` and label counter `label` (Lines 67–68)
  - Control flow translation in `condition` (Lines 259–284)
  - While and For loop jump code generation (Lines 197–205)

### Speaking Script

> "Thank you, [Student 3 Name]. Good morning professors. My name is [Student 4 Name], and I will be presenting **Phase 4: Intermediate Code Generation**.
>
> If a compiler translated high-level source code directly into machine-specific assembly language, we would need to rewrite the entire backend for every new processor architecture—x86, ARM, RISC-V, or MIPS. To avoid this, modern compilers translate the Abstract Syntax Tree into an intermediate, machine-independent representation.
>
> In our compiler, Phase 4 produces **Three-Address Code (TAC)** in quadruple format. In Three-Address Code, each instruction has at most one operator on the right-hand side and at most three addresses: two operands and one destination result.
>
> If you look at lines 66 to 73 and 672 to 680 of `parser_wrapper.y`, we maintain an intermediate code array:
>
> ```c
> char icg[500][512];
> int ic_idx = 0;
> int temp_var = 0;
> int label = 0;
> 
> void emit_ir(const char *format, ...) {
>     if (ic_idx >= 500) { add_error("IR capacity (500) exceeded!\n"); return; }
>     va_list args;
>     va_start(args, format);
>     vsnprintf(icg[ic_idx++], sizeof(icg[0]), format, args);
>     va_end(args);
> }
> ```
>
> Two key mechanisms drive our IR generation:
> 1. **Temporary Variable Synthesis**: Complex expressions are linearized using synthesized temporaries: `t0`, `t1`, `t2`, etc. For example, the expression `a + b * c` is decomposed into:
>    ```
>    t0 = b * c
>    t1 = a + t0
>    ```
> 2. **Control Flow Linearization**: In lines 259 to 284, our `condition` production translates high-level Boolean logic into relational branch quadruples using labels `L0`, `L1`, etc.
>
> For an `if (x < y)` statement, the compiler emits:
> ```
> if (x < y) GOTO L0 else GOTO L1
> LABEL L0:
>   ... if body ...
> LABEL L1:
>   ... else body ...
> ```
>
> For a `while` loop, the compiler emits an unconditional jump back to the condition evaluation label, and places an exit jump label when the loop terminates.
>
> When analysis completes, all instructions in `icg` are displayed sequentially, providing a clear intermediate representation ready for machine code generation.
>
> I now hand over to [Student 5 Name] to explain Phase 5: Code Optimization."

### Live Demonstration Action
- In the web IDE, navigate to the **3-Address Code Tab**.
- Point out the numbered quadruples: assignment statements, temporary variables (`t0`, `t1`), and label targets (`L0`, `L1`, `RETURN 0`).

### Likely Viva Questions & Technical Model Answers

1. **Q: Why is Three-Address Code called "Three-Address Code"?**
   - **Answer**: Because each instruction contains at most three memory or register references: two operand addresses and one result destination address (e.g., `result = arg1 op arg2`).

2. **Q: What are the main formats for representing Three-Address Code?**
   - **Answer**: The three classical formats are: (1) **Quadruples**: A record with 4 fields: `op`, `arg1`, `arg2`, `result`. (2) **Triples**: A record with 3 fields: `op`, `arg1`, `arg2`, where intermediate results are implicitly referred to by the instruction's index. (3) **Indirect Triples**: A list of pointers to triples, which simplifies reordering during optimization. Our project implements the quadruple approach.

3. **Q: How does intermediate code generation make compilers retargetable?**
   - **Answer**: It separates the frontend (lexing, parsing, semantic checking) from the backend (instruction selection, register allocation). To support a new processor, only the backend needs to be written; the frontend remains completely unchanged.

4. **Q: What happens if the generated TAC exceeds your array size?**
   - **Answer**: In line 673, `emit_ir()` checks `if (ic_idx >= 500)`. If exceeded, it triggers an `add_error("IR capacity (500) exceeded!\n")` safety guard, preventing memory corruption.

---

## Student 5: Code Optimization (Constant Folding & Propagation)

- **Assigned Phase**: Phase 5 — Code Optimization
- **Target Duration**: 3 Minutes
- **Repository Files to Open**: `compiler/parser_wrapper.y` (Lines 616–662, 682–755)
- **Key Code Sections to Reference**:
  - `can_eval()`, `get_num_val()`, `is_num()` (Lines 637–662)
  - `set_symbol_value()` and `get_symbol_value()` (Lines 616–635)
  - Constant expression evaluation in `binary_expression()` (Lines 722–751)
  - Compile-time constant divide-by-zero detection (Lines 726–729)

### Speaking Script

> "Thank you, [Student 4 Name]. Respected faculty, my name is [Student 5 Name], and I will present **Phase 5: Code Optimization**.
>
> The goal of compiler optimization is to transform the intermediate code so that the generated program runs faster, consumes less memory, and uses fewer CPU registers, without altering the program's output.
>
> In our compiler, optimization is implemented in `compiler/parser_wrapper.y` through **Compile-Time Constant Folding** and **Constant Value Propagation**.
>
> Constant folding is the technique of evaluating operations on compile-time constants during compilation rather than generating runtime instructions for the CPU.
>
> If you examine lines 648 to 662 and lines 722 to 751, our optimization routine functions as follows:
>
> 1. When an expression is parsed, the helper function `can_eval()` checks whether both operands are known numeric constants or variables with constant values in the symbol table.
> 2. If both operands can be evaluated, the compiler computes the result immediately:
>
> ```c
> if (can_eval(left.name) && can_eval(right.name)) {
>     double a = get_num_val(left.name), b = get_num_val(right.name), r = 0;
>     if ((!strcmp(op, "/") || !strcmp(op, "%")) && b == 0) {
>         add_error("Line %d: Constant division or modulo by zero!\n", countn+1);
>     } else {
>         if (!strcmp(op, "+")) r = a + b;
>         else if (!strcmp(op, "-")) r = a - b;
>         else if (!strcmp(op, "*")) r = a * b;
>         else if (!strcmp(op, "/")) r = a / b;
>         /* Bitwise folding: &, |, ^, <<, >> */
>         snprintf(result.name, sizeof(result.name), "%d", (int)r);
>         folded = 1;
>     }
> }
> ```
>
> 3. If `folded == 1`, instead of creating a runtime temporary variable like `t0` and emitting a runtime instruction, the compiler substitutes the computed numeric result directly into the parent AST node and updates the symbol table using `set_symbol_value()`.
>
> For example, if the source code contains:
> ```c
> int x = 10 + 20 * 2;
> ```
> A non-optimizing compiler emits two runtime operations:
> ```
> t0 = 20 * 2
> t1 = 10 + t0
> x = t1
> ```
> Our optimizing compiler folds the operations at compile time, eliminating temporary registers and emitting directly:
> ```
> x = 50
> ```
>
> Furthermore, notice lines 726 to 729: if a student writes `10 / 0`, our optimizer catches it at compile time, logging `Constant division or modulo by zero!`, preventing a runtime CPU arithmetic exception.
>
> I now hand over to [Student 6 Name] to present Phase 6: Target Code Execution, CLI Driver, and Web Integration."

### Live Demonstration Action
- In the web IDE, select `2. Arithmetic & Constant Folding`.
- Click **Analyze Phases** and navigate to the **Optimizer Tab**.
- Show the folded constant records and point out the Three-Address Code tab to demonstrate that constant expressions were evaluated directly without runtime temporary instructions.

### Likely Viva Questions & Technical Model Answers

1. **Q: What is the difference between Constant Folding and Constant Propagation?**
   - **Answer**: **Constant Folding** simplifies constant expressions at compile-time (e.g., replacing `3 + 5` with `8`). **Constant Propagation** replaces variable occurrences with their known constant values (e.g., if `x = 5`, then subsequent statements like `y = x + 2` become `y = 5 + 2`, which can then be folded to `y = 7`). Our implementation uses `set_symbol_value()` and `get_symbol_value()` to support both.

2. **Q: What are the criteria for a valid compiler optimization?**
   - **Answer**: (1) It must preserve the exact semantics and behavior of the original program. (2) It must measurably reduce execution time, code size, or resource consumption. (3) The compile-time overhead of performing the optimization must be justifiable.

3. **Q: What other compiler optimizations exist beyond constant folding?**
   - **Answer**: Dead Code Elimination (removing unreachable statements or unread variables), Common Subexpression Elimination (CSE), Loop Invariant Code Motion (hoisting loop-independent calculations outside the loop), Strength Reduction (replacing expensive operations like multiplication by 2 with addition or left shifts), and Register Allocation via Graph Coloring.

4. **Q: Why is overflow handling important during constant folding?**
   - **Answer**: In line 735 and 745, we check bounds against `INT_MIN` and `INT_MAX` using `isfinite()`. If an operation would cause undefined host behavior or exceed 32-bit signed integer limits, the compiler handles it safely without crashing.

---

## Student 6: Target Code Execution, CLI Driver & Web Studio Integration

- **Assigned Domain**: Phase 6 — Target Execution, System Integration & Web Studio
- **Target Duration**: 3 Minutes
- **Repository Files to Open**: 
  - `cli/main.c` (Lines 158–195, 290–330)
  - `backend/src/services/compilerService.ts` (Lines 116–160)
  - `frontend/src/components/Header.tsx`, `EditorPanel.tsx`, `ResultsPanel.tsx`
- **Key Code Sections to Reference**:
  - Host backend detection: `find_c_backend()` (Lines 175–195)
  - Safe process execution: `run_process()` and `run_binary()` (Lines 116–173)
  - Full-stack integration: React Monaco frontend -> Express REST API -> `./ccompiler` execution

### Speaking Script

> "Thank you, [Student 5 Name]. Good morning professors. My name is [Student 6 Name], and I will conclude our presentation by explaining **Phase 6: Target Execution, CLI Architecture, and Full-Stack IDE Integration**.
>
> A complete compiler must deliver value to the developer. In Phase 6, we tie all custom frontend phases together into a standalone native executable binary (`./ccompiler`), orchestrate target execution, and expose the compiler through a modern online IDE.
>
> First, let me clarify our execution architecture:
> - **Phases 1 through 5**—Lexical analysis, LALR(1) parsing, AST generation, semantic validation, symbol table management, Three-Address Code synthesis, and constant folding—are **100% custom-implemented by our team** in Flex, Bison, and C99.
> - **Phase 6: Target Machine Code Generation** is orchestrated via host toolchain delegation. In `cli/main.c`, lines 175 to 195, our driver runs `find_c_backend()` to locate the system C compiler—GCC or Clang.
>
> When the user runs `./ccompiler -r program.c` or clicks **Run Binary** in our IDE:
> 1. Our custom frontend validates the program across all five compiler phases.
> 2. If zero errors are reported, `run_backend_compiler()` invokes GCC to generate a native binary (`a.out`), and `run_binary()` executes it safely, capturing stdout and execution time.
>
> To deliver a world-class user experience, we created **C Compiler Studio**, a full-stack web application:
> - **Frontend**: Built with React, TypeScript, Tailwind CSS, and Microsoft Monaco Editor. It features an Activity Bar, Project Sidebar with live compiler capacity meters (300 symbols, 500 TAC instructions), a connected Phase Pipeline ribbon, and a terminal console.
> - **Backend API**: A Node.js and Express REST microservice in `backend/src/services/compilerService.ts`. It accepts compilation requests at `POST /api/compile`, isolates execution in temporary scratch directories, invokes `./ccompiler`, and parses stdout into structured JSON tokens, AST nodes, and TAC instructions.
> - **Containerization**: A multi-stage `Dockerfile` compiles the C binary, installs Node.js backend dependencies, builds the Vite frontend bundle, and hosts the entire compiler studio as a production container.
>
> In conclusion, our team has built not just an isolated compiler phase, but an entire, verified compiler ecosystem.
>
> We are now ready to demonstrate the live application and answer your questions."

### Live Demonstration Action
- In the web IDE, click **Run Binary** (`⇧↵`).
- Show the **Terminal Tab** displaying the simulated macOS/Linux terminal console (`./a.out`) with standard output, duration in milliseconds, and `Exit Code: 0`.
- Open the **Specifications Modal** from the header to show the verified language specifications and pipeline data flow.

### Likely Viva Questions & Technical Model Answers

1. **Q: Does your project generate x86 machine code directly?**
   - **Answer**: We generate machine-independent Three-Address Code (TAC) quadruples directly in our custom compiler frontend. For the final machine code generation and ABI linkage, `cli/main.c` orchestrates the host GCC or Clang compiler via `run_backend_compiler()`. This is an industry-standard architecture similar to modern compiler frontends like Clang (which generates LLVM IR and relies on LLVM backends for machine code).

2. **Q: How does the backend communicate with the native `ccompiler` binary safely?**
   - **Answer**: In `backend/src/services/compilerService.ts`, we use Node.js `child_process.spawn()` with direct argument arrays, not `exec()`. This ensures that user input strings are never passed through a shell interpreter, completely eliminating shell injection vulnerabilities.

3. **Q: What security sandboxing is implemented for program execution?**
   - **Answer**: The backend enforces a 64KB input size limit, a 5-second execution timeout guard, and executes every program inside a distinct temporary scratch folder created via `os.tmpdir()`, which is automatically deleted after compilation.

4. **Q: How does the frontend visualize compiler phases without using mock data?**
   - **Answer**: The backend parses the raw stdout of `./ccompiler` using structured delimiters into real TypeScript typed data structures (tokens, symbol table rows, TAC instructions). If a phase fails in the C binary, the exact error string is transmitted and rendered directly in the Diagnostics tab.

---

## 7. Master Viva Checklist & Quick Reference for All 6 Students

```
+-----------+-----------------------------------+---------------------------------------------------+
| Student   | Assigned Phase                    | One-Sentence Defense Summary                      |
+-----------+-----------------------------------+---------------------------------------------------+
| Student 1 | Lexical Analysis (Flex)           | "I convert character streams into safe 99-byte     |
|           |                                   | typed tokens using Flex and Maximal Munch."        |
+-----------+-----------------------------------+---------------------------------------------------+
| Student 2 | Syntax Analysis & AST (Bison)     | "I verify ANSI C grammar via an LALR(1) pushdown   |
|           |                                   | automaton and construct binary AST nodes."        |
+-----------+-----------------------------------+---------------------------------------------------+
| Student 3 | Semantic Analysis & Symbols       | "I validate types, scopes, and stdlib bindings     |
|           |                                   | using a 300-entry symbol table."                  |
+-----------+-----------------------------------+---------------------------------------------------+
| Student 4 | Intermediate Code (TAC)           | "I linearize AST control flow into 3-Address Code  |
|           |                                   | quadruples with synthesized temporaries & labels."|
+-----------+-----------------------------------+---------------------------------------------------+
| Student 5 | Code Optimization                 | "I evaluate constant arithmetic at compile time    |
|           |                                   | to eliminate redundant runtime calculations."     |
+-----------+-----------------------------------+---------------------------------------------------+
| Student 6 | Target Execution & Integration    | "I coordinate host GCC execution, REST services,   |
|           |                                   | and the interactive IDE studio visualization."    |
+-----------+-----------------------------------+---------------------------------------------------+
```
