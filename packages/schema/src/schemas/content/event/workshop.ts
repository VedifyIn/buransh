import { buildEventBase, type EventBaseData } from './event-base';

export interface WorkshopData extends EventBaseData {
  instructor?: Array<{ name: string; url?: string }>;
  materials?: string[];
  prerequisites?: string[];
  maxCapacity?: number;
}

export function generateWorkshopSchema(data: WorkshopData, id?: string) {
  const base = buildEventBase(data, 'EducationalEvent', id);
  return {
    ...base,
    maximumAttendeeCapacity: data.maxCapacity,
    performer: data.instructor?.map((i) => ({
      '@type': 'Person' as const,
      name: i.name,
      url: i.url,
    })),
    additionalProperty: [
      ...(data.materials?.map((m) => ({
        '@type': 'PropertyValue' as const,
        name: 'Material',
        value: m,
      })) ?? []),
      ...(data.prerequisites?.map((p) => ({
        '@type': 'PropertyValue' as const,
        name: 'Prerequisite',
        value: p,
      })) ?? []),
    ],
  };
}
