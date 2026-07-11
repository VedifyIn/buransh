import { buildEventBase, type EventBaseData } from './event-base';

export interface ConferenceData extends EventBaseData {
  speaker?: Array<{ name: string; jobTitle?: string; url?: string }>;
  tracks?: string[];
  schedule?: Array<{ name: string; startTime: string; speaker?: string }>;
  registrationUrl?: string;
}

export function generateConferenceSchema(data: ConferenceData, id?: string) {
  const base = buildEventBase(data, 'Event', id);
  return {
    ...base,
    performer: data.speaker?.map((s) => ({
      '@type': 'Person' as const,
      name: s.name,
      jobTitle: s.jobTitle,
      url: s.url,
    })),
    subEvent: data.schedule?.map((slot) => ({
      '@type': 'Event' as const,
      name: slot.name,
      startDate: slot.startTime,
      performer: slot.speaker ? [{ '@type': 'Person' as const, name: slot.speaker }] : undefined,
    })),
    additionalProperty: data.tracks?.map((track) => ({
      '@type': 'PropertyValue' as const,
      name: 'Track',
      value: track,
    })),
  };
}
