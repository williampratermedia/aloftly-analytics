# Tools

Python scripts for deterministic execution. Each script handles a specific task (API calls, data transformations, file operations, database queries).

## Conventions

- Scripts are standalone and runnable from the project root
- Credentials and API keys are loaded from `.env` (never hardcoded)
- Scripts should be idempotent where possible
- Output to `.tmp/` for intermediate files, or directly to cloud services for final deliverables

## Usage

Run tools from the project root:

```bash
python tools/<script_name>.py
```

## Adding a New Tool

1. Create a new `.py` file in this directory
2. Load credentials from `.env` using `python-dotenv`
3. Document inputs/outputs in the script docstring
4. Reference the tool in the relevant workflow
