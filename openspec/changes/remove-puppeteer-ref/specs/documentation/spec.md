## MODIFIED Requirements

### Requirement: Accurate Technical Description
The project documentation MUST accurately describe the technical implementation of the browser GUI launcher.

#### Scenario: Reading Feature List
- **Given** a user reads the "Features" or "How it works" section
- **When** they look at the GUI launcher description
- **Then** they MUST NOT see "Puppeteer" mentioned as the driver
- **And** they MUST see that it uses the system's native browser (Chrome/Edge/Chromium)

### Requirement: Minimal Installation Instructions
The installation instructions MUST only include necessary packages.

#### Scenario: Installing the Package
- **Given** a user follows the "Installation" guide
- **When** they see the install command
- **Then** it MUST NOT include `puppeteer`
