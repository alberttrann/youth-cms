/**
 * Inline SVG icon for the single-enum custom field.
 * Visual: a list with a chevron (dropdown metaphor).
 */
import * as React from 'react';

export const SingleEnumIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 10L7 10.01M7 14L7 14.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 10H14M10 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 11L18 13L20 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
