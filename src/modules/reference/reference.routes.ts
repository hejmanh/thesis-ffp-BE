import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  getAlcoholConsumptionTypes,
  getAssetTypes,
  getCountries,
  getCurrencies,
  getDietQualityTypes,
  getEstimateLifeExpectancy,
  getLifeStageRanges,
  getPhysicalActivityTypes,
  getScenarioTypes,
  getSexTypes,
  getSmokingTypes,
} from './reference.controller.js';

const router = Router();

router.get('/currencies', getCurrencies);
router.get('/countries', getCountries);
router.get('/sex-types', getSexTypes);
router.get('/asset-types', getAssetTypes);
router.get('/scenario-types', getScenarioTypes);
router.get('/life-stage-ranges', getLifeStageRanges);
router.get('/smoking-types', getSmokingTypes);
router.get('/physical-activity-types', getPhysicalActivityTypes);
router.get('/diet-quality-types', getDietQualityTypes);
router.get('/alcohol-consumption-types', getAlcoholConsumptionTypes);
router.get('/estimate-life-expectancy', authMiddleware, getEstimateLifeExpectancy);

export default router;
