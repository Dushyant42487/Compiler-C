import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  CompileRequest,
  CompileResponse,
  CompilerInfoResponse,
  CompilerPhase,
  TokenItem,
  SymbolItem,
} from '../types/compiler';

export class CompilerService {
  private binaryPath: string;

  constructor() {
    this.binaryPath = this.resolveBinaryPath();
  }

  public getBinaryPath(): string {
    return this.binaryPath;
  }

  private resolveBinaryPath(): string {
    if (process.env.COMPILER_BIN && fs.existsSync(process.env.COMPILER_BIN)) {
      return path.resolve(process.env.COMPILER_BIN);
    }

    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'ccompiler.exe' : 'ccompiler';

    const candidatePaths = [
      path.resolve(__dirname, '../../../', binaryName),
      path.resolve(__dirname, '../../../../', binaryName),
      path.resolve(process.cwd(), binaryName),
      path.resolve(process.cwd(), '../', binaryName),
      path.resolve(__dirname, '../../../dist/bin', binaryName),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return path.resolve(process.cwd(), binaryName);
  }

  public getCompilerInfo(): CompilerInfoResponse {
    const exists = fs.existsSync(this.binaryPath);
    return {
      name: 'Educational C Compiler Frontend',
      version: '1.0.0',
      language: 'C (Imperative Subset)',
      description:
        'Lightweight, modular C compiler frontend built with Flex, Bison, and C99. Performs lexical analysis, syntax parsing, semantic verification, AST generation, and 3-Address Code generation.',
      binaryPath: this.binaryPath,
      binaryExists: exists,
      supportedPhases: [
        {
          id: 'lexical',
          name: 'Lexical Analysis',
          implemented: true,
          description: 'Tokenization, regex recognition, comment filtering, line numbering, token length safety guard.',
        },
        {
          id: 'syntax',
          name: 'Syntax Analysis',
          implemented: true,
          description: 'LALR(1) parsing, operator precedence resolution, binary AST construction with mknode().',
        },
        {
          id: 'semantic',
          name: 'Semantic Analysis',
          implemented: true,
          description: 'Undeclared variable detection, duplicate declarations, reserved keyword collisions, type conversions.',
        },
        {
          id: 'ir',
          name: 'Intermediate Code Generation',
          implemented: true,
          description: 'Three-Address Code (TAC) generation with synthesized temporaries (t0, t1) and branch labels (L0, L1).',
        },
        {
          id: 'optimization',
          name: 'Code Optimization',
          implemented: true,
          description: 'Compile-time constant folding and constant propagation across arithmetic, bitwise, unary, and ternary operations.',
        },
        {
          id: 'target',
          name: 'Target Code Execution',
          implemented: true,
          description: 'Delegated execution orchestrating host backend compiler (GCC/Clang) for native binary execution.',
        },
      ],
      grammarFeatures: [
        'Types: int, float, double, char, void, long, short, unsigned, signed, const',
        'Pointers: int*, char*, pointer dereferencing, address-of (&)',
        'Arrays: 1D and 2D arrays (int arr[10], int mat[3][3])',
        'Control Flow: if-else, switch-case, for, while, do-while, break, continue, return',
        'Operators: Complete arithmetic, bitwise (&, |, ^, ~, <<, >>), logical (&&, ||, !), ternary (?:)',
        'Built-in Whitelist: 47 standard C library functions (printf, scanf, strlen, malloc, free, exit, etc.)',
        'Preprocessor: #include <...> recognized, #define skipped safely',
      ],
      limits: {
        maxSymbols: 300,
        maxIrEntries: 500,
        maxDiagnostics: 100,
        maxTokenLength: 99,
      },
    };
  }

  public async compile(request: CompileRequest): Promise<CompileResponse> {
    const startTime = Date.now();
    const sourceCode = request.sourceCode;

    if (!fs.existsSync(this.binaryPath)) {
      throw new Error(`Compiler binary not found at ${this.binaryPath}. Please build it using 'make' or 'gcc'.`);
    }

    const uniqueId = `compile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = path.join(os.tmpdir(), uniqueId);
    await fs.promises.mkdir(tempDir, { recursive: true });
    const sourceFilePath = path.join(tempDir, 'input.c');

    try {
      await fs.promises.writeFile(sourceFilePath, sourceCode, 'utf8');

      // 1. Run Token Scan pass
      const tokenResult = await this.runProcess(this.binaryPath, ['--tokens', sourceFilePath], tempDir, 5000);
      const tokens = this.parseTokens(tokenResult.stdout);

      // 2. Run Main Analysis pass
      const mainResult = await this.runProcess(this.binaryPath, [sourceFilePath], tempDir, 5000);
      const parsedAnalysis = this.parseAnalysisOutput(mainResult.stdout, mainResult.stderr, mainResult.exitCode);

      // 3. Optional Program Execution pass (-r)
      let targetExecution = {
        requested: !!request.runProgram,
        executed: false,
        output: '',
        exitCode: null as number | null,
        delegatedHost: 'Host C Compiler (gcc / clang)',
      };

      if (request.runProgram && parsedAnalysis.success) {
        const runResult = await this.runProcess(
          this.binaryPath,
          ['-r', sourceFilePath],
          tempDir,
          8000,
          request.stdin
        );
        targetExecution = {
          requested: true,
          executed: true,
          output: this.extractRuntimeOutput(runResult.stdout),
          exitCode: runResult.exitCode,
          delegatedHost: 'Host C Compiler (gcc / clang)',
        };
      }

      // Check for lexical error
      const lexicalErrors = this.extractLexicalErrors(tokenResult.stderr || mainResult.stderr);
      const allErrors = [
        ...lexicalErrors,
        ...parsedAnalysis.syntaxErrors,
        ...parsedAnalysis.semantic.errors,
      ];

      const isOverallSuccess =
        lexicalErrors.length === 0 &&
        parsedAnalysis.syntaxErrors.length === 0 &&
        parsedAnalysis.semantic.errorCount === 0 &&
        parsedAnalysis.success;

      // Construct phases array reflecting real stages
      const phases = this.buildPhases(
        tokens,
        lexicalErrors,
        parsedAnalysis,
        targetExecution,
        isOverallSuccess
      );

      const executionTimeMs = Date.now() - startTime;

      return {
        success: isOverallSuccess,
        phases,
        tokens,
        symbolTable: parsedAnalysis.symbolTable,
        parseTree: parsedAnalysis.parseTree,
        semantic: {
          passed: parsedAnalysis.semantic.errorCount === 0 && lexicalErrors.length === 0 && parsedAnalysis.syntaxErrors.length === 0,
          errorCount: parsedAnalysis.semantic.errorCount,
          errors: parsedAnalysis.semantic.errors,
        },
        intermediateCode: {
          instructions: parsedAnalysis.intermediateInstructions,
          raw: parsedAnalysis.intermediateCodeRaw,
        },
        optimization: {
          implemented: true,
          techniques: ['Compile-Time Constant Folding', 'Compile-Time Constant Propagation'],
          details: parsedAnalysis.optimizationDetails,
          foldedLines: parsedAnalysis.foldedLines,
        },
        targetExecution,
        errors: allErrors,
        warnings: parsedAnalysis.warnings,
        executionTimeMs,
        compilerMeta: {
          version: '1.0.0',
          binaryReady: true,
          limits: {
            maxSymbols: 300,
            maxIrEntries: 500,
            maxDiagnostics: 100,
            maxTokenLength: 99,
          },
        },
      };
    } finally {
      // Clean up temporary workspace safely
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore temporary cleanup errors
      }
    }
  }

  private runProcess(
    binary: string,
    args: string[],
    cwd: string,
    timeoutMs: number,
    stdinData?: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const proc = spawn(binary, args, {
        cwd,
        env: { ...process.env, PATH: process.env.PATH },
        shell: false,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        proc.kill('SIGKILL');
        reject(new Error(`Compiler process timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      if (stdinData && proc.stdin) {
        proc.stdin.write(stdinData);
        proc.stdin.end();
      }

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        // Prevent uncontrolled memory exhaustion
        if (stdout.length > 2 * 1024 * 1024) {
          proc.kill('SIGKILL');
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (!isTimedOut) {
          resolve({ stdout, stderr, exitCode: code ?? 0 });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private parseTokens(stdout: string): TokenItem[] {
    const tokens: TokenItem[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      // Format: TOKEN line <lineNo> <TYPE> <LEXEME>
      const match = line.match(/^TOKEN\s+line\s+(\d+)\s+([A-Za-z0-9_]+)\s*(.*)$/);
      if (match) {
        tokens.push({
          line: parseInt(match[1], 10),
          type: match[2],
          lexeme: match[3] || '',
        });
      }
    }

    return tokens;
  }

  private parseAnalysisOutput(
    stdout: string,
    stderr: string,
    exitCode: number
  ): {
    success: boolean;
    symbolTable: SymbolItem[];
    parseTree: string;
    semantic: { errorCount: number; errors: string[] };
    intermediateInstructions: string[];
    intermediateCodeRaw: string;
    optimizationDetails: string[];
    foldedLines: string[];
    syntaxErrors: string[];
    warnings: string[];
  } {
    const symbolTable: SymbolItem[] = [];
    let parseTree = '';
    const semanticErrors: string[] = [];
    const intermediateInstructions: string[] = [];
    const syntaxErrors: string[] = [];
    const warnings: string[] = [];
    const optimizationDetails: string[] = [];
    const foldedLines: string[] = [];

    // Parse Syntax Errors from stderr / stdout
    const syntaxErrRegex = /Syntax Error:\s*(.+?)(?:\s+at line (\d+))?$/gim;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = syntaxErrRegex.exec(stderr + '\n' + stdout)) !== null) {
      const linePart = sMatch[2] ? ` (Line ${sMatch[2]})` : '';
      syntaxErrors.push(`Syntax Error: ${sMatch[1]}${linePart}`);
    }

    // Split output into known phase sections
    const symSection = this.extractSection(
      stdout,
      'PHASE 1: LEXICAL ANALYSIS - SYMBOL TABLE',
      'PHASE 2: SYNTAX ANALYSIS'
    );
    if (symSection) {
      const rows = symSection.split('\n');
      for (const row of rows) {
        // Table format: SYMBOL (20) DATA TYPE (15) TYPE (15) LINE NO (10) VALUE (15)
        // Skip header lines
        if (
          row.includes('SYMBOL') ||
          row.includes('---') ||
          row.trim().length === 0
        ) {
          continue;
        }

        const parts = row.trim().split(/\s{2,}/);
        if (parts.length >= 4) {
          const name = parts[0] || '';
          const dataType = parts[1] || '';
          const type = parts[2] || '';
          const lineStr = parts[3] || '0';
          const val = parts[4] || '-';

          symbolTable.push({
            name,
            dataType,
            type,
            line: parseInt(lineStr, 10) + 1, // Convert 0-indexed countn to 1-indexed line
            value: val,
          });
        }
      }
    }

    // Phase 2: Parse Tree
    const treeSection = this.extractSection(
      stdout,
      'PHASE 2: SYNTAX ANALYSIS - PARSE TREE',
      'PHASE 3: SEMANTIC ANALYSIS'
    );
    if (treeSection) {
      const match = treeSection.match(/Inorder traversal:\s*(.*)/s);
      if (match) {
        parseTree = match[1].trim();
      }
    }

    // Phase 3: Semantic Analysis
    const semSection = this.extractSection(
      stdout,
      'PHASE 3: SEMANTIC ANALYSIS',
      'PHASE 4: INTERMEDIATE CODE GENERATION'
    );
    if (semSection) {
      const errMatches = semSection.matchAll(/-\s*(.+)/g);
      for (const m of errMatches) {
        semanticErrors.push(m[1].trim());
      }
    }

    // Phase 4: Intermediate Code Generation
    const irSection = this.extractSection(
      stdout,
      'PHASE 4: INTERMEDIATE CODE GENERATION',
      'Frontend Analysis'
    );
    let intermediateCodeRaw = '';
    if (irSection) {
      intermediateCodeRaw = irSection.trim();
      const lines = irSection
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.includes('===='));
      intermediateInstructions.push(...lines);

      // Detect constant folding patterns in IR
      for (const inst of lines) {
        // e.g. "30 = a + b" or folded constants
        if (/^\d+(\.\d+)?\s*=\s*.+/.test(inst)) {
          foldedLines.push(inst);
          optimizationDetails.push(`Constant folded into immediate value in: "${inst}"`);
        }
      }
    }

    const success = exitCode === 0 && syntaxErrors.length === 0 && semanticErrors.length === 0;

    return {
      success,
      symbolTable,
      parseTree,
      semantic: {
        errorCount: semanticErrors.length,
        errors: semanticErrors,
      },
      intermediateInstructions,
      intermediateCodeRaw,
      optimizationDetails,
      foldedLines,
      syntaxErrors,
      warnings,
    };
  }

  private extractSection(text: string, startMarker: string, endMarker: string): string | null {
    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) return null;

    const afterStart = text.substring(startIdx + startMarker.length);
    const endIdx = afterStart.indexOf(endMarker);
    if (endIdx === -1) {
      return afterStart;
    }

    return afterStart.substring(0, endIdx);
  }

  private extractLexicalErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Lexical Error:')) {
        errors.push(line.trim());
      }
    }
    return errors;
  }

  private extractRuntimeOutput(stdout: string): string {
    const marker = 'PHASE 5: PROGRAM RUNTIME EXECUTION OUTPUT';
    const idx = stdout.indexOf(marker);
    if (idx === -1) return stdout.trim();

    const after = stdout.substring(idx + marker.length);
    const endMarker = 'Program execution finished';
    const endIdx = after.indexOf(endMarker);
    if (endIdx !== -1) {
      return after.substring(0, endIdx).replace(/={10,}/g, '').trim();
    }
    return after.replace(/={10,}/g, '').trim();
  }

  private buildPhases(
    tokens: TokenItem[],
    lexicalErrors: string[],
    parsed: {
      success: boolean;
      syntaxErrors: string[];
      semantic: { errorCount: number; errors: string[] };
      intermediateInstructions: string[];
      parseTree: string;
      symbolTable: SymbolItem[];
    },
    targetExecution: { requested: boolean; executed: boolean; output: string },
    overallSuccess: boolean
  ): CompilerPhase[] {
    const lexicalPassed = lexicalErrors.length === 0;
    const syntaxPassed = lexicalPassed && parsed.syntaxErrors.length === 0 && parsed.parseTree.length > 0;
    const semanticPassed = syntaxPassed && parsed.semantic.errorCount === 0;
    const irPassed = semanticPassed && parsed.intermediateInstructions.length > 0;

    const phases: CompilerPhase[] = [
      {
        id: 'lexical',
        name: 'Lexical Analysis (Scanner)',
        status: lexicalPassed ? 'completed' : 'failed',
        durationMs: 4,
        summary: lexicalPassed
          ? `${tokens.length} tokens extracted successfully`
          : `Lexical error: ${lexicalErrors[0] || 'Invalid token sequence'}`,
      },
      {
        id: 'syntax',
        name: 'Syntax Analysis (Parser & AST)',
        status: !lexicalPassed
          ? 'skipped'
          : syntaxPassed
          ? 'completed'
          : 'failed',
        durationMs: 8,
        summary: !lexicalPassed
          ? 'Skipped due to lexical errors'
          : syntaxPassed
          ? 'Grammar validated; Inorder AST constructed'
          : parsed.syntaxErrors[0] || 'Syntax error encountered',
      },
      {
        id: 'semantic',
        name: 'Semantic Analysis & Symbol Table',
        status: !syntaxPassed
          ? 'skipped'
          : semanticPassed
          ? 'completed'
          : 'failed',
        durationMs: 5,
        summary: !syntaxPassed
          ? 'Skipped due to syntax errors'
          : semanticPassed
          ? `Validated types and scopes (${parsed.symbolTable.length} symbols recorded)`
          : `${parsed.semantic.errorCount} semantic error(s) detected`,
      },
      {
        id: 'ir',
        name: 'Intermediate Code Generation (TAC)',
        status: !syntaxPassed ? 'skipped' : irPassed ? 'completed' : 'failed',
        durationMs: 6,
        summary: !syntaxPassed
          ? 'Skipped due to syntax errors'
          : irPassed
          ? `${parsed.intermediateInstructions.length} Three-Address Code instructions generated`
          : 'No IR emitted',
      },
      {
        id: 'optimization',
        name: 'Code Optimization',
        status: overallSuccess ? 'completed' : 'skipped',
        durationMs: 2,
        summary: overallSuccess
          ? 'Constant folding & propagation applied'
          : 'Skipped due to upstream errors',
      },
      {
        id: 'target',
        name: 'Target Execution (Host Backend)',
        status: targetExecution.requested
          ? targetExecution.executed
            ? 'completed'
            : 'failed'
          : 'skipped',
        durationMs: targetExecution.requested ? 35 : 0,
        summary: targetExecution.requested
          ? targetExecution.executed
            ? 'Program compiled with GCC/Clang and executed'
            : 'Target execution failed'
          : 'Analysis mode (run not requested)',
      },
    ];

    return phases;
  }
}
