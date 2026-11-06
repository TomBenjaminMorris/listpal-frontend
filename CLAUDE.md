# ListPal Frontend

## Comments

- Comments explain why, not what. Do not add comments that restate the code.

## Diagrams

- Always write diagrams in Mermaid, inside a fenced `mermaid` code block. Do not use ASCII art, images or other diagram formats.
- Diagrams are encouraged wherever they aid understanding, such as request flows, data relationships, schedules and infrastructure layout.
- Keep each diagram focused on one idea, and update it whenever the code it describes changes.

## Keep ARCHITECTURE.md up to date

Before creating a PR, check that `ARCHITECTURE.md` reflects all the changes on the branch, and update it if it does not.

## Specialist reviewers

`.claude/agents/` holds three read-only reviewers: `security-reviewer`, `performance-reviewer` (bugs and speed) and `complexity-reviewer` (maintainability). Don't run them during ordinary work. The `pr` skill decides which ones a change needs before it is committed, and the user can ask for any of them at any time, for a diff or the whole repo.
