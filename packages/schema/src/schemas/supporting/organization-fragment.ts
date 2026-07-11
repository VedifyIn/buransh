/**
 * Reusable Organization fragment
 * Use this whenever an Organization sub-entity is needed inside a larger schema.
 */

export interface OrganizationFragmentData {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  sameAs?: string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

export interface OrganizationFragmentOptions {
  id?: string;
  type?: 'Organization' | 'LocalBusiness' | 'EducationalOrganization';
}

export function generateOrganizationFragment(
  data: OrganizationFragmentData,
  options: OrganizationFragmentOptions = {},
) {
  const { id, type = 'Organization' } = options;

  return {
    '@type': type as string,
    ...(id ? { '@id': id } : {}),
    name: data.name,
    url: data.url,
    description: data.description,
    email: data.email,
    telephone: data.telephone,
    sameAs: data.sameAs && data.sameAs.length > 0 ? data.sameAs : undefined,
    logo: data.logo ? { '@type': 'ImageObject' as const, url: data.logo } : undefined,
    address: data.address
      ? {
          '@type': 'PostalAddress' as const,
          streetAddress: data.address.streetAddress,
          addressLocality: data.address.addressLocality,
          addressRegion: data.address.addressRegion,
          postalCode: data.address.postalCode,
          addressCountry: data.address.addressCountry ?? 'IN',
        }
      : undefined,
  };
}
