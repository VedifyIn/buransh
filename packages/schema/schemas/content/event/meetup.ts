import { buildEventBase, type EventBaseData } from './event-base';

export interface MeetupData extends EventBaseData {
  attendeeCapacity?: number;
  group?: { name: string; url?: string };
  topics?: string[];
}

export function generateMeetupSchema(data: MeetupData, id?: string) {
  const base = buildEventBase(data, 'Event', id);
  return {
    ...base,
    maximumAttendeeCapacity: data.attendeeCapacity,
    organizer: data.group
      ? { '@type': 'Organization' as const, name: data.group.name, url: data.group.url }
      : base['organizer'],
    about: data.topics?.map((t) => ({ '@type': 'Thing' as const, name: t })),
  };
}
