# TestSprite Setup Guide — depi-code-review

**TestSprite** is an AI-powered automated testing engine that generates, executes, and reports on integration/E2E tests for your running application.

---

## Quick Start

### 1. Get a TestSprite API Key

1. Sign up or log in at **https://www.testsprite.com**
2. Go to **Dashboard → Settings → API Keys**
3. Click **Create API Key** and copy it

---

### 2a. Run via PowerShell Script (Easiest)

```powershell
# Set your key once per session (or add to your profile)
$env:TESTSPRITE_API_KEY = "ts-xxxx..."

# Make sure your dev server is running, then:
.\run-testsprite.ps1
```

The script will:
- Verify the dev server is running on `http://localhost:3000` (starts it if not)
- Write the execution config
- Launch TestSprite to generate and run tests
- Open the test report dashboard when finished

---

### 2b. Run via GitHub Copilot MCP (IDE Integration)

The `.mcp.json` in this workspace registers TestSprite as an MCP tool server for GitHub Copilot.

1. **Add your API key** — edit `.mcp.json` and replace the placeholder:
   ```json
   {
     "mcpServers": {
       "testsprite": {
         "command": "npx",
         "args": ["-y", "@testsprite/testsprite-mcp@latest", "server"],
         "env": {
           "API_KEY": "ts-xxxx-YOUR-ACTUAL-KEY-HERE"
         }
       }
     }
   }
   ```

2. **Restart JetBrains** (or reload MCP servers in the IDE settings)

3. **Start the dev server:**
   ```bash
   pnpm dev
   ```

4. **Ask GitHub Copilot:**
   > "Check my TestSprite account info"

   Then:
   > "Run TestSprite tests for the depi-code-review project at http://localhost:3000"

   Copilot will call the `testsprite_generate_code_and_execute` MCP tool automatically.

---

### 2c. Direct npx Command (after setting API key in env)

```powershell
$env:API_KEY = "ts-xxxx..."
npx @testsprite/testsprite-mcp generateCodeAndExecute
```

> The `testsprite_tests/tmp/config.json` must have `executionArgs.envs.API_KEY` set — the script above handles this automatically.

---

## What Gets Tested

TestSprite uses AI to generate and execute tests based on:

| File | Purpose |
|------|---------|
| `testsprite_tests/standard_prd.json` | Product Requirements — pages, user flows, API endpoints |
| `testsprite_tests/testsprite_frontend_test_plan.json` | Frontend test plan — 20 pre-defined test cases |
| `testsprite_tests/tmp/config.json` | Execution configuration (auto-managed) |

### Test Coverage (pre-defined)

| Suite | Tests |
|-------|-------|
| **TS-001** Landing Page | Hero visible, navigation links, stats section |
| **TS-002** Sign In | Form renders, validation errors, password toggle, GitHub OAuth button |
| **TS-003** Sign Up | Form renders, validation, link back to sign-in |
| **TS-004** Navigation | Protected route redirect, 404 page |
| **TS-005** Theme | Dark theme default |

---

## Test Output

After a run, TestSprite writes results to:

```
testsprite_tests/
  testsprite-mcp-test-report.md      ← Human-readable Markdown report
  testsprite-mcp-test-report.html    ← Interactive HTML dashboard
  tmp/
    test_results.json                ← Raw JSON results
    raw_report.md                    ← Raw AI output
```

To view the dashboard for a previous run:

```powershell
$env:API_KEY = "ts-xxxx..."
npx @testsprite/testsprite-mcp server
# then in Copilot: "Open TestSprite test result dashboard"
```

---

## Requirements

- Node.js >= 22 ✅ (v24 installed)
- Dev server running on `http://localhost:3000`
- TestSprite account + API key

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Execution arguments are not found in config` | Run `run-testsprite.ps1` or fill in `API_KEY` in config.json |
| `401 Unauthorized` | API key is wrong or expired — check testsprite.com/dashboard |
| `Dev server not running` | Run `pnpm dev` first |
| `MCP tools not showing in Copilot` | Restart JetBrains after editing `.mcp.json` |

