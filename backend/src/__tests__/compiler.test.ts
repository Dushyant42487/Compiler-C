import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';

describe('C Compiler Backend API Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  it('1. GET /api/health should report healthy status and compiler readiness', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.compilerBinaryReady).toBe(true);
    expect(res.body.binaryPath).toBeTruthy();
  });

  it('2. GET /api/compiler/info should return supported phases and grammar features', async () => {
    const res = await request(app).get('/api/compiler/info');
    expect(res.status).toBe(200);
    expect(res.body.name).toContain('C Compiler');
    expect(Array.isArray(res.body.supportedPhases)).toBe(true);
    expect(res.body.supportedPhases.length).toBeGreaterThanOrEqual(4);
    expect(res.body.grammarFeatures.length).toBeGreaterThan(0);
  });

  it('3. POST /api/compile with valid program should succeed and produce all phases', async () => {
    const code = `#include<stdio.h>
int main() {
    int x;
    int y;
    x = 5;
    y = 10;
    return 0;
}`;
    const res = await request(app).post('/api/compile').send({ sourceCode: code });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Phase outputs
    expect(res.body.tokens.length).toBeGreaterThan(5);
    expect(res.body.tokens.some((t: any) => t.lexeme === 'main')).toBe(true);

    expect(res.body.symbolTable.length).toBeGreaterThan(0);
    expect(res.body.symbolTable.some((s: any) => s.name === 'x')).toBe(true);

    expect(res.body.parseTree).toContain('xdeclaration');
    expect(res.body.intermediateCode.instructions.length).toBeGreaterThan(0);
    expect(res.body.errors.length).toBe(0);

    // Phases list
    expect(res.body.phases.find((p: any) => p.id === 'lexical')?.status).toBe('completed');
    expect(res.body.phases.find((p: any) => p.id === 'syntax')?.status).toBe('completed');
    expect(res.body.phases.find((p: any) => p.id === 'semantic')?.status).toBe('completed');
    expect(res.body.phases.find((p: any) => p.id === 'ir')?.status).toBe('completed');
  });

  it('4. POST /api/compile with syntax error should report failure and identify line', async () => {
    const code = `#include<stdio.h>
int main() {
    int x = 10
    int y = 20;
    return 0;
}`;
    const res = await request(app).post('/api/compile').send({ sourceCode: code });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.errors.some((e: string) => e.toLowerCase().includes('syntax error'))).toBe(true);
    expect(res.body.phases.find((p: any) => p.id === 'syntax')?.status).toBe('failed');
  });

  it('5. POST /api/compile with undeclared variable should report semantic error', async () => {
    const code = `#include<stdio.h>
int main() {
    int x = 10;
    y = x + 5;
    return 0;
}`;
    const res = await request(app).post('/api/compile').send({ sourceCode: code });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.semantic.errorCount).toBeGreaterThan(0);
    expect(res.body.semantic.errors.some((e: string) => e.includes('not declared'))).toBe(true);
    expect(res.body.phases.find((p: any) => p.id === 'semantic')?.status).toBe('failed');
  });

  it('6. POST /api/compile with variable redeclaration should report semantic error', async () => {
    const code = `#include<stdio.h>
int main() {
    int x = 10;
    int y = 20;
    int x = 30;
    return 0;
}`;
    const res = await request(app).post('/api/compile').send({ sourceCode: code });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.semantic.errors.some((e: string) => e.includes('Multiple declarations'))).toBe(true);
  });

  it('7. POST /api/compile should perform constant folding on arithmetic expressions', async () => {
    const code = `#include<stdio.h>
int main() {
    int a = 10;
    int b = 20;
    int sum;
    sum = a + b;
    return 0;
}`;
    const res = await request(app).post('/api/compile').send({ sourceCode: code });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.optimization.implemented).toBe(true);
    // Verified constant folding value 30
    expect(res.body.intermediateCode.raw).toContain('30');
  });

  it('8. POST /api/compile with runProgram=true should compile and execute program', async () => {
    const code = `#include<stdio.h>
int main() {
    printf("HELLO_COMPILER_WORLD");
    return 0;
}`;
    const res = await request(app).post('/api/compile').send({ sourceCode: code, runProgram: true });
    expect(res.status).toBe(200);
    expect(res.body.targetExecution.requested).toBe(true);
    expect(res.body.targetExecution.executed).toBe(true);
    expect(res.body.targetExecution.output).toContain('HELLO_COMPILER_WORLD');
    expect(res.body.targetExecution.exitCode).toBe(0);
  });

  it('9. POST /api/compile with empty code should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/compile').send({ sourceCode: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('empty');
  });

  it('10. POST /api/compile with missing sourceCode field should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/compile').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('sourceCode');
  });

  it('11. POST /api/compile with oversized code (>64KB) should return 413 Payload Too Large', async () => {
    const largeCode = '// Large code payload\n' + 'int x = 1;\n'.repeat(6000);
    const res = await request(app).post('/api/compile').send({ sourceCode: largeCode });
    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('exceeds');
  });

  it('12. GET non-existent endpoint should return 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
