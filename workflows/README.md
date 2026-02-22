# Workflows

Markdown SOPs (Standard Operating Procedures) that define how to accomplish specific objectives using the WAT framework.

## Structure of a Workflow

Each workflow file should include:

- **Objective**: What this workflow accomplishes
- **Required Inputs**: What information or data is needed to start
- **Tools Used**: Which scripts in `tools/` are called and in what order
- **Expected Outputs**: Where results end up (cloud service, `.tmp/`, etc.)
- **Edge Cases**: Known failure modes and how to handle them
- **Notes**: Rate limits, timing quirks, discovered constraints

## Naming Convention

Use descriptive, action-oriented filenames:

```
workflows/scrape_website.md
workflows/export_to_sheets.md
workflows/generate_report.md
```

## Adding a New Workflow

1. Create a new `.md` file in this directory
2. Follow the structure above
3. Keep it updated as you discover new constraints or better methods
4. Never overwrite without reviewing the existing content first
