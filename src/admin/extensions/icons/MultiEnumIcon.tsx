/**
 * Inline SVG icon for the custom field — keeps the bundle small
 * and avoids pulling in @strapi/icons for one glyph.
 * Visual: stacked checkboxes (multi-select metaphor).
 */
import * as React from 'react';

export const MultiEnumIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="7" y="7" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="white" />
    <path d="M11 14L13 16L17 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
);