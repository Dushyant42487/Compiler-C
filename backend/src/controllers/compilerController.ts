import { Request, Response, NextFunction } from 'express';
import { CompilerService } from '../services/compilerService';
import * as fs from 'fs';

const compilerService = new CompilerService();

export class CompilerController {
  public static async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const binaryPath = compilerService.getBinaryPath();
      const binaryReady = fs.existsSync(binaryPath);

      res.status(200).json({
        status: 'healthy',
        service: 'c-compiler-backend',
        compilerBinaryReady: binaryReady,
        binaryPath,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getCompilerInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const info = compilerService.getCompilerInfo();
      res.status(200).json(info);
    } catch (err) {
      next(err);
    }
  }

  public static async compile(req: Request, res: Response, next: NextFunction) {
    try {
      const { sourceCode, runProgram, stdin } = req.body;

      if (sourceCode === undefined || sourceCode === null) {
        return res.status(400).json({
          success: false,
          error: "Request body must contain 'sourceCode' string.",
        });
      }

      if (typeof sourceCode !== 'string') {
        return res.status(400).json({
          success: false,
          error: "'sourceCode' must be a string.",
        });
      }

      if (sourceCode.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Source code cannot be empty. Please provide a valid C program.',
        });
      }

      // Max size: 64 KB of source code
      const MAX_SIZE_BYTES = 64 * 1024;
      if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SIZE_BYTES) {
        return res.status(413).json({
          success: false,
          error: `Source code exceeds maximum allowed size of 64KB (${Buffer.byteLength(sourceCode, 'utf8')} bytes received).`,
        });
      }

      const result = await compilerService.compile({
        sourceCode,
        runProgram: Boolean(runProgram),
        stdin: typeof stdin === 'string' ? stdin : undefined,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
