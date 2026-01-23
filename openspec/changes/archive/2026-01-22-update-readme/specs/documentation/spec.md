## ADDED Requirements

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
