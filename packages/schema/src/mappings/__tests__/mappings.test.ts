import { describe, it, expect } from 'vitest';
import { CONTENT_TO_SCHEMA_TYPE, getSchemaType } from '../schema-type-map';
import { CONTENT_TYPE_FLAGS } from '../content-type-flags';
import { CONTENT_SEMANTIC_TAGS } from '../semantic-tags';
import { COMPONENT_TAG_MAP, getComponentTag } from '../component-tags';
import { MEDIA_TAG_MAP, getMediaTags } from '../media-tags';
import {
  getSemanticTags,
  getContainerTag,
  getSchemaTypeForContent,
  isValidContentType,
  getOgType,
  hasAeoDirectAnswer,
  hasFaq,
  getContentTypeLabel,
} from '../helpers';
import { contentTypeSchema } from '../../enums';

const ALL_CONTENT_TYPES = contentTypeSchema.options;

describe('CONTENT_TO_SCHEMA_TYPE', () => {
  it('maps every content type to a string or undefined', () => {
    for (const type of ALL_CONTENT_TYPES) {
      const schemaType = CONTENT_TO_SCHEMA_TYPE[type as keyof typeof CONTENT_TO_SCHEMA_TYPE];
      expect(typeof schemaType === 'string' || schemaType === undefined).toBe(true);
    }
  });

  it('maps BlogPost to BlogPosting', () => {
    expect(CONTENT_TO_SCHEMA_TYPE.BlogPost).toBe('BlogPosting');
  });

  it('maps LegalPage to undefined', () => {
    expect(CONTENT_TO_SCHEMA_TYPE.LegalPage).toBeUndefined();
  });

  it('maps grouped types to the same schema type', () => {
    expect(CONTENT_TO_SCHEMA_TYPE.BlogPost).toBe(CONTENT_TO_SCHEMA_TYPE.Essay);
    expect(CONTENT_TO_SCHEMA_TYPE.ShortStory).toBe(CONTENT_TO_SCHEMA_TYPE.Devotional);
    expect(CONTENT_TO_SCHEMA_TYPE.Course).toBe(CONTENT_TO_SCHEMA_TYPE.CourseLesson);
  });
});

describe('getSchemaType', () => {
  it('returns BlogPosting for BlogPost', () => {
    expect(getSchemaType('BlogPost')).toBe('BlogPosting');
  });

  it('returns undefined for LegalPage', () => {
    expect(getSchemaType('LegalPage')).toBeUndefined();
  });
});

describe('CONTENT_TYPE_FLAGS', () => {
  it('defines flags for every content type', () => {
    for (const type of ALL_CONTENT_TYPES) {
      const flags = CONTENT_TYPE_FLAGS[type as keyof typeof CONTENT_TYPE_FLAGS];
      expect(flags).toBeDefined();
      expect(typeof flags.isArticle).toBe('boolean');
      expect(typeof flags.hasAeo).toBe('boolean');
      expect(typeof flags.hasFaq).toBe('boolean');
      expect(['article', 'website']).toContain(flags.ogType);
      expect(typeof flags.isCourse).toBe('boolean');
      expect(typeof flags.isRecipe).toBe('boolean');
      expect(typeof flags.difficultyRequired).toBe('boolean');
    }
  });

  it('marks BlogPost, Essay, Opinion as article OG type', () => {
    expect(CONTENT_TYPE_FLAGS.BlogPost.ogType).toBe('article');
    expect(CONTENT_TYPE_FLAGS.Essay.ogType).toBe('article');
    expect(CONTENT_TYPE_FLAGS.Opinion.ogType).toBe('article');
  });

  it('marks website OG type for non-article content', () => {
    expect(CONTENT_TYPE_FLAGS.Tutorial.ogType).toBe('website');
    expect(CONTENT_TYPE_FLAGS.Recipe.ogType).toBe('website');
  });

  it('marks Course and CourseLesson as difficultyRequired', () => {
    expect(CONTENT_TYPE_FLAGS.Course.difficultyRequired).toBe(true);
    expect(CONTENT_TYPE_FLAGS.CourseLesson.difficultyRequired).toBe(true);
  });

  it('does not mark non-course types as difficultyRequired', () => {
    expect(CONTENT_TYPE_FLAGS.BlogPost.difficultyRequired).toBe(false);
    expect(CONTENT_TYPE_FLAGS.Recipe.difficultyRequired).toBe(false);
  });

  it('hasAeo matches expected types', () => {
    expect(CONTENT_TYPE_FLAGS.BlogPost.hasAeo).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Tutorial.hasAeo).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Essay.hasAeo).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Recipe.hasAeo).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Course.hasAeo).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Quote.hasAeo).toBe(false);
    expect(CONTENT_TYPE_FLAGS.LegalPage.hasAeo).toBe(false);
  });

  it('hasFaq matches expected types', () => {
    expect(CONTENT_TYPE_FLAGS.BlogPost.hasFaq).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Tutorial.hasFaq).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Essay.hasFaq).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Recipe.hasFaq).toBe(true);
    expect(CONTENT_TYPE_FLAGS.Course.hasFaq).toBe(false);
  });

  it('only Recipe has isRecipe true', () => {
    for (const type of ALL_CONTENT_TYPES) {
      const flags = CONTENT_TYPE_FLAGS[type as keyof typeof CONTENT_TYPE_FLAGS];
      if (type === 'Recipe') {
        expect(flags.isRecipe).toBe(true);
      } else {
        expect(flags.isRecipe).toBe(false);
      }
    }
  });
});

describe('CONTENT_SEMANTIC_TAGS', () => {
  it('defines semantic tags for every content type', () => {
    for (const type of ALL_CONTENT_TYPES) {
      const tags = CONTENT_SEMANTIC_TAGS[type as keyof typeof CONTENT_SEMANTIC_TAGS];
      expect(tags).toBeDefined();
      expect(typeof tags.container).toBe('string');
      expect(typeof tags.heading).toBe('string');
      expect(typeof tags.section).toBe('string');
      expect(typeof tags.breadcrumb).toBe('boolean');
      expect(typeof tags.comments).toBe('boolean');
      expect(typeof tags.toc).toBe('boolean');
      expect(typeof tags.nav).toBe('boolean');
    }
  });

  it('uses article container for most content types', () => {
    expect(CONTENT_SEMANTIC_TAGS.BlogPost.container).toBe('article');
    expect(CONTENT_SEMANTIC_TAGS.Tutorial.container).toBe('article');
    expect(CONTENT_SEMANTIC_TAGS.Recipe.container).toBe('article');
  });

  it('uses figure container for Quote', () => {
    expect(CONTENT_SEMANTIC_TAGS.Quote.container).toBe('figure');
  });

  it('uses section container for AboutMe', () => {
    expect(CONTENT_SEMANTIC_TAGS.AboutMe.container).toBe('section');
  });

  it('marks tutorial-like types with toc true', () => {
    expect(CONTENT_SEMANTIC_TAGS.Tutorial.toc).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.Course.toc).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.ResearchPaper.toc).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.LegalPage.toc).toBe(true);
  });

  it('marks series/course types with nav true', () => {
    expect(CONTENT_SEMANTIC_TAGS.SeriesOverview.nav).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.Course.nav).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.CourseLesson.nav).toBe(true);
  });

  it('marks blog-like types with comments true and breadcrumb true', () => {
    expect(CONTENT_SEMANTIC_TAGS.BlogPost.comments).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.BlogPost.breadcrumb).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.Essay.comments).toBe(true);
    expect(CONTENT_SEMANTIC_TAGS.Essay.breadcrumb).toBe(true);
  });
});

describe('COMPONENT_TAG_MAP', () => {
  it('defines all component types', () => {
    expect(COMPONENT_TAG_MAP.paragraph.tag).toBe('p');
    expect(COMPONENT_TAG_MAP.heading.h1).toBe('h1');
    expect(COMPONENT_TAG_MAP.list.unordered).toBe('ul');
    expect(COMPONENT_TAG_MAP.quote.block).toBe('blockquote');
    expect(COMPONENT_TAG_MAP.figure.wrapper).toBe('figure');
    expect(COMPONENT_TAG_MAP.code.block).toBe('pre');
    expect(COMPONENT_TAG_MAP.table.wrapper).toBe('table');
    expect(COMPONENT_TAG_MAP.details.wrapper).toBe('details');
    expect(COMPONENT_TAG_MAP.horizontalRule.tag).toBe('hr');
    expect(COMPONENT_TAG_MAP.callout.tag).toBe('aside');
  });
});

describe('getComponentTag', () => {
  it('returns base tag for simple components', () => {
    expect(getComponentTag('paragraph')).toBe('p');
    expect(getComponentTag('horizontalRule')).toBe('hr');
  });

  it('returns variant tag when specified', () => {
    expect(getComponentTag('heading', 'h2')).toBe('h2');
    expect(getComponentTag('list', 'ordered')).toBe('ol');
  });

  it('returns undefined for unknown component', () => {
    expect(getComponentTag('unknown' as any)).toBeUndefined();
  });
});

describe('MEDIA_TAG_MAP', () => {
  it('defines all media types', () => {
    expect(MEDIA_TAG_MAP.image.tag).toBe('img');
    expect(MEDIA_TAG_MAP.video.tag).toBe('video');
    expect(MEDIA_TAG_MAP.audio.tag).toBe('audio');
  });

  it('has schema types for all media', () => {
    expect(MEDIA_TAG_MAP.image.schemaType).toBe('ImageObject');
    expect(MEDIA_TAG_MAP.video.schemaType).toBe('VideoObject');
    expect(MEDIA_TAG_MAP.audio.schemaType).toBe('AudioObject');
  });
});

describe('getMediaTags', () => {
  it('returns tags for valid media type', () => {
    const tags = getMediaTags('image');
    expect(tags?.tag).toBe('img');
    expect(tags?.wrapper).toBe('figure');
  });

  it('returns undefined for unknown media type', () => {
    expect(getMediaTags('unknown' as any)).toBeUndefined();
  });
});

describe('helpers', () => {
  describe('getSemanticTags', () => {
    it('returns tags for a known type', () => {
      const tags = getSemanticTags('BlogPost');
      expect(tags.container).toBe('article');
    });

    it('throws for unknown type', () => {
      expect(() => getSemanticTags('UnknownType' as any)).toThrow('Unknown content type');
    });
  });

  describe('getContainerTag', () => {
    it('returns container for known type', () => {
      expect(getContainerTag('BlogPost')).toBe('article');
      expect(getContainerTag('Quote')).toBe('figure');
      expect(getContainerTag('AboutMe')).toBe('section');
    });
  });

  describe('getSchemaTypeForContent', () => {
    it('returns schema type for known content type', () => {
      expect(getSchemaTypeForContent('BlogPost')).toBe('BlogPosting');
    });

    it('returns undefined for LegalPage', () => {
      expect(getSchemaTypeForContent('LegalPage')).toBeUndefined();
    });
  });

  describe('isValidContentType', () => {
    it('returns true for valid content types', () => {
      expect(isValidContentType('BlogPost')).toBe(true);
      expect(isValidContentType('Recipe')).toBe(true);
    });

    it('returns false for invalid content types', () => {
      expect(isValidContentType('InvalidType')).toBe(false);
      expect(isValidContentType('')).toBe(false);
    });
  });

  describe('getOgType', () => {
    it('returns article for BlogPost, Essay, Opinion', () => {
      expect(getOgType('BlogPost')).toBe('article');
      expect(getOgType('Essay')).toBe('article');
      expect(getOgType('Opinion')).toBe('article');
    });

    it('returns website for other types', () => {
      expect(getOgType('Tutorial')).toBe('website');
      expect(getOgType('Recipe')).toBe('website');
    });
  });

  describe('hasAeoDirectAnswer', () => {
    it('returns true for AEO-enabled types', () => {
      expect(hasAeoDirectAnswer('BlogPost')).toBe(true);
      expect(hasAeoDirectAnswer('Tutorial')).toBe(true);
    });

    it('returns false for non-AEO types', () => {
      expect(hasAeoDirectAnswer('Quote')).toBe(false);
      expect(hasAeoDirectAnswer('LegalPage')).toBe(false);
    });
  });

  describe('hasFaq', () => {
    it('returns true for FAQ-enabled types', () => {
      expect(hasFaq('BlogPost')).toBe(true);
      expect(hasFaq('Recipe')).toBe(true);
    });

    it('returns false for non-FAQ types', () => {
      expect(hasFaq('Course')).toBe(false);
    });
  });

  describe('getContentTypeLabel', () => {
    it('returns human-readable labels', () => {
      expect(getContentTypeLabel('BlogPost')).toBe('Posts');
      expect(getContentTypeLabel('Tutorial')).toBe('Tutorials');
      expect(getContentTypeLabel('Course')).toBe('Courses');
      expect(getContentTypeLabel('SeriesOverview')).toBe('Series');
    });

    it('falls back to the type name for unknown types', () => {
      expect(getContentTypeLabel('Unknown')).toBe('Unknown');
    });
  });
});
