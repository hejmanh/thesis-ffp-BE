import { Router } from 'express';
import {
  authLimiter,
  emailVerificationLimiter,
  passwordResetLimiter,
} from '@/middlewares/rateLimiters.js';
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  refreshHandler,
  logoutHandler,
} from './auth.controller.js';
import { csrfProtection } from '@/middlewares/csrf.js';

const router = Router();

router.use(authLimiter);

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordHandler);
router.post('/reset-password', passwordResetLimiter, resetPasswordHandler);
router.post('/refresh', csrfProtection, refreshHandler);
router.post('/logout', csrfProtection, logoutHandler);
router.get('/verify-email', emailVerificationLimiter, verifyEmailHandler);

export default router;
