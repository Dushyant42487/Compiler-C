export interface CodeExample {
  id: string;
  name: string;
  category: 'valid' | 'semantic_error' | 'syntax_error';
  description: string;
  code: string;
}

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'simple',
    name: '1. Basic Variables & Assignment',
    category: 'valid',
    description: 'Minimal valid program demonstrating declarations, assignments, and return statement.',
    code: `// Simple C program demonstrating basic features
#include<stdio.h>

int main() {
    int x;
    int y;
    x = 5;
    y = 10;
    return 0;
}`,
  },
  {
    id: 'arithmetic',
    name: '2. Arithmetic & Constant Folding',
    category: 'valid',
    description: 'Arithmetic operations triggering compile-time constant folding and propagation.',
    code: `// Arithmetic operations with compile-time constant folding
#include<stdio.h>

int main() {
    int a = 10;
    int b = 20;
    int sum;
    int diff;
    int prod;
    int quot;

    // These constant expressions are folded by the compiler!
    sum = a + b;
    diff = b - a;
    prod = a * b;
    quot = b / a;

    float x = 5.5;
    float y = 2.5;
    float result;
    result = x + y;

    return 0;
}`,
  },
  {
    id: 'conditionals',
    name: '3. If-Else Conditionals',
    category: 'valid',
    description: 'Conditional branching translating to relational TAC labels and GOTOs.',
    code: `// Conditionals demonstration
#include<stdio.h>

int main() {
    int a = 15;
    int b = 20;
    int max;

    if (a > b) {
        max = a;
    } else {
        max = b;
    }

    return max;
}`,
  },
  {
    id: 'loops',
    name: '4. For & While Loops',
    category: 'valid',
    description: 'Loops generating label headers, condition jumps, and back-edges.',
    code: `// Loops demonstration
#include<stdio.h>

int main() {
    int i;
    int sum = 0;

    for (i = 0; i < 10; i++) {
        sum = sum + i;
    }

    int count = 5;
    while (count > 0) {
        count = count - 1;
    }

    return sum;
}`,
  },
  {
    id: 'even_odd',
    name: '5. Console I/O & Modulo',
    category: 'valid',
    description: 'Uses printf, scanf, and modulus arithmetic for direct execution mode.',
    code: `// Even or Odd checker with I/O
#include<stdio.h>

int main() {
    int n = 7;
    int rem;

    rem = n % 2;
    if (rem == 0) {
        printf("Number is Even\\n");
    } else {
        printf("Number is Odd\\n");
    }

    return 0;
}`,
  },
  {
    id: 'type_conversion',
    name: '6. Implicit & Explicit Type Casts',
    category: 'valid',
    description: 'Generates AST type conversion nodes like inttofloat and floattoint.',
    code: `// Type conversion test
#include<stdio.h>

int main() {
    int a = 5;
    float b = 2.5;
    float c;

    // Automatic type promotion
    c = a + b;

    // Explicit type cast
    int truncated;
    truncated = (int)c;

    return 0;
}`,
  },
  {
    id: 'pointers',
    name: '7. Pointers & Address-Of',
    category: 'valid',
    description: 'Single-level pointer declaration, address-of (&) operator, and pointer dereferencing (*p).',
    code: `// Pointers & Address-Of demonstration
#include<stdio.h>

int main() {
    int x = 42;
    int *p;
    p = &x;
    return *p;
}`,
  },
  {
    id: 'error_syntax',
    name: '8. [Error] Syntax Error (Missing Semicolon)',
    category: 'syntax_error',
    description: 'Bison parser catches statement termination violation at line 8.',
    code: `// Error test: Syntax error (missing semicolon)
#include<stdio.h>

int main() {
    int x = 10
    int y = 20;
    return 0;
}`,
  },
  {
    id: 'error_undeclared',
    name: '9. [Error] Undeclared Variable',
    category: 'semantic_error',
    description: 'Semantic check catches identifier used before declaration.',
    code: `// Error test: Undeclared variable
#include<stdio.h>

int main() {
    int x = 10;
    // Variable y is used without declaration!
    y = x + 5;
    return 0;
}`,
  },
  {
    id: 'error_redeclaration',
    name: '10. [Error] Variable Redeclaration',
    category: 'semantic_error',
    description: 'Semantic check catches duplicate identifier in the symbol table.',
    code: `// Error test: Variable redeclaration
#include<stdio.h>

int main() {
    int x = 10;
    int y = 20;
    // Error: x is already declared
    int x = 30;
    return 0;
}`,
  },
  {
    id: 'error_zerodiv',
    name: '11. [Error] Constant Divide by Zero',
    category: 'semantic_error',
    description: 'Optimizer / semantic check catches constant division or modulo by zero.',
    code: `// Error test: Constant division by zero
#include<stdio.h>

int main() {
    int x = 10;
    int y = 0;
    int z;
    // Constant division by zero caught at compile time!
    z = 10 / 0;
    return 0;
}`,
  },
];
