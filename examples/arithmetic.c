// Arithmetic operations test
// Tests all basic arithmetic operators and type conversions

#include<stdio.h>

int main() {
    int a = 10;
    int b = 20;
    int sum;
    int diff;
    int prod;
    int quot;
    
    // Basic arithmetic
    sum = a + b;
    diff = b - a;
    prod = a * b;
    quot = b / a;
    
    // Float operations
    float x = 5.5;
    float y = 2.5;
    float result;
    
    result = x + y;
    result = x - y;
    result = x * y;
    result = x / y;
    
    return 1;
}
