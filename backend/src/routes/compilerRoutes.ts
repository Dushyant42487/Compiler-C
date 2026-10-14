import { Router } from 'express';
import { CompilerController } from '../controllers/compilerController';
import { compilationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/health', CompilerController.getHealth);
router.get('/compiler/info', CompilerController.getCompilerInfo);
router.post('/compile', compilationRateLimiter, CompilerController.compile);

export default router;
