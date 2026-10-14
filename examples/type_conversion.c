// Type conversion test
// Tests automatic type conversions between int, float, and char

#include<stdio.h>

int main() {
    int intVar = 42;
    float floatVar = 3.14;
    char charVar = 65;
    
    // Int to float conversion
    float result1;
    result1 = intVar + floatVar;
    
    // Float to int conversion
    int result2;
    result2 = intVar + floatVar;
    
    // Char to int conversion
    int result3;
    result3 = charVar + intVar;
    
    // Mixed operations
    float result4;
    result4 = intVar + floatVar + charVar;
    
    // Assignment conversions
    int x = 10;
    float y;
    y = x;
    
    float a = 5.5;
    int b;
    b = a;
    
    return 0;
}
