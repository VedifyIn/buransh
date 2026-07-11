import { buildEventBase, type EventBaseData } from './event-base';

export interface HackathonData extends EventBaseData {
  prize?: string;
  judgingCriteria?: string;
  competitor?: Array<{ name: string; url?: string }>;
  numberOfParticipants?: number;
  registrationDeadline?: string;
  themes?: string[];
}

export function generateHackathonSchema(data: HackathonData, id?: string) {
  const base = buildEventBase(data, 'Hackathon', id);
  return {
    ...base,
    about: data.themes?.map((t) => ({ '@type': 'Thing' as const, name: t })),
    maximumAttendeeCapacity: data.numberOfParticipants,
    // Hackathon-specific properties stored in additionalProperty
    additionalProperty: [
      data.prize && {
        '@type': 'PropertyValue' as const,
        name: 'Prize',
        value: data.prize,
      },
      data.judgingCriteria && {
        '@type': 'PropertyValue' as const,
        name: 'Judging Criteria',
        value: data.judgingCriteria,
      },
      data.registrationDeadline && {
        '@type': 'PropertyValue' as const,
        name: 'Registration Deadline',
        value: data.registrationDeadline,
      },
    ].filter(Boolean),
    competitor: data.competitor?.map((c) => ({
      '@type': 'Person' as const,
      name: c.name,
      url: c.url,
    })),
  };
}
