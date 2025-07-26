import { describe, it, expect } from 'vitest';
import { extractV0Text } from '../src/sdk.js';

describe('extractV0Text', () => {
  it('should extract the thinking and code project from the text', () => {
    const text =
      '<Thinking>\n' +
      'The user is very clear about their requirements:\n' +
      'They want a form button component with:\n' +
      'I need to create just one component file with detailed descriptions and comments.\n' +
      '</Thinking>\n' +
      '\n' +
      '<CodeProject id="simple-button">\n' +
      '\n' +
      'import type React from "react"\n' +
      'import { type ButtonHTMLAttributes, forwardRef } from "react"\n' +
      '</CodeProject>\n' +
      '\n';

    const result = extractV0Text(text);

    expect(result.think.length > 0).toBe(true);
    expect(result.codeProject.length > 0).toBe(true);
  });

  it('should extract the code project from the text', () => {
    const text =
      '<CodeProject id="simple-button">\n' +
      '```tsx file="validated-input-component.tsx"\n' +
      'use client\n' +
      '\n' +
      'import type React from "react"\n' +
      'import { type ButtonHTMLAttributes, forwardRef } from "react"\n' +
      '</CodeProject>\n' +
      '\n';

    const result = extractV0Text(text);

    expect(result.think.length > 0).toBe(false);
    expect(result.codeProject.length > 0).toBe(true);
    expect(result.codeProject.includes('tsx file')).toBe(false);
  });
});
