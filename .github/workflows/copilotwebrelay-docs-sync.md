---
description: Detect code changes under 2.copilotWebRelay/ and sync documentation under 2.copilotWebRelay/docs/
on:
  push:
    branches: [main]
    paths:
      - "2.copilotWebRelay/**"
      - "!2.copilotWebRelay/docs/**"
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: read
  issues: read
tools:
  github:
safe-outputs:
  create-pull-request:
    title-prefix: "docs(2.copilotWebRelay): "
    labels: [documentation]
    draft: true
---

# Copilot Web Relay Documentation Sync

You are an AI agent responsible for keeping `2.copilotWebRelay/docs/` aligned with the source code under `2.copilotWebRelay/`.

## Task

When code changes are pushed under `2.copilotWebRelay/`, analyze the current source code and update documentation in `2.copilotWebRelay/docs/` so source and docs stay consistent.

## Steps

1. Read source code under `2.copilotWebRelay/`.
2. Read existing docs under `2.copilotWebRelay/docs/`.
3. Identify mismatches between implementation and docs.
4. Update or create docs in `2.copilotWebRelay/docs/` to match current behavior.
5. Use `create-pull-request` safe output to open a PR containing documentation updates.

## Guidelines

- Write documentation in Japanese (日本語).
- Document only observed behavior from code.
- Keep updates concise and structured.
- If no updates are needed, call `noop` with a short reason.
- Do not change source code; update docs only.
