// Loop test
// Tests for loops including nested loops

#include<stdio.h>

int main() {
    int i;
    int j;
    int sum = 0;
    
    // Simple for loop
    for(i=0; i<10; i++) {
        sum = sum + i;
    }
    
    // Nested for loops
    for(i=0; i<5; i++) {
        for(j=0; j<3; j++) {
            sum = sum + 1;
        }
    }
    
    // Loop with conditional
    for(i=0; i<20; i++) {
        if(i > 10) {
            sum = sum + i;
        } else {
            sum = sum - i;
        }
    }
    
    return 1;
}
