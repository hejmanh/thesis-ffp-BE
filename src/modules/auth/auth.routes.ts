import { Router } from 'express';
import { authLimiter } from '@/middlewares/rateLimiters.js';
import { registerHandler, verifyEmailHandler, loginHandler, refreshHandler, logoutHandler } from './auth.controller.js';
import { csrfProtection } from '@/middlewares/csrf.js';

const router = Router();

router.use(authLimiter);

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/refresh', csrfProtection, refreshHandler);
router.post('/logout', csrfProtection, logoutHandler);
router.get('/verify-email', verifyEmailHandler);

export default router;