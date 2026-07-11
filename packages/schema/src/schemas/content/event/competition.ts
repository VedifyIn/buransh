import { buildEventBase, type EventBaseData } from './event-base';

export interface CompetitionData extends EventBaseData {
  prize?: string;
  rules?: string;
  submissionDeadline?: string;
  judges?: Array<{ name: string; url?: string }>;
}

export function generateCompetitionSchema(data: CompetitionData, id?: string) {
  const base = buildEventBase(data, 'Event', id);
  return {
    ...base,
    performer: data.judges?.map((j) => ({
      '@type': 'Person' as const,
      name: j.name,
      url: j.url,
    })),
    additionalProperty: [
      data.prize && { '@type': 'PropertyValue' as const, name: 'Prize', value: data.prize },
      data.submissionDeadline && {
        '@type': 'PropertyValue' as const,
        name: 'Submission Deadline',
        value: data.submissionDeadline,
      },
    ].filter(Boolean),
    description: data.rules
      ? `${data.description ?? ''}\n\nRules: ${data.rules}`.trim()
      : data.description,
  };
}
