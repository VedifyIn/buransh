/**
 * Re-exports from the canonical schemas location (src/schemas/).
 * All supporting schemas live in src/schemas/supporting/ — this file is the public package export.
 */
export { generateOrganizationFragment } from '../../src/schemas/supporting/organization-fragment';
export type {
  OrganizationFragmentData,
  OrganizationFragmentOptions,
} from '../../src/schemas/supporting/organization-fragment';
