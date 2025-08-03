# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Wix App called "purchase-order" built using the Wix CLI and dashboard framework. It's a React-based application for managing purchase orders with dashboard pages for the main interface and partners management.

## Architecture

### Tech Stack
- **Framework**: React 16.14.0 with TypeScript
- **UI Components**: @wix/design-system for consistent Wix styling
- **Icons**: @wix/wix-ui-icons-common
- **Dashboard**: @wix/dashboard for Wix platform integration
- **State Management**: MobX (mobx, mobx-utils)

### Project Structure

## Development Commands


## Development Workflow

1. **Type Safety**: Always run `npm run typecheck` after completing a task that include code update

## Development Notes
- When working with Wix APIs, favor the Wix SDK over REST interfaces
- TypeScript configuration extends @wix/cli-app/tsconfig.app.json
- All source files are in the `src` directory with rootDir set accordingly
- Don't create abstractions that don't add value.