---
name: obsidian-manager
description: Creates and manages Obsidian notes. All new notes are strictly required to be placed in the "new/" directory. Use this skill when the user asks to create a new note, log a thought, or organize information into Obsidian.
---

# Obsidian Manager

This skill simplifies the process of creating Obsidian-compatible markdown notes with proper frontmatter, ensuring consistently organized storage in the `new/` folder.

## Core Constraint

**CRITICAL:** Every new note created MUST be saved in the `new/` directory at the project root. Never save notes in the root directory or any other folder unless explicitly instructed to move them later.

## Workflow: Creating a Note

1. **Title and Content**: Determine the title and main body of the note.
2. **Tags**: Identify relevant tags for organization.
3. **Execution**: Use the `scripts/create_note.py` script to generate the file.

### Using the script

```bash
python3 scripts/create_note.py "[Title]" "[Content]" --tags "tag1, tag2"
```

The script will:
- Ensure the `new/` directory exists.
- Sanitize the title for the filename (lowercase, hyphens instead of spaces).
- Add YAML frontmatter with title, current date, and tags.
- Save the file as `new/[sanitized-title].md`.
