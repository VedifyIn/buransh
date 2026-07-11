/**
 * Shared base properties for all Event subtypes
 */

export interface EventBaseData {
  name: string;
  description?: string;
  url?: string;
  startDate: string;
  endDate?: string;
  image?: string;
  eventStatus?: string; // e.g. https://schema.org/EventScheduled
  eventAttendanceMode?: string; // e.g. https://schema.org/OfflineEventAttendanceMode
  organizer?: { name: string; url?: string } | { '@id': string };
  location?: {
    name?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    geo?: { latitude?: number; longitude?: number };
  };
  virtualLocation?: { url: string };
  offers?: Array<{
    price: string | number;
    priceCurrency?: string;
    url?: string;
    availability?: string;
    validFrom?: string;
  }>;
  performer?: Array<{ name: string; url?: string }>;
}

export type EventSchemaNode = Record<string, unknown>;

/**
 * Build the shared base fields for any Event schema.
 * Each subtype generator calls this and spreads its own extras on top.
 */
export function buildEventBase(data: EventBaseData, type: string, id?: string): EventSchemaNode {
  const location = buildLocation(data);
  const offers = data.offers?.map((offer) => ({
    '@type': 'Offer' as const,
    price: String(offer.price),
    priceCurrency: offer.priceCurrency ?? 'INR',
    url: offer.url,
    availability: offer.availability ?? 'https://schema.org/InStock',
    validFrom: offer.validFrom,
  }));

  return {
    '@type': type,
    ...(id ? { '@id': id } : {}),
    name: data.name,
    description: data.description,
    url: data.url,
    startDate: data.startDate,
    endDate: data.endDate,
    eventStatus: data.eventStatus ?? 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      data.eventAttendanceMode ?? 'https://schema.org/OfflineEventAttendanceMode',
    image: data.image ? { '@type': 'ImageObject' as const, url: data.image } : undefined,
    location,
    organizer: data.organizer
      ? '@id' in data.organizer
        ? data.organizer
        : { '@type': 'Organization' as const, ...data.organizer }
      : undefined,
    offers: offers && offers.length > 0 ? offers : undefined,
    performer: data.performer?.map((p) => ({
      '@type': 'Person' as const,
      name: p.name,
      url: p.url,
    })),
  };
}

function buildLocation(data: EventBaseData): EventSchemaNode | undefined {
  if (data.virtualLocation) {
    return {
      '@type': 'VirtualLocation' as const,
      url: data.virtualLocation.url,
    };
  }
  if (!data.location) return undefined;
  const { name, address, geo } = data.location;
  return {
    '@type': 'Place' as const,
    name,
    address: address
      ? {
          '@type': 'PostalAddress' as const,
          streetAddress: address.streetAddress,
          addressLocality: address.addressLocality,
          addressRegion: address.addressRegion,
          postalCode: address.postalCode,
          addressCountry: address.addressCountry ?? 'IN',
        }
      : undefined,
    geo: geo
      ? {
          '@type': 'GeoCoordinates' as const,
          latitude: geo.latitude,
          longitude: geo.longitude,
        }
      : undefined,
  };
}
