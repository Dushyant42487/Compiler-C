export type PhaseStatus = 'completed' | 'failed' | 'skipped' | 'running';

export interface CompilerPhase {
  id: 'lexical' | 'syntax' | 'semantic' | 'ir' | 'optimization' | 'target';
  name: string;
  status: PhaseStatus;
  durationMs: number;
  summary: string;
  details?: string;
}

export interface TokenItem {
  line: number;
  type: string;
  lexeme: string;
}

export interface SymbolItem {
  name: string;
  dataType: string;
  type: string; // 'Variable' | 'Constant' | 'Header' | 'Function' | 'Keyword'
  line: number;
  value: string;
}

export interface CompileRequest {
  sourceCode: string;
  runProgram?: boolean;
  stdin?: string;
}

export interface CompileResponse {
  success: boolean;
  phases: CompilerPhase[];
  tokens: TokenItem[];
  symbolTable: SymbolItem[];
  parseTree: string;
  semantic: {
    passed: boolean;
    errorCount: number;
    errors: string[];
  };
  intermediateCode: {
    instructions: string[];
    raw: string;
  };
  optimization: {
    implemented: boolean;
    techniques: string[];
    details: string[];
    foldedLines: string[];
  };
  targetExecution: {
    requested: boolean;
    executed: boolean;
    output: string;
    exitCode: number | null;
    delegatedHost: string;
  };
  errors: string[];
  warnings: string[];
  executionTimeMs: number;
  compilerMeta: {
    version: string;
    binaryReady: boolean;
    limits: {
      maxSymbols: number;
      maxIrEntries: number;
      maxDiagnostics: number;
      maxTokenLength: number;
    };
  };
}

export interface CompilerInfoResponse {
  name: string;
  version: string;
  language: string;
  description: string;
  binaryPath: string;
  binaryExists: boolean;
  supportedPhases: {
    id: string;
    name: string;
    implemented: boolean;
    description: string;
  }[];
  grammarFeatures: string[];
  limits: {
    maxSymbols: number;
    maxIrEntries: number;
    maxDiagnostics: number;
    maxTokenLength: number;
  };
}
