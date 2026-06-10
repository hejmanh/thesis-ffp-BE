export type SupportedLocale = 'en' | 'vi';

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const isSupportedLocale = (
  value: string | undefined,
): value is SupportedLocale => value === 'en' || value === 'vi';

export const pickSupportedLocale = (
  acceptLanguage: string | undefined,
): SupportedLocale => {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const requested = acceptLanguage
    .split(',')
    .map((entry) => entry.trim().split(';')[0]?.toLowerCase())
    .filter((entry): entry is string => Boolean(entry));

  for (const locale of requested) {
    if (isSupportedLocale(locale)) return locale;

    const language = locale.split('-')[0];
    if (isSupportedLocale(language)) return language;
  }

  return DEFAULT_LOCALE;
};
