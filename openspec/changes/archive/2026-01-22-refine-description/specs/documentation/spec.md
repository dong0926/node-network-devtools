## ADDED Requirements

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
