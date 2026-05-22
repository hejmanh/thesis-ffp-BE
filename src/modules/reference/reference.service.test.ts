import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as referenceService from './reference.service.js';
import * as referenceRepository from './reference.repository.js';
import { AppError } from '@/utils/AppError.js';
import type { SortDirection } from '@/utils/pagination.js';

vi.mock('./reference.repository.js', () => ({
  listCurrencies: vi.fn(),
  listCountries: vi.fn(),
  listSexTypes: vi.fn(),
  listAssetTypes: vi.fn(),
  listScenarioTypes: vi.fn(),
  listLifeStageRanges: vi.fn(),
  listSmokingTypes: vi.fn(),
  listPhysicalActivityTypes: vi.fn(),
  listDietQualityTypes: vi.fn(),
  listAlcoholConsumptionTypes: vi.fn(),
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

describe('Reference Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns currencies with meta when no pagination', async () => {
    const rows = [{ id: 1, code: 'USD' }];
    asMock(referenceRepository.listCurrencies).mockResolvedValue({
      rows,
      totalCount: 1,
    });

    const result = await referenceService.getCurrencies(null, 'asc');

    expect(referenceRepository.listCurrencies).toHaveBeenCalledWith(
      null,
      'asc',
    );
    expect(result.data).toEqual(rows);
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 1,
      totalCount: 1,
      totalPages: 1,
    });
  });

  it('returns currencies with pagination meta', async () => {
    const rows = [
      { id: 6, code: 'EUR' },
      { id: 7, code: 'GBP' },
    ];
    asMock(referenceRepository.listCurrencies).mockResolvedValue({
      rows,
      totalCount: 22,
    });

    const pagination = { page: 2, pageSize: 5, limit: 5, offset: 5 };
    const result = await referenceService.getCurrencies(
      pagination,
      'desc' as SortDirection,
    );

    expect(referenceRepository.listCurrencies).toHaveBeenCalledWith(
      { limit: 5, offset: 5 },
      'desc',
    );
    expect(result.data).toEqual(rows);
    expect(result.meta).toEqual({
      page: 2,
      pageSize: 5,
      totalCount: 22,
      totalPages: 5,
    });
  });

  it('adjusts life stage ranges based on birthYear', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T00:00:00Z'));

    const rows = [
      {
        id: 1,
        stageNo: 1,
        title: 'Early Career',
        beginningAge: 30,
        endingAge: 40,
      },
      {
        id: 2,
        stageNo: 2,
        title: 'Mid Career',
        beginningAge: 41,
        endingAge: 55,
      },
    ];

    asMock(referenceRepository.listLifeStageRanges).mockResolvedValue({
      rows,
      totalCount: 2,
    });

    const result = await referenceService.getLifeStageRanges(null, 'asc', 2000);

    expect(referenceRepository.listLifeStageRanges).toHaveBeenCalledWith(
      null,
      'asc',
      26,
    );
    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.beginningAge).toBe(26);
    expect(result.data[1]!.beginningAge).toBe(41);
  });

  it('throws when birthYear is in the future', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T00:00:00Z'));

    await expect(
      referenceService.getLifeStageRanges(null, 'asc', 2027),
    ).rejects.toBeInstanceOf(AppError);
  });
});
