---
name: pr
description: Raise a pull request for the current ListPal frontend work and leave it open, with a description written for later auditing. Invoke straight away whenever the user's whole message is "PR" (any case, with or without punctuation), and whenever they ask to raise, open or create a PR without merging it. Typing "PR" is the go-ahead, so do not ask for confirmation. Not for reviewing or asking about an existing PR, such as "review PR 77", or for raising a PR and merging it, which the merge skill handles.
---

# Raise a frontend PR

The user types "PR" when the work is ready for a pull request. That one word authorises committing, pushing and opening the PR. It stops there: don't merge, as merging deploys.

The `merge` skill follows these same steps before it merges.

## Steps

### 1. Work out what goes in the PR

```sh
git status --short
git branch --show-current
git log --oneline origin/main..HEAD
gh pr view --json number,state,baseRefName,url
```

- **Open PR on this branch:** use it. Commit any further work for it, and update the description with `gh pr edit` so it covers the whole branch.
- **Nothing uncommitted and no commits ahead of main:** say there is nothing to raise and stop.

The user may be editing other files at the same time, so only include files that belong to this work. If some changes clearly belong to something else, leave them uncommitted and say so. Ask only if you can't tell what the work is.

### 2. Check the work

```sh
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
./node_modules/.bin/vite build --outDir "$(mktemp -d)" --emptyOutDir
```

The separate `--outDir` leaves the local `dist` alone. A failure doesn't stop the PR, as an open PR is a fair place for unfinished work. Put the failure in the Testing section and tell the user about it.

Check that `ARCHITECTURE.md` reflects the branch and update it if not, as `CLAUDE.md` requires.

### 3. Run the specialist reviews

Three reviewer agents live in `.claude/agents/`. Each takes a few minutes, so run only the ones the diff calls for:

| Reviewer | Run it when the change touches |
| --- | --- |
| `security-reviewer` | `authService.js`, `accountService.js`, `RedirectPage.jsx` or anything else handling tokens or sign-in, text from the API or the AI rendered as anything but plain text, URLs or redirects built from data, `terraform/` hosting or headers, the workflows, or `package.json` dependencies |
| `performance-reviewer` | `syncEngine.js`, IndexedDB, `refreshOnReturn.js`, state or effects in `App.jsx`, rendering of task or board lists, timers or animations, API calls, or a new dependency |
| `complexity-reviewer` | roughly 150 or more changed lines in `src/` (CSS aside), a new component or util, a refactor, or a component that has grown past about 300 lines |

Run none for styling, copy, docs or tests alone. If the PR already had these reviews and only small fixes have followed, don't run them again.

Start the chosen reviewers in parallel, in one message, and name the files in this work so they leave unrelated edits alone. If the session started outside this repo, the agent types aren't listed: use a `general-purpose` agent with the agent file's body as its prompt instead.

Then act on the findings:

- **High:** fix it if the fix is clear and inside this work, then rerun the checks. Otherwise leave it open and treat it as a failed check, which stops a merge.
- **Medium:** fix it if it's small and inside this work. Otherwise report it.
- **Low:** report it only.

If you think a finding is wrong, don't fix it: say why in the report.

The repo is public. Never put an open security finding in a commit message, the PR description or a PR comment. Tell the user only. In the Testing section, name the reviews that ran and say their findings were fixed or reported.

### 4. Commit and push

If on `main`, branch first, as `fe/<short-description>`. Stage files by name, never with `git add -A` or `git add .`, then read `git diff --cached --stat` to confirm the list is right. `src/config.json` is gitignored and must stay out.

Follow the repo's commit style: a short imperative subject and a brief why. Push with `git push -u origin <branch>`.

### 5. Raise the PR

Use `gh pr create --base main` with the description format below, as its own tool call.

### 6. Report

Give the PR link, the check results, which reviews ran and any findings left open, and anything left uncommitted. Mention that the checkout is still on the PR's branch, and that typing "Merge" will merge it.

## PR description

The reader is someone looking back months later to see what was added and why, with no memory of this conversation. Aim for 100–250 words: enough to understand and audit the change without opening the diff, without narrating every file. Very small changes can be shorter, but keep every section.

Title: plain and imperative, naming the feature or fix rather than the files ("Fade every alert in instead of only some").

```markdown
**Type:** feature | fix | improvement | refactor | docs | chore

## Why
The problem or goal, in terms of what a user saw or needed.

## What changed
3–6 bullets describing behaviour, grouped by what it does rather than by file. Name a component or file only where it helps someone find the code later. Include any decision a reader might otherwise question.

## Testing
What was actually run and the result, and what was not tested. Say so if something was only checked against a mock API rather than a signed-in board.

## Deploy and follow-ups
That merging deploys it, any order it depends on with a backend PR (link it), and any known gaps.
```

End with the attribution lines the session specifies, if any. Keep to observed facts: don't claim a test ran unless it did. Leave out session details such as "as discussed", and anything personal or secret.

The `Type` line and consistent headings make the history searchable:

```sh
gh pr list --state merged --limit 200 --search '"Type: feature" in:body' --json number,title,mergedAt
```
