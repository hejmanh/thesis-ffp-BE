import { notFound } from '@/utils/error.js';
import {
  createConsent,
  findConsentByProfileId,
  getProfileIdByUserId,
} from './consent.repository.js';

export const recordConsentService = async (
  userId: number,
  agreed: boolean,
  consentVersion: string,
) => {
  const profileId = await getProfileIdByUserId(userId);
  if (profileId == null) throw notFound('Profile not found');

  const existing = await findConsentByProfileId(profileId);
  if (existing) {
    return {
      agreed: existing.agreed,
      consentedAt: existing.consentedAt,
      consentVersion: existing.consentVersion,
    };
  }

  const created = await createConsent(profileId, agreed, consentVersion);

  if (!created) {
    const refetched = await findConsentByProfileId(profileId);
    if (!refetched) throw notFound('Consent record could not be created');
    return {
      agreed: refetched.agreed,
      consentedAt: refetched.consentedAt,
      consentVersion: refetched.consentVersion,
    };
  }

  return {
    agreed: created.agreed,
    consentedAt: created.consentedAt,
    consentVersion: created.consentVersion,
  };
};

export const getConsentStatusService = async (userId: number) => {
  const profileId = await getProfileIdByUserId(userId);
  if (profileId == null) throw notFound('Profile not found');

  const consent = await findConsentByProfileId(profileId);

  return {
    hasSeen: consent != null,
    hasConsented: consent?.agreed ?? false,
    consentedAt: consent?.consentedAt ?? null,
    consentVersion: consent?.consentVersion ?? null,
  };
};
