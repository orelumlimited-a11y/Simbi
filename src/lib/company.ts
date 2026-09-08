import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCountryByCode } from "@/lib/countries";

/** Request-memoized so multiple components on the same page share one query. */
export const getCompanySettings = cache(async () => {
  return prisma.companySettings.findUnique({ where: { id: "singleton" } });
});

export const getCompanyLocale = cache(async () => {
  const settings = await getCompanySettings();
  const country = getCountryByCode(settings?.countryCode);
  return {
    countryCode: settings?.countryCode ?? country.code,
    countryName: country.name,
    currency: settings?.currency || country.currency,
    locale: country.locale,
  };
});
