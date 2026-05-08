import * as referenceService from '@/modules/reference/reference.service.js';

export const warmCache = async () => {
  console.log('[Cache] Warming reference cache...');

  await Promise.all([
    referenceService.getCurrencies(null, 'asc'),
    referenceService.getCountries(null, 'asc'),
    referenceService.getSexTypes(null, 'asc'),
    referenceService.getAssetTypes(null, 'asc'),
    referenceService.getScenarioTypes(null, 'asc'),
    referenceService.getSmokingTypes(null, 'asc'),
    referenceService.getPhysicalActivityTypes(null, 'asc'),
    referenceService.getDietQualityTypes(null, 'asc'),
    referenceService.getAlcoholConsumptionTypes(null, 'asc'),
  ]);

  console.log('[Cache] Reference cache warmed');
};
