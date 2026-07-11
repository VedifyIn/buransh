import { buildEventBase, type EventBaseData } from './event-base';

export interface BootcampData extends EventBaseData {
  instructor?: Array<{ name: string; url?: string }>;
  curriculum?: string[];
  certificateOffered?: string;
  duration?: string; // ISO 8601
  prerequisites?: string[];
}

export function generateBootcampSchema(data: BootcampData, id?: string) {
  const base = buildEventBase(data, 'EducationalEvent', id);
  return {
    ...base,
    performer: data.instructor?.map((i) => ({
      '@type': 'Person' as const,
      name: i.name,
      url: i.url,
    })),
    duration: data.duration,
    additionalProperty: [
      ...(data.curriculum?.map((c) => ({
        '@type': 'PropertyValue' as const,
        name: 'Curriculum',
        value: c,
      })) ?? []),
      ...(data.prerequisites?.map((p) => ({
        '@type': 'PropertyValue' as const,
        name: 'Prerequisite',
        value: p,
      })) ?? []),
      data.certificateOffered && {
        '@type': 'PropertyValue' as const,
        name: 'Certificate',
        value: data.certificateOffered,
      },
    ].filter(Boolean),
  };
}
