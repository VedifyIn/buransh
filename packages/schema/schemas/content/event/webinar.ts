import { buildEventBase, type EventBaseData } from './event-base';

export interface WebinarData extends Omit<EventBaseData, 'location'> {
  onlineUrl: string;
  recording?: string;
  registrationUrl?: string;
  presenter?: Array<{ name: string; url?: string }>;
}

export function generateWebinarSchema(data: WebinarData, id?: string) {
  const base = buildEventBase(
    {
      ...data,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      virtualLocation: { url: data.onlineUrl },
    },
    'Event',
    id,
  );
  return {
    ...base,
    performer: data.presenter?.map((p) => ({
      '@type': 'Person' as const,
      name: p.name,
      url: p.url,
    })),
    recordedIn: data.recording
      ? { '@type': 'VideoObject' as const, contentUrl: data.recording }
      : undefined,
  };
}
