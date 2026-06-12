import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@/middlewares/errorHandlers.js';
import scenario4Routes from './scenario4.routes.js';
import * as scenario4Service from './scenario4.service.js';

vi.mock('@/utils/auth/token.js', () => ({
  extractTokenFromHeader: vi.fn((header?: string) =>
    header?.startsWith('Bearer ') ? header.slice(7) : null,
  ),
  verifyAccessToken: vi.fn((token: string) => {
    if (token !== 'valid-token') {
      throw new Error('Invalid token');
    }

    return { userId: 99 };
  }),
}));

vi.mock('./scenario4.service.js', () => ({
  createScenario4Input: vi.fn(),
  updateScenario4Input: vi.fn(),
  getScenario4InputService: vi.fn(),
  getScenario4OutputService: vi.fn(),
}));

const buildApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/scenario-4', scenario4Routes);
  app.use(errorHandler);

  return app;
};

describe('Scenario4 Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates scenario 4 input through the route', async () => {
    vi.mocked(scenario4Service.createScenario4Input).mockResolvedValue({
      lifeExpectancy: 80,
      inputFfpAge: 70,
      inputFfpAnnualSpending: 12_000,
    });

    const response = await request(buildApp())
      .post('/scenario-4/input')
      .set('authorization', 'Bearer valid-token')
      .send({
        lifeExpectancy: 80,
        inputFfpAge: 70,
        inputFfpAnnualSpending: 12_000,
      });

    expect(response.status).toBe(201);
    expect(scenario4Service.createScenario4Input).toHaveBeenCalledWith(99, {
      lifeExpectancy: 80,
      inputFfpAge: 70,
      inputFfpAnnualSpending: 12_000,
    });
    expect(response.body).toEqual({
      success: true,
      data: {
        lifeExpectancy: 80,
        inputFfpAge: 70,
        inputFfpAnnualSpending: 12_000,
      },
      message: 'Scenario 4 input created',
    });
  });

  it('returns the expanded scenario 4 output payload', async () => {
    vi.mocked(scenario4Service.getScenario4OutputService).mockResolvedValue({
      requiredAnnualSaving: 12_450.75,
      ffpAge: 70,
      inputFfpAnnualSpending: 12_000,
      requiredWealthAtFFPAge: 1_250_000,
    });

    const response = await request(buildApp())
      .get('/scenario-4/output')
      .set('authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        requiredAnnualSaving: 12_450.75,
        ffpAge: 70,
        inputFfpAnnualSpending: 12_000,
        requiredWealthAtFFPAge: 1_250_000,
      },
      message: 'Scenario 4 output retrieved',
    });
  });

  it('returns 400 for invalid scenario 4 input payload', async () => {
    const response = await request(buildApp())
      .post('/scenario-4/input')
      .set('authorization', 'Bearer valid-token')
      .send({
        lifeExpectancy: 80,
        inputFfpAge: 70,
        inputFfpAnnualSpending: -1,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation error');
  });

  it('returns 401 when no token is provided', async () => {
    const response = await request(buildApp()).get('/scenario-4/output');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No token provided');
  });
});
