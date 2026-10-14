#include <stdio.h>

int main() {
    // Variable declaration
    double num1, num2;
    double sum, difference, product, quotient;
    int remainder, int_num1, int_num2;

    // User input
    printf("Enter two numbers: ");
    if (scanf("%lf %lf", &num1, &num2) != 2) {
        printf("Error: Invalid numeric input.\n");
        return 1;
    }

    // Basic arithmetic operations
    sum = num1 + num2;
    difference = num1 - num2;
    product = num1 * num2;

    // Output basic operations
    printf("\n--- Arithmetic Results ---\n");
    printf("Addition (%.2f + %.2f)       = %.2f\n", num1, num2, sum);
    printf("Subtraction (%.2f - %.2f)    = %.2f\n", num1, num2, difference);
    printf("Multiplication (%.2f * %.2f) = %.2f\n", num1, num2, product);

    // Division check for zero
    if (num2 != 0) {
        quotient = num1 / num2;
        printf("Division (%.2f / %.2f)       = %.2f\n", num1, num2, quotient);
    } else {
        printf("Division: Error! Cannot divide by zero.\n");
    }

    // Modulus requires integer types
    int_num1 = (int)num1;
    int_num2 = (int)num2;

    if (int_num2 != 0) {
        remainder = int_num1 % int_num2;
        printf("Modulus (%d %% %d)            = %d (using integer parts)\n", int_num1, int_num2, remainder);
    } else {
        printf("Modulus: Error! Cannot divide by zero.\n");
    }

    return 0;
}

