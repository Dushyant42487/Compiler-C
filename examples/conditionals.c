// Conditional statements test
// Tests if-else statements with various conditions

#include<stdio.h>

int main() {
    int x = 15;
    int y = 20;
    int z = 10;
    
    // Simple if-else
    if(x > 10) {
        y = 100;
    } else {
        y = 50;
    }
    
    // Nested if-else
    if(x > 5) {
        if(y > 50) {
            z = 999;
        } else {
            z = 111;
        }
    } else {
        z = 0;
    }
    
    // Multiple conditions
    if(x < y) {
        z = x + y;
    } else {
        z = x - y;
    }
    
    return 0;
}
