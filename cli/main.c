/*
 * C Compiler - Command Line & Interactive Interface
 * A frontend compiler tool for C programs
 * Performs lexical, syntax, semantic analysis and intermediate code generation
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#define VERSION "1.0.0"
#define PROGRAM_NAME "C Compiler"

// External functions and variables from parser
extern int yyparse();
extern FILE* yyin;
extern void print_analysis_results();
extern void reset_compiler_state();
extern void yyrestart(FILE *input_file);
extern int sem_errors;

// Global flags for output control
int show_tokens = 0;
int show_symbols = 1;
int show_parse_tree = 1;
int show_semantic = 1;
int show_ir = 1;
int quiet_mode = 0;
int explorer_mode = 0;
#include "explorer.h"
int build_executable = 0;
int run_after_build = 0;

void print_version() {
    printf("%s\n", PROGRAM_NAME);
    printf("Version %s\n", VERSION);
    printf("Frontend compiler tool for C programs\n");
    printf("\n");
    printf("MIT License - Copyright (c) 2021 Anjaneya Tripathi, Isha Waghulde, Khushali Patel\n");
}

void print_usage() {
    printf("Usage: ccompiler [options] <source-file>\n");
    printf("\n");
    printf("Options:\n");
    printf("  -h, --help              Display this help message\n");
    printf("  -v, --version           Display version information\n");
    printf("  --check                 Verify installation and environment\n");
    printf("\n");
    printf("Execution & Build Options:\n");
    printf("  -r, --run               Analyze, compile, and RUN program immediately (see output)\n");
    printf("  -b, --build             Build runnable executable without executing\n");
    printf("  -o <file>               Specify output file or executable path\n");
    printf("\n");
    printf("Analysis Options (Frontend):\n");
    printf("  --tokens                Show lexical tokens only\n");
    printf("  --symbols               Show symbol table only\n");
    printf("  --parse-tree            Show parse tree only\n");
    printf("  --semantic              Show semantic analysis only\n");
    printf("  --ir                    Show intermediate representation only\n");
    printf("  --explore              Write an offline interactive HTML report (-o report.html)\n");
    printf("  --all                   Show all analysis phases (default)\n");
    printf("  -q, --quiet             Minimal output (errors only)\n");
    printf("\n");
    printf("Examples:\n");
    printf("  ccompiler program.c              Run frontend analysis (Lex/AST/Semantic/IR)\n");
    printf("  ccompiler -r program.c           Analyze, compile, and execute program.c\n");
    printf("  ccompiler --build program.c      Compile into runnable binary (a.out / a.exe)\n");
    printf("  ccompiler -b -o prog prog.c      Compile into specific binary 'prog'\n");
    printf("  ccompiler -o report.txt prog.c   Save compiler analysis report to file\n");
    printf("\n");
}

void print_check_info() {
    printf("%s Installation Check\n", PROGRAM_NAME);
    printf("========================================\n");
    printf("\n");
    printf("Executable:       OK\n");
    printf("Version:          %s\n", VERSION);
    printf("Installation:     OK\n");
    
    // Check if we're in PATH
    #ifdef _WIN32
    char* path = getenv("PATH");
    if (path && strstr(path, "CCompiler")) {
        printf("PATH:             OK (ccompiler is in PATH)\n");
    } else {
        printf("PATH:             WARNING (ccompiler may not be in PATH)\n");
    }
    printf("Platform:         Windows x64\n");
    #else
    printf("Platform:         %s\n", "Unix/Linux");
    #endif
    
    printf("\n");
    printf("Status:           Ready\n");
    printf("\n");
}

int file_exists(const char* filename) {
    struct stat buffer;
    return (stat(filename, &buffer) == 0);
}

#ifdef _WIN32
#include <windows.h>
#include <process.h>
#else
#include <unistd.h>
#include <sys/wait.h>
#include <errno.h>
#endif

/* Pass literal arguments directly; paths never pass through a command shell. */
static int run_process(const char *program, const char *const args[]) {
    fflush(NULL);
#ifdef _WIN32
    /* MSVCRT spawn joins argv into a command line; quote every argument. */
    const char *quoted[16];
    int n = 0;
    while (args[n] && n < 15) {
        size_t len = strlen(args[n]);
        char *q = malloc(len * 2 + 3), *dst = q;
        if (!q) { while (n) free((void *)quoted[--n]); return 127; }
        *dst++ = '"';
        const char *src = args[n];
        while (*src) {
            size_t slashes = 0;
            while (*src == '\\') { ++slashes; ++src; }
            size_t copies = (*src == '"' || !*src) ? slashes * 2 : slashes;
            while (copies--) *dst++ = '\\';
            if (*src == '"') *dst++ = '\\';
            if (*src) *dst++ = *src++;
        }
        *dst++ = '"'; *dst = 0;
        quoted[n++] = q;
    }
    quoted[n] = NULL;
    intptr_t status = _spawnvp(_P_WAIT, program, quoted);
    while (n) free((void *)quoted[--n]);
    return status == -1 ? 127 : (int)status;
#else
    pid_t pid = fork();
    if (pid < 0) return 127;
    if (pid == 0) {
        execvp(program, (char *const *)args);
        perror(program);
        _exit(127);
    }
    int status;
    while (waitpid(pid, &status, 0) < 0) {
        if (errno != EINTR) return 127;
    }
    return WIFEXITED(status) ? WEXITSTATUS(status) : 128 + WTERMSIG(status);
#endif
}
static int run_backend_compiler(const char *backend, const char *target, const char *input) {
    const char *args[] = {backend, "-o", target, input, NULL};
    return run_process(backend, args);
}
static int run_binary(const char *target) {
#ifdef _WIN32
    char *resolved = _fullpath(NULL, target, 0);
#else
    char *resolved = realpath(target, NULL);
#endif
    if (!resolved) return 127;
    const char *args[] = {resolved, NULL};
    int status = run_process(resolved, args);
    free(resolved);
    return status;
}

const char* find_c_backend() {
    #ifdef _WIN32
    if (system("gcc --version >nul 2>&1") == 0) return "gcc";
    if (system("clang --version >nul 2>&1") == 0) return "clang";
    // Check bundled / shared w64devkit paths without extra internal quotes
    if (file_exists("w64devkit\\bin\\gcc.exe")) return "w64devkit\\bin\\gcc.exe";
    if (file_exists("..\\w64devkit\\bin\\gcc.exe")) return "..\\w64devkit\\bin\\gcc.exe";
    if (file_exists("..\\..\\w64devkit\\bin\\gcc.exe")) return "..\\..\\w64devkit\\bin\\gcc.exe";
    if (file_exists("C:\\Users\\human\\Desktop\\Shared\\Compiler\\w64devkit\\bin\\gcc.exe")) 
        return "C:\\Users\\human\\Desktop\\Shared\\Compiler\\w64devkit\\bin\\gcc.exe";
    if (file_exists("C:\\w64devkit\\bin\\gcc.exe")) return "C:\\w64devkit\\bin\\gcc.exe";
    if (file_exists("C:\\msys64\\ucrt64\\bin\\gcc.exe")) return "C:\\msys64\\ucrt64\\bin\\gcc.exe";
    if (file_exists("C:\\msys64\\mingw64\\bin\\gcc.exe")) return "C:\\msys64\\mingw64\\bin\\gcc.exe";
    if (file_exists("C:\\MinGW\\bin\\gcc.exe")) return "C:\\MinGW\\bin\\gcc.exe";
    return NULL;
    #else
    if (system("gcc --version >/dev/null 2>&1") == 0) return "gcc";
    if (system("clang --version >/dev/null 2>&1") == 0) return "clang";
    return NULL;
    #endif
}

int analyze_file(const char* input_file, const char* output_file) {
    if (!file_exists(input_file)) {
        fprintf(stderr, "Error: Input file '%s' not found\n", input_file);
        return 1;
    }
    
    // Reset all parser, lexer, symbol table, and IR state
    reset_compiler_state();
    
    yyin = fopen(input_file, "r");
    if (yyin == NULL) {
        fprintf(stderr, "Error: Cannot open file '%s'\n", input_file);
        return 1;
    }
    
    // Reset Flex lexer buffer
    yyrestart(yyin);
    
    // Redirect output if specified (and not in build/run mode where -o is target binary)
    if (output_file != NULL && !build_executable && !run_after_build && !explorer_mode) {
        if (freopen(output_file, "w", stdout) == NULL) {
            fprintf(stderr, "Error: Cannot create output file '%s'\n", output_file);
            fclose(yyin);
            return 1;
        }
    }
    
    // Print header unless in quiet mode
    if (!quiet_mode) {
        printf("\n");
        printf("================================================================================\n");
        printf("  %s v%s - Frontend C Compiler\n", PROGRAM_NAME, VERSION);
        printf("================================================================================\n");
        printf("\n");
        printf("Analyzing: %s\n", input_file);
        printf("\n");
    }
    
    // Run the parser
    int parse_result = yyparse();
    
    // Close input file
    fclose(yyin);
    
    // Print results if parsing was successful
    if (parse_result == 0) {
        print_analysis_results();
    }
    
    // Close output file if redirected
    if (output_file != NULL && !build_executable && !run_after_build && !explorer_mode) {
        fflush(stdout);
        if (parse_result == 0) {
            fprintf(stderr, "\nAnalysis complete. Output written to: %s\n", output_file);
        } else {
            fprintf(stderr, "\nAnalysis failed. Partial output written to: %s\n", output_file);
        }
    }
    
    if (explorer_mode) {
        const char *report = output_file ? output_file : "compiler-explorer.html";
        if (write_explorer(input_file, report, parse_result)) {
            fprintf(stderr, "Error: Cannot write explorer report '%s'\n", report);
            return 1;
        }
        if (!quiet_mode) printf("Explorer report: %s\n", report);
    }

    // Return status
    if (parse_result != 0) {
        if (!quiet_mode) {
            fprintf(stderr, "\nAnalysis failed with syntax errors.\n");
        }
        return 1;
    }
    
    if (sem_errors > 0) {
        if (quiet_mode) for (int i = 0; i < sem_errors; ++i) fputs(errors[i], stderr);
        if (!quiet_mode) {
            fprintf(stderr, "\nAnalysis failed with %d semantic error(s).\n", sem_errors);
        }
        return 1;
    }
    
    if (!quiet_mode && output_file == NULL) {
        printf("=========================================================================================\n");
        printf("  Frontend Analysis completed successfully (0 Errors)\n");
        printf("=========================================================================================\n");
        printf("\n");
    }
    
    if (explorer_mode) return 0;

    // Native code is built and executed only when explicitly requested.
    int should_execute = run_after_build;
    if (build_executable || should_execute) {
        char target_bin[512];
        if (output_file != NULL) {
            strncpy(target_bin, output_file, sizeof(target_bin) - 1);
            target_bin[sizeof(target_bin) - 1] = '\0';
        } else {
            #ifdef _WIN32
            strncpy(target_bin, should_execute ? "temp_run.exe" : "a.exe", sizeof(target_bin));
            #else
            strncpy(target_bin, should_execute ? "temp_run.out" : "a.out", sizeof(target_bin));
            #endif
        }
        
        const char* backend = find_c_backend();
        if (backend != NULL) {
            int res = run_backend_compiler(backend, target_bin, input_file);
            if (res == 0) {
                if (build_executable && !should_execute) {
                    printf("[SUCCESS] Executable binary created: %s\n\n", target_bin);
                }
                
                if (should_execute) {
                    printf("=========================================================================================\n");
                    printf("  PHASE 5: PROGRAM RUNTIME EXECUTION OUTPUT\n");
                    printf("=========================================================================================\n");
                    fflush(stdout);
                    
                    int run_res = run_binary(target_bin);

                    printf("\n=========================================================================================\n");
                    printf("  Program execution finished (exit code: %d)\n", run_res);
                    printf("=========================================================================================\n\n");
                    return run_res;
                }
            } else {
                fprintf(stderr, "\n[NOTE] Backend compiler (\"%s\") returned exit code %d.\n", backend, res);
                fprintf(stderr, "       Your code passed frontend analysis but could not be compiled to an executable.\n");
                return res;
            }
        } else {
            if (build_executable || should_execute) {
                fprintf(stderr, "\n[WARNING] No C backend compiler (gcc/clang) found on this system.\n");
                fprintf(stderr, "          Frontend analysis completed, but execution/build requires GCC.\n");
                fprintf(stderr, "          Install options:\n");
                fprintf(stderr, "            - MSYS2: pacman -S mingw-w64-ucrt-x86_64-gcc\n");
                fprintf(stderr, "            - Or install w64devkit / MinGW-w64 and add to PATH\n");
                fprintf(stderr, "            - Checked: gcc, clang, C:\\msys64\\ucrt64\\bin\\gcc.exe, C:\\msys64\\mingw64\\bin\\gcc.exe, C:\\MinGW\\bin\\gcc.exe\n");
            }
            return 127;
        }
    }
    
    return 0;
}

static void pause_console() {
    printf("\nPress Enter to return to menu...");
    fflush(stdout);
    char buf[256];
    if (fgets(buf, sizeof(buf), stdin) == NULL) {
        // EOF
    }
}

void interactive_mode() {
    char line[1024];
    
    printf("\n");
    printf("================================================================================\n");
    printf("  %s v%s - Interactive Console\n", PROGRAM_NAME, VERSION);
    printf("  Frontend C Compiler Toolchain\n");
    printf("================================================================================\n");
    printf("\n");
    printf("This is a compiler tool for C programs.\n");
    printf("You can analyze files directly from this console or compile & run them.\n");
    
    while (1) {
        printf("\n");
        printf("--------------------------------------------------------------------------------\n");
        printf("  [1] Analyze a C source file (Symbol Table, AST, Semantics, IR)\n");
        printf("  [2] Analyze sample file (examples/simple.c)\n");
        printf("  [3] Build & RUN C program immediately (See program output)\n");
        printf("  [4] Build C file to executable binary without running\n");
        printf("  [5] Show compiler options and help\n");
        printf("  [6] Exit\n");
        printf("--------------------------------------------------------------------------------\n");
        printf("Enter choice (1-6): ");
        fflush(stdout);
        
        if (!fgets(line, sizeof(line), stdin)) {
            break;
        }
        
        // Trim whitespace
        char* p = line;
        while (*p == ' ' || *p == '\t' || *p == '\r' || *p == '\n') p++;
        
        if (*p == '\0') {
            continue;
        }
        
        if (*p == '1') {
            printf("\nEnter path to .c file (or drag & drop file into this window): ");
            fflush(stdout);
            if (fgets(line, sizeof(line), stdin)) {
                size_t len = strlen(line);
                while (len > 0 && (line[len-1] == '\n' || line[len-1] == '\r' || line[len-1] == ' ' || line[len-1] == '\"')) {
                    line[--len] = '\0';
                }
                char* clean_path = line;
                while (*clean_path == ' ' || *clean_path == '\"') clean_path++;
                
                if (strlen(clean_path) > 0) {
                    build_executable = 0;
                    run_after_build = 0;
                    analyze_file(clean_path, NULL);
                } else {
                    printf("No file path entered.\n");
                }
            }
            pause_console();
        }
        else if (*p == '2') {
            const char* candidates[] = {
                "examples/simple.c",
                "../examples/simple.c",
                "simple.c"
            };
            const char* found = NULL;
            for (int i = 0; i < 3; i++) {
                if (file_exists(candidates[i])) {
                    found = candidates[i];
                    break;
                }
            }
            
            if (found != NULL) {
                build_executable = 0;
                run_after_build = 0;
                analyze_file(found, NULL);
            } else {
                printf("\nSample 'simple.c' not found in current directory.\n");
                printf("Please enter the path to your .c file using option 1.\n");
            }
            pause_console();
        }
        else if (*p == '3') {
            printf("\nEnter path to .c file to BUILD & RUN: ");
            fflush(stdout);
            if (fgets(line, sizeof(line), stdin)) {
                size_t len = strlen(line);
                while (len > 0 && (line[len-1] == '\n' || line[len-1] == '\r' || line[len-1] == ' ' || line[len-1] == '\"')) {
                    line[--len] = '\0';
                }
                char* clean_path = line;
                while (*clean_path == ' ' || *clean_path == '\"') clean_path++;
                
                if (strlen(clean_path) > 0) {
                    build_executable = 1;
                    run_after_build = 1;
                    analyze_file(clean_path, NULL);
                    build_executable = 0;
                    run_after_build = 0;
                }
            }
            pause_console();
        }
        else if (*p == '4') {
            printf("\nEnter path to .c file to BUILD into executable binary: ");
            fflush(stdout);
            if (fgets(line, sizeof(line), stdin)) {
                size_t len = strlen(line);
                while (len > 0 && (line[len-1] == '\n' || line[len-1] == '\r' || line[len-1] == ' ' || line[len-1] == '\"')) {
                    line[--len] = '\0';
                }
                char* clean_path = line;
                while (*clean_path == ' ' || *clean_path == '\"') clean_path++;
                
                if (strlen(clean_path) > 0) {
                    build_executable = 1;
                    run_after_build = 0;
                    analyze_file(clean_path, NULL);
                    build_executable = 0;
                    run_after_build = 0;
                }
            }
            pause_console();
        }
        else if (*p == '5') {
            print_usage();
            pause_console();
        }
        else if (*p == '6' || *p == 'q' || *p == 'Q') {
            printf("\nExiting C Compiler. Have a great day!\n");
            break;
        }
        else {
            printf("Invalid option '%s'. Please enter 1, 2, 3, 4, 5, or 6.\n", p);
            pause_console();
        }
    }
}

int main(int argc, char* argv[]) {
    char* input_file = NULL;
    char* output_file = NULL;
    
    // If no arguments were given (e.g. user double-clicked .exe in Windows Explorer),
    // launch interactive mode so the console stays open and interactive!
    if (argc == 1) {
        interactive_mode();
        return 0;
    }
    
    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage();
            return 0;
        }
        else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--version") == 0) {
            print_version();
            return 0;
        }
        else if (strcmp(argv[i], "--check") == 0) {
            print_check_info();
            return 0;
        }
        else if (strcmp(argv[i], "-r") == 0 || strcmp(argv[i], "--run") == 0) {
            build_executable = 1;
            run_after_build = 1;
        }
        else if (strcmp(argv[i], "-b") == 0 || strcmp(argv[i], "--build") == 0) {
            build_executable = 1;
        }
        else if (strcmp(argv[i], "--explore") == 0) {
            explorer_mode = 1;
        }
        else if (strcmp(argv[i], "--tokens") == 0) {
            show_tokens = 1;
            show_symbols = 0;
            show_parse_tree = 0;
            show_semantic = 0;
            show_ir = 0;
        }
        else if (strcmp(argv[i], "--symbols") == 0) {
            show_symbols = 1;
            show_tokens = 0;
            show_parse_tree = 0;
            show_semantic = 0;
            show_ir = 0;
        }
        else if (strcmp(argv[i], "--parse-tree") == 0) {
            show_parse_tree = 1;
            show_tokens = 0;
            show_symbols = 0;
            show_semantic = 0;
            show_ir = 0;
        }
        else if (strcmp(argv[i], "--semantic") == 0) {
            show_semantic = 1;
            show_tokens = 0;
            show_symbols = 0;
            show_parse_tree = 0;
            show_ir = 0;
        }
        else if (strcmp(argv[i], "--ir") == 0) {
            show_ir = 1;
            show_tokens = 0;
            show_symbols = 0;
            show_parse_tree = 0;
            show_semantic = 0;
        }
        else if (strcmp(argv[i], "--all") == 0) {
            show_tokens = 1;
            show_symbols = 1;
            show_parse_tree = 1;
            show_semantic = 1;
            show_ir = 1;
        }
        else if (strcmp(argv[i], "-q") == 0 || strcmp(argv[i], "--quiet") == 0) {
            quiet_mode = 1;
        }
        else if (strcmp(argv[i], "-o") == 0) {
            if (i + 1 < argc) {
                output_file = argv[++i];
            } else {
                fprintf(stderr, "Error: -o option requires an output filename\n");
                return 1;
            }
        }
        else if (argv[i][0] == '-') {
            fprintf(stderr, "Error: Unknown option '%s'\n", argv[i]);
            fprintf(stderr, "Use 'ccompiler --help' for usage information\n");
            return 1;
        }
        else {
            if (input_file) {
                fprintf(stderr, "Error: Only one source file is supported\n");
                return 1;
            }
            input_file = argv[i];
        }
    }
    
    // Check if input file was provided
    if (input_file == NULL) {
        fprintf(stderr, "Error: No input file specified\n");
        fprintf(stderr, "Use 'ccompiler --help' for usage information\n");
        return 1;
    }
    
    if (explorer_mode && build_executable) {
        fprintf(stderr, "Error: --explore cannot be combined with --build or --run\n");
        return 1;
    }
    if (explorer_mode && !output_file) output_file = "compiler-explorer.html";
    if (output_file) {
#ifdef _WIN32
        char *input_path = _fullpath(NULL, input_file, 0);
        char *output_path = _fullpath(NULL, output_file, 0);
        int same = input_path && output_path && _stricmp(input_path, output_path) == 0;
#else
        struct stat source_stat, target_stat;
        int same = stat(input_file, &source_stat) == 0 && stat(output_file, &target_stat) == 0 &&
                   source_stat.st_dev == target_stat.st_dev && source_stat.st_ino == target_stat.st_ino;
#endif
#ifdef _WIN32
        free(input_path); free(output_path);
#endif
        if (same) {
            fprintf(stderr, "Error: Output must not overwrite the source file\n");
            return 1;
        }
    }
    return analyze_file(input_file, output_file);
}
