// Error test: Undeclared variable
// This should produce a semantic error

#include<stdio.h>

int main() {
    int x = 10;
    // y is not declared but used
    y = x + 5;
    return 0;
}
