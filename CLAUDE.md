# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important
- ALL instructions within this document MUST BE FOLLOWED, these are not optional unless explicitly stated.
- ASK FOR CLARIFICATION If you are uncertain of any of thing within the document.
- DO NOT edit more code than you have to.
- DO NOT WASTE TOKENS, be succinct and concise.

## Sub Agents
- Run coding task related to any **frontend code** with `frontend-developer` agent
- Run coding task related to any **backend code** with `backend-developer` agent

## Project Overview

This is a Wix App called "purchase-order" built using the Wix CLI and dashboard framework. It's a React-based application for managing purchase orders with dashboard pages for the main interface and partners management.

## Architecture

### Tech Stack
- **Framework**: React 16.14.0 with TypeScript
- **UI Components**: @wix/design-system for consistent Wix styling
- **Icons**: @wix/wix-ui-icons-common
- **Dashboard**: @wix/dashboard for Wix platform integration
- **State Management**: MobX (mobx, mobx-utils)

## Development Workflow

1. **Type Safety**: Always run `npm run typecheck` after completing a task that include code update

## Development Notes
- When working with Wix APIs, favor the Wix SDK over REST interfaces
- All source files are in the `src` directory with rootDir set accordingly
- Don't create abstractions that don't add value.