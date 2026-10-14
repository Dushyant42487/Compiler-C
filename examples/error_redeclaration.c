// Error test: Variable redeclaration
// This should produce a semantic error

#include<stdio.h>

int main() {
    int x = 10;
    int y = 20;
    // Error: x is already declared
    int x = 30;
    return 0;
}
