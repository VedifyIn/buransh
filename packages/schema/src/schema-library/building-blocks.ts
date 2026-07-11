import type { BaseFrontmatter } from '../base';
import { slugify } from '../utils/id-generator';

export type OrganizationConfig = {
  name?: string;
  legalName?: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  sameAs?: string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
};

export type ResolvedAuthor = {
  name: string;
  url?: string;
  avatar?: string;
  sameAs?: string[];
};

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function toAbsoluteUrl(base: string, value: string): string {
  return /^https?:\/\//.test(value) ? value : joinUrl(base, value);
}

export function getWebsiteId(baseUrl: string, orgName?: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const fragment = orgName ? `#${slugify(orgName)}-website` : '#website';
  return `${cleanBaseUrl}/${fragment}`;
}

export function getOrganizationId(baseUrl: string, orgName?: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const fragment = orgName ? `#${slugify(orgName)}-organization` : '#organization';
  return `${cleanBaseUrl}/${fragment}`;
}

export function getAuthorId(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/#author`;
}

export function getWebPageId(baseUrl: string, fm: Pick<BaseFrontmatter, 'id'>): string {
  return `${baseUrl.replace(/\/+$/, '')}/${fm.id}#webpage`;
}

export function getBreadcrumbId(baseUrl: string, fm: Pick<BaseFrontmatter, 'id'>): string {
  return `${baseUrl.replace(/\/+$/, '')}/${fm.id}#breadcrumb`;
}

export function getContentId(baseUrl: string, fm: Pick<BaseFrontmatter, 'id'>): string {
  return `${baseUrl.replace(/\/+$/, '')}/${fm.id}#content`;
}

export function getVideoId(baseUrl: string, fm: Pick<BaseFrontmatter, 'id'>): string {
  return `${baseUrl.replace(/\/+$/, '')}/${fm.id}#video`;
}

export function getFaqId(baseUrl: string, fm: Pick<BaseFrontmatter, 'id'>): string {
  return `${baseUrl.replace(/\/+$/, '')}/${fm.id}#faq`;
}

export function getAuthorInline(baseUrl: string, author: ResolvedAuthor) {
  return {
    '@id': getAuthorId(baseUrl),
    '@type': 'Person' as const,
    name: author.name,
    url: author.url ? toAbsoluteUrl(baseUrl, author.url) : undefined,
  };
}

export function getPublisherInline(baseUrl: string, org?: OrganizationConfig) {
  return {
    '@id': getOrganizationId(baseUrl, org?.name),
    '@type': 'Organization' as const,
    name: org?.name ?? 'Vedify',
    url: org?.url ?? baseUrl,
  };
}

export function getAuthorSchema(baseUrl: string, author: ResolvedAuthor) {
  return {
    '@type': 'Person' as const,
    '@id': getAuthorId(baseUrl),
    name: author.name,
    url: author.url ? toAbsoluteUrl(baseUrl, author.url) : undefined,
    image: author.avatar ? toAbsoluteUrl(baseUrl, author.avatar) : undefined,
    sameAs: author.sameAs,
  };
}

export function getImageSchema(fm: BaseFrontmatter) {
  if (!fm.image) return undefined;
  return {
    '@type': 'ImageObject' as const,
    url: fm.image.url,
    caption: fm.image.alt,
    width: fm.image.width,
    height: fm.image.height,
  };
}

export function getVideoSchema(baseUrl: string, fm: BaseFrontmatter) {
  if (!fm.video) return undefined;
  return {
    '@type': 'VideoObject' as const,
    '@id': getVideoId(baseUrl, fm),
    name: fm.title,
    description: fm.description,
    thumbnailUrl: fm.video.thumbnail,
    uploadDate: fm.video.uploadDate || fm.datePublished,
    duration: fm.video.duration,
    embedUrl: fm.video.embedUrl,
    contentUrl: fm.video.url,
    transcript: fm.video.transcript,
    isPartOf: {
      '@type': 'WebPage' as const,
      '@id': getWebPageId(baseUrl, fm),
    },
  };
}

export function getFAQSchema(baseUrl: string, fm: BaseFrontmatter) {
  if (!fm.faqs || fm.faqs.length === 0) return undefined;
  return {
    '@type': 'FAQPage' as const,
    '@id': getFaqId(baseUrl, fm),
    isPartOf: {
      '@type': 'WebPage' as const,
      '@id': getWebPageId(baseUrl, fm),
    },
    mainEntity: fm.faqs.map((faq) => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer,
      },
    })),
  };
}

export function getBreadcrumbSchema(baseUrl: string, fm: BaseFrontmatter) {
  const items = [
    { position: 1, name: 'Home', item: baseUrl },
    {
      position: 2,
      name: fm.categories[0] || 'Blog',
      item: `${baseUrl}/category/${fm.categories[0] || 'blog'}`,
    },
    {
      position: 3,
      name: fm.title,
      item: `${baseUrl}/${fm.id}`,
    },
  ];

  return {
    '@type': 'BreadcrumbList' as const,
    '@id': getBreadcrumbId(baseUrl, fm),
    itemListElement: items.map((item) => ({
      '@type': 'ListItem' as const,
      position: item.position,
      name: item.name,
      item: item.item,
    })),
  };
}

export function getWebPageSchema(baseUrl: string, fm: BaseFrontmatter, orgName?: string) {
  return {
    '@type': 'WebPage' as const,
    '@id': getWebPageId(baseUrl, fm),
    url: `${baseUrl}/${fm.id}`,
    name: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    isPartOf: {
      '@type': 'WebSite' as const,
      '@id': getWebsiteId(baseUrl, orgName),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList' as const,
      '@id': getBreadcrumbId(baseUrl, fm),
    },
    primaryImageOfPage: fm.image
      ? {
          '@type': 'ImageObject' as const,
          url: fm.image.url,
        }
      : undefined,
  };
}

export function getWebsiteSchema(baseUrl: string, org?: OrganizationConfig) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const orgName = org?.name;

  const logoUrl = org?.logo ? toAbsoluteUrl(cleanBaseUrl, org.logo) : `${cleanBaseUrl}/logo.png`;

  return {
    '@type': 'WebSite' as const,
    '@id': getWebsiteId(cleanBaseUrl, orgName),
    url: org?.url ?? cleanBaseUrl,
    name: org?.name ?? 'Vedify',
    publisher: org
      ? {
          '@type': 'Organization' as const,
          '@id': getOrganizationId(cleanBaseUrl, orgName),
          name: org.name ?? 'Vedify',
          logo: { '@type': 'ImageObject' as const, url: logoUrl },
        }
      : {
          '@type': 'Organization' as const,
          '@id': getOrganizationId(cleanBaseUrl, orgName),
        },
    potentialAction: {
      '@type': 'SearchAction' as const,
      target: {
        '@type': 'EntryPoint' as const,
        urlTemplate: `${cleanBaseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getOrganizationSchema(baseUrl: string, org?: OrganizationConfig) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const orgName = org?.name;
  const logoUrl = org?.logo ? toAbsoluteUrl(cleanBaseUrl, org.logo) : `${cleanBaseUrl}/logo.png`;

  return {
    '@type': 'Organization' as const,
    '@id': getOrganizationId(cleanBaseUrl, orgName),
    name: org?.name ?? 'Vedify',
    legalName: org?.legalName,
    url: org?.url ?? cleanBaseUrl,
    description: org?.description,
    email: org?.email,
    telephone: org?.phone,
    sameAs: org?.sameAs && org.sameAs.length > 0 ? org.sameAs : undefined,
    logo: {
      '@type': 'ImageObject' as const,
      url: logoUrl,
    },
    address: org?.address
      ? {
          '@type': 'PostalAddress' as const,
          streetAddress: org.address.streetAddress,
          addressLocality: org.address.addressLocality,
          addressRegion: org.address.addressRegion,
          postalCode: org.address.postalCode,
          addressCountry: org.address.addressCountry ?? 'IN',
        }
      : undefined,
  };
}
