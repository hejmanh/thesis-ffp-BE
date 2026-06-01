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
  updatePasswordHandler,
  refreshHandler,
  logoutHandler,
} from './auth.controller.js';
import { csrfProtection } from '@/middlewares/csrf.js';
import { authMiddleware } from '@/middlewares/auth.js';

const router = Router();

router.use(authLimiter);

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordHandler); // rate limit by email
router.post('/reset-password', passwordResetLimiter, resetPasswordHandler); // rate limit by ip 
router.post(
  '/update-password',
  passwordResetLimiter,
  authMiddleware,
  csrfProtection,
  updatePasswordHandler,
); // rate limit by email
router.post('/refresh', csrfProtection, refreshHandler);
router.post('/logout', csrfProtection, logoutHandler);
router.post('/verify-email', emailVerificationLimiter, verifyEmailHandler); // rate limit by ip

export default router;
