# Auth Specification

## Requirements

### Requirement: Custom Auth Error Page

The system MUST provide a user-friendly error page at `/auth/error` to handle authentication failures and provide clear feedback.

#### Scenario: User encounters an authentication error
- GIVEN the user is redirected to `/auth/error` with a `message` or `code` query parameter.
- WHEN the page loads.
- THEN it MUST display a descriptive error message based on the parameter.
- AND it MUST provide a "Volver al login" button that redirects to `/login`.

#### Scenario: Direct access to auth error page without parameters
- GIVEN the user navigates directly to `/auth/error`.
- WHEN the page loads.
- THEN it MUST display a generic authentication error message.
- AND it MUST provide a link to return to the home or login page.
