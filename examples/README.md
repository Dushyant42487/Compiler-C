# Example C Programs

This folder contains sample C programs to test the compiler's functionality.

## ✅ Valid Programs

These programs should compile successfully without errors:

### `simple.c`
**Description:** Minimal program with basic variable declarations and assignments.
**Tests:** Basic lexical and syntax analysis.

```bash
ccompiler simple.c
```

### `arithmetic.c`
**Description:** Arithmetic operations with integers and floats.
**Tests:** All arithmetic operators (+, -, *, /) and type conversions.

```bash
ccompiler arithmetic.c
```

### `conditionals.c`
**Description:** If-else conditional statements.
**Tests:** Simple and nested conditionals with various relational operators.

```bash
ccompiler conditionals.c
```

### `loops.c`
**Description:** For loops including nested loops.
**Tests:** Loop constructs with counters and conditionals inside loops.

```bash
ccompiler loops.c
```

### `type_conversion.c`
**Description:** Automatic type conversions.
**Tests:** Conversions between int, float, and char types.

```bash
ccompiler type_conversion.c
```

### `input1.c`
**Description:** Complex program with nested structures.
**Tests:** Combination of loops, conditionals, printf, scanf.

```bash
ccompiler input1.c
```

### `input2.c`
**Description:** Additional test case.

```bash
ccompiler input2.c
```

### `input3.c`
**Description:** Additional test case.

```bash
ccompiler input3.c
```

## ❌ Error Test Programs

These programs intentionally contain errors to test error detection:

### `error_undeclared.c`
**Description:** Uses an undeclared variable.
**Expected:** Semantic error - "Variable not declared before usage"

```bash
ccompiler error_undeclared.c
```

**Expected Output:**
```
Semantic analysis completed with 1 error(s):
  Line X: Variable "y" not declared before usage!
```

### `error_redeclaration.c`
**Description:** Redeclares a variable.
**Expected:** Semantic error - "Multiple declarations not allowed"

```bash
ccompiler error_redeclaration.c
```

**Expected Output:**
```
Semantic analysis completed with 1 error(s):
  Line X: Multiple declarations of "x" not allowed!
```

### `error_syntax.c`
**Description:** Missing semicolon.
**Expected:** Syntax error

```bash
ccompiler error_syntax.c
```

**Expected Output:**
```
Syntax Error: syntax error at line X
```

## 🎯 Quick Test Commands

### Test All Valid Programs
```powershell
# PowerShell
Get-ChildItem *.c -Exclude error_*.c | ForEach-Object { 
    Write-Host "`n=== Testing $($_.Name) ===" -ForegroundColor Cyan
    ccompiler $_.FullName 
}
```

```bash
# Bash (Git Bash/MSYS2)
for file in *.c; do
    [[ $file != error_* ]] && echo "=== Testing $file ===" && ccompiler "$file"
done
```

### Test Only Error Programs
```powershell
# PowerShell
Get-ChildItem error_*.c | ForEach-Object { 
    Write-Host "`n=== Testing $($_.Name) ===" -ForegroundColor Yellow
    ccompiler $_.FullName 
}
```

### Test Specific Phases

**Symbol Table Only:**
```bash
ccompiler --symbols arithmetic.c
```

**Parse Tree Only:**
```bash
ccompiler --parse-tree conditionals.c
```

**Semantic Analysis Only:**
```bash
ccompiler --semantic type_conversion.c
```

**Intermediate Code Only:**
```bash
ccompiler --ir loops.c
```

## 📝 Creating Your Own Test Programs

### Guidelines

1. **Include stdio.h:**
   ```c
   #include<stdio.h>
   ```

2. **Use main function:**
   ```c
   int main() {
       // your code
       return 0;
   }
   ```

3. **Use braces for all control structures:**
   ```c
   // Correct
   if(x > 5) {
       y = 10;
   }
   
   // Incorrect (will fail)
   if(x > 5)
       y = 10;
   ```

4. **Declare before use:**
   ```c
   int x;    // Declare first
   x = 10;   // Then use
   ```

5. **No arrays or pointers:**
   ```c
   // NOT supported
   int arr[10];
   int *ptr;
   ```

### Supported Features

- ✅ Variables: `int`, `float`, `char`
- ✅ Arithmetic: `+`, `-`, `*`, `/`
- ✅ Relational: `<`, `>`, `<=`, `>=`, `==`, `!=`
- ✅ Logical: `&&`, `||`
- ✅ Unary: `++`, `--`
- ✅ Control: `if-else`, `for`
- ✅ I/O: `printf`, `scanf`
- ✅ Comments: `//` and `/* */`

### Limitations

- ❌ No arrays
- ❌ No pointers
- ❌ No functions (except main)
- ❌ No structures/unions
- ❌ No `else if` (use nested `if-else`)
- ❌ No `while` or `do-while` loops

## 🔍 Analyzing Output

### Understanding the Symbol Table
Shows all identifiers found during lexical analysis:
- Headers (includes)
- Keywords (int, for, if, etc.)
- Variables
- Constants
- Functions

### Understanding the Parse Tree
Shows the syntactic structure of your program in inorder traversal.

### Understanding Semantic Analysis
Reports type checking errors, undeclared variables, and redeclarations.

### Understanding Intermediate Code
Shows the three-address code representation:
- Simple assignments: `x = 5`
- Arithmetic: `t0 = x + y`
- Labels: `L0:`, `L1:`
- Conditionals: `if (x > y) GOTO L0`
- Type conversions: `inttofloat`, `floattoint`

## 💡 Tips

1. **Start simple:** Begin with `simple.c`, then progress to more complex examples.

2. **Compare outputs:** Run multiple programs and compare their symbol tables and intermediate code.

3. **Test errors:** Try the error examples to understand how the compiler detects problems.

4. **Save output:** Use `-o` flag to save analysis for later review:
   ```bash
   ccompiler arithmetic.c -o arithmetic_analysis.txt
   ```

5. **Use VS Code:** Open this folder in VS Code and press `Ctrl+Shift+B` on any `.c` file.

## 🎓 Learning Exercises

1. **Modify** `simple.c` to add more variables and operations
2. **Create** a program that tests all relational operators
3. **Write** a nested loop that calculates a mathematical pattern
4. **Design** a program with intentional type conversion scenarios
5. **Experiment** with breaking the rules to see error messages

## 📚 Additional Resources

- [Main README](../README.md) - Full documentation
- [INSTALL.md](../INSTALL.md) - Installation guide
- [VS Code Tasks](../.vscode/tasks.json) - Build configurations
