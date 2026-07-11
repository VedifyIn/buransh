/**
 * Code section schema generator (SoftwareSourceCode)
 */

export interface CodeSectionData {
  name: string;
  code: string;
  language?: string;
  description?: string;
  codeRepository?: string;
  author?: { '@id': string } | { '@type': 'Person'; name: string };
}

export interface CodeSectionOptions {
  id?: string;
}

/**
 * Generate a SoftwareSourceCode schema for inline code blocks.
 */
export function generateCodeSection(data: CodeSectionData, options: CodeSectionOptions = {}) {
  return {
    '@type': 'SoftwareSourceCode' as const,
    ...(options.id ? { '@id': options.id } : {}),
    name: data.name,
    description: data.description,
    programmingLanguage: data.language
      ? { '@type': 'ComputerLanguage' as const, name: data.language }
      : undefined,
    text: data.code,
    codeRepository: data.codeRepository,
    author: data.author,
  };
}
