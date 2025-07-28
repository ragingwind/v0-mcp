import { config } from 'dotenv';
config({ path: '.env.local' });

import { extractV0Text } from '../src/lib.js';

function testExtractV0TextFromThinking() {
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
  console.log('Extracted Thinking:', result.think);
  console.log('Extracted Code Project:', result.codeProject);
}

function testExtractV0TextFromCodeProject() {
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

  console.log('Extracted Thinking:', result.think);
  console.log('Extracted Code Project:', result.codeProject);
  console.log('Code Project includes "tsx file":', result.codeProject.includes('tsx file'));
}

testExtractV0TextFromThinking();
testExtractV0TextFromCodeProject();
