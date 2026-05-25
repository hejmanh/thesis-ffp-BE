import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { updateFinancialInfoHandler } from './registration.controller.js';
import * as registrationService from './registration.service.js';

vi.mock('./registration.service.js', () => ({
  updateFinancialInfo: vi.fn(),
}));

const mockResponse = () => {
  const json = vi.fn();

  return {
    json,
  } as unknown as Response;
};

describe('Registration Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps the financial payload for the PATCH financial endpoint', async () => {
    const req = {
      userId: 99,
      body: {
        financial: {
          financialProfile: {
            currentSavings: 62000,
            desiredLifeExpectancy: 95,
            currencyId: 2,
          },
          portfolioAllocations: [
            { allocationType: 'PRE_FFP', u: 0.6, mu: 0.11, rf: 0.02 },
            { allocationType: 'POST_FFP', u: 0.35, mu: 0.07, rf: 0.02 },
          ],
          lifestyleProfile: {
            smokingTypeId: 1,
            physicalActivityTypeId: 2,
            dietQualityTypeId: 3,
            alcoholConsumptionTypeId: 4,
          },
        },
      },
    } as Request;
    const res = mockResponse();
    const next = vi.fn() as unknown as NextFunction;
    const result = {
      financial: {
        financialProfile: {
          currentSavings: 62000,
          desiredLifeExpectancy: 95,
          estimatedLifeExpectancy: 83,
          currencyId: 2,
        },
        portfolioAllocations: [
          { allocationType: 'PRE_FFP' as const, u: 0.6, mu: 0.11, rf: 0.02 },
          { allocationType: 'POST_FFP' as const, u: 0.35, mu: 0.07, rf: 0.02 },
        ],
        lifestyleProfile: {
          smokingTypeId: 1,
          physicalActivityTypeId: 2,
          dietQualityTypeId: 3,
          alcoholConsumptionTypeId: 4,
        },
      },
    };

    vi.mocked(registrationService.updateFinancialInfo).mockResolvedValue(
      result,
    );

    await updateFinancialInfoHandler(req, res, next);

    expect(registrationService.updateFinancialInfo).toHaveBeenCalledWith(99, {
      financialProfile: {
        currentSavings: 62000,
        desiredLifeExpectancy: 95,
        currencyId: 2,
      },
      portfolioAllocations: [
        { allocationType: 'PRE_FFP', u: 0.6, mu: 0.11, rf: 0.02 },
        { allocationType: 'POST_FFP', u: 0.35, mu: 0.07, rf: 0.02 },
      ],
      lifestyleProfile: {
        smokingTypeId: 1,
        physicalActivityTypeId: 2,
        dietQualityTypeId: 3,
        alcoholConsumptionTypeId: 4,
      },
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: result,
      message: 'Financial info updated',
    });
  });
});
