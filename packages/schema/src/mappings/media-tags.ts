export const MEDIA_TAG_MAP = {
  image: {
    tag: 'img',
    wrapper: 'figure',
    caption: 'figcaption',
    schemaType: 'ImageObject',
  },
  video: {
    tag: 'video',
    wrapper: 'figure',
    caption: 'figcaption',
    schemaType: 'VideoObject',
    source: 'source',
    track: 'track',
  },
  audio: {
    tag: 'audio',
    wrapper: 'figure',
    caption: 'figcaption',
    schemaType: 'AudioObject',
  },
} as const;

export type MediaType = keyof typeof MEDIA_TAG_MAP;
export type MediaTags = (typeof MEDIA_TAG_MAP)[MediaType];

export function getMediaTags(type: MediaType): MediaTags | undefined {
  return MEDIA_TAG_MAP[type];
}
