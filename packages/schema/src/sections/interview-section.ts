/**
 * Interview section schema generator
 */

export interface InterviewSectionData {
  headline: string;
  description?: string;
  interviewer?: { '@id': string } | { '@type': 'Person'; name: string };
  interviewee: { name: string; url?: string; jobTitle?: string };
  datePublished?: string;
  url?: string;
  image?: string;
}

export interface InterviewSectionOptions {
  id?: string;
}

/**
 * Generate an Article schema representing an interview.
 */
export function generateInterviewSection(
  data: InterviewSectionData,
  options: InterviewSectionOptions = {},
) {
  return {
    '@type': 'Article' as const,
    ...(options.id ? { '@id': options.id } : {}),
    headline: data.headline,
    description: data.description,
    author: data.interviewer,
    about: {
      '@type': 'Person' as const,
      name: data.interviewee.name,
      url: data.interviewee.url,
      jobTitle: data.interviewee.jobTitle,
    },
    datePublished: data.datePublished,
    url: data.url,
    image: data.image ? { '@type': 'ImageObject' as const, url: data.image } : undefined,
    articleSection: 'Interview',
  };
}
