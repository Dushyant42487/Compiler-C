#include <stdio.h>
#include <string.h> // Required for strlen()

int main() {
    char word[] = "Programming";
    
    // strlen() calculates the length of the string
    int length = strlen(word);
    
    printf("The word '%s' has %d letters.\n", word, length);
    
    return 0;
}
