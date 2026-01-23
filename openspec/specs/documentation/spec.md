# documentation Specification

## Purpose
TBD - created by archiving change update-readme. Update Purpose after archive.
## Requirements
### Requirement: Project Status Visibility
The project documentation MUST prominently display the current build and coverage status to inform users of the project's health.

#### Scenario: Displaying Project Health
- **Given** a user visits the project repository
- **When** they look at the top of the README (in either language)
- **Then** they should see a "CI" badge indicating the build status
- **And** they should see a "codecov" badge indicating test coverage

#### Scenario: Badge Links
- **Given** the badges are displayed
- **When** the user clicks the "CI" badge
- **Then** they should be taken to the GitHub Actions CI workflow page
- **When** the user clicks the "codecov" badge
- **Then** they should be taken to the Codecov dashboard for the project

### Requirement: Accurate Technical Description
The project documentation MUST accurately describe the technical implementation of the browser GUI launcher.

#### Scenario: Reading Feature List
- **Given** a user reads the "Features" or "How it works" section
- **When** they look at the GUI launcher description
- **Then** they MUST NOT see "Puppeteer" mentioned as the driver
- **And** they MUST see that it uses the system's native browser (Chrome/Edge/Chromium)

### Requirement: Consistent Branding
All project entry points (README, package.json, index.ts) MUST have a consistent description that focuses on the Web GUI.

#### Scenario: Checking package.json
- **Given** a developer checks the `package.json` description
- **When** they read it
- **Then** it MUST NOT mention "Chrome DevTools integration".

### Requirement: Minimal Installation Instructions
The installation instructions MUST only include necessary packages.

#### Scenario: Installing the Package
- **Given** a user follows the "Installation" guide
- **When** they see the install command
- **Then** it MUST NOT include `puppeteer`

### Requirement: Compelling Project Description
The project description MUST clearly state the tool's purpose, its zero-config nature, and the types of requests it can intercept.

#### Scenario: Reading README Header
- **Given** a user opens the README
- **When** they read the header and first paragraph
- **Then** they MUST immediately understand that it's a zero-config network monitor for Node.js
- **And** they MUST see that it supports both standard http and modern fetch/undici

### Requirement: Prioritized Programmatic Usage
The usage section MUST prioritize the programmatic integration method as the standard way to use the tool.

#### Scenario: Quick Start
- **Given** a new user wants to try the tool
- **When** they look at the "Quick Start" or "Usage" section
- **Then** they should see the programmatic `install()` method first
- **And** the CLI argument method (`--import` / `-r`) should be presented as an "Advanced" or "Zero-Code" alternative

