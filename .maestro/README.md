# Maestro E2E Tests

End-to-end UI tests for SocialChefAI using [Maestro](https://maestro.dev/).

## Prerequisites

- Java 17+
- Maestro CLI installed:
  ```bash
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  ```

## Running Tests

### Start the dev server first:
```bash
npm run dev
```

### Run all tests:
```bash
maestro test .maestro/flows/
```

### Run a specific test:
```bash
maestro test .maestro/flows/landing-page.yaml
```

### Run with custom URL (staging/production):
```bash
APP_URL=https://staging.socialchef.ai maestro test .maestro/flows/
```

### Run tests that require authentication:
```bash
TEST_EMAIL=test@example.com TEST_PASSWORD=secret123 maestro test .maestro/flows/dashboard.yaml
```

## Interactive Testing with Maestro Studio

Launch the visual test builder:
```bash
maestro -p web studio
```

This opens a browser where you can:
- Explore the app visually
- Record interactions
- Generate test commands automatically

## Test Structure

```
.maestro/
├── config.yaml              # Global configuration
├── flows/
│   ├── landing-page.yaml    # Landing page tests
│   ├── login.yaml           # Login flow tests
│   ├── dashboard.yaml       # Dashboard tests (requires auth)
│   └── business-management.yaml  # Business CRUD tests
└── README.md
```

## Writing Tests

Maestro uses YAML for test definitions. Example:

```yaml
appId: http://localhost:5173
---
- launchApp
- tapOn: "Login"
- assertVisible: "Sign in"
- inputText: "test@example.com"
- tapOn: "Submit"
```

### Common Commands:
- `launchApp` - Open the app/URL
- `tapOn: "text"` - Click element with text
- `inputText: "value"` - Type into focused field
- `assertVisible: "text"` - Verify element is visible
- `scrollUntilVisible` - Scroll to find element
- `takeScreenshot` - Capture screenshot

See [Maestro Docs](https://docs.maestro.dev/api-reference/commands) for full command reference.

## CI Integration

Add to your CI pipeline:

```yaml
- name: Run E2E Tests
  run: |
    npm run build
    npm run preview &
    sleep 5
    maestro test .maestro/flows/
```
