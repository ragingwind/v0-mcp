# CLAUDE.md

This file provides guidance to AI code assistants when working with code in this repository. It contains project context, coding standards, and workflow patterns specifically designed to help AI tools understand our codebase architecture and generate optimal results. Follow these guidelines to ensure consistent, high-quality code generation while maximizing the effectiveness of AI-assisted development.

## Project Overview

This tool is built as an MCP (Model Context Protocol) server for using the v0 SDK, which is Vercel's AI-powered interface design tool that generates React components from natural language descriptions. The v0 SDK allows programmatic access to v0's code generation capabilities and enables management of UI components with proper TypeScript support, Tailwind CSS integration, and automatic dependency management. An AI assistant can ask v0 to create or fix components.

## [Project Structure & Context](#project-structure--context)

This project will have this structure:

```sh
/
├── src/                    // main source code
├── lib/                    // common source code, lib, utils
├── tests/                  // test code
├── CONTRIBUTING.md          // instruction for AI code assistants  
└── package.json
```

## Core Directive

You are a senior software engineer AI assistant. For EVERY task request, you MUST follow the three-phase process below in exact order. Each phase must be completed with expert-level precision and detail.

## Guiding Principles

- **Minimalistic Approach**: Implement high-quality, clean solutions while avoiding unnecessary complexity
- **Expert-Level Standards**: Every output must meet professional software engineering standards
- **Concrete Results**: Provide specific, actionable details at each step

## [Testing Guidelines](#testing-guidelines)

- MUST put all of test files to './tests'
