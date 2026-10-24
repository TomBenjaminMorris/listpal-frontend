---
name: deploy
description: Release the ListPal frontend to production. Builds clean origin/main, uploads it to the S3 bucket behind CloudFront and invalidates the cache. Use when asked to deploy, release or ship the frontend.
disable-model-invocation: true
---

# Deploy the ListPal frontend

The site is a static Vite build served from S3 through CloudFront. There is no pipeline, so a release is done by hand with the AWS CLI. This skill repeats the steps used for the weekly-roundups removal release.

## Rules

- This is production. Run read-only commands freely, but ask the user before every command that changes something: merging a PR, the real `aws s3 sync`, `create-invalidation`, and any `--delete`.
- Always build from a clean checkout of `origin/main`, never from the working tree. The working tree often holds uncommitted edits that would ship (for example a hidden sidebar link).
- Summarise dry-run output as counts. The full listing runs to hundreds of lines.

## Known facts (verify, do not trust blindly)

| Item | Value |
| --- | --- |
| Live site | `https://www.listpal.dev.vinsp.in` |
| S3 bucket | `www.listpal.dev.vinsp.in`, region `eu-west-2` |
| App distribution | `E1AKHSV400BS9K`, alias `www.listpal.dev.vinsp.in` |
| Redirect distribution | `EDUADQYS21979`, alias `listpal.dev.vinsp.in`. Only redirects to `www`. Never invalidate it. |
| AWS account | `905016994436`, IAM user `terraform_user`, default profile, access keys |
| Cache TTL | One year (`min_ttl`, `default_ttl` and `max_ttl` are all 31536000), so the invalidation is required |
| Infra | `terraform/main.tf` uses the private `static-website` module from `tf-modules`. The module has no outputs, so the IDs cannot come from `terraform output`. Look them up by alias. |

## Steps

1. **Confirm the change is merged.** Check with `gh pr view <number> --json state,mergedAt`. If it is not merged, ask the user to merge it. The auto-mode classifier may block `gh pr merge`, in which case the user can merge in the browser. Do not work around a denial.

2. **Make a clean worktree of main.**
   ```sh
   git fetch origin
   W="$(mktemp -d)/release"
   git worktree add --detach "$W" origin/main
   git -C "$W" log --oneline -1
   ```
   Do not use `git checkout main` in the user's checkout. It is refused when they have local edits to files that differ between branches, and stashing is theirs to decide.

3. **Copy the config.** `src/config.json` is gitignored (public Cognito identifiers, no secrets) and the build fails without it.
   ```sh
   cp src/config.json "$W/src/config.json"
   ```
   Run from the user's repo root. If the file is missing, stop and ask.

4. **Build.**
   ```sh
   cd "$W" && npm ci && npm run build
   ```
   `npm run build` runs `tsc` then `vite build`. Stop on any error. If the release removed a feature, grep `dist/assets/*.js` to confirm its strings are gone.

5. **Check AWS access** (read-only): `aws sts get-caller-identity`. If it fails or shows an unexpected account, ask the user to run `! aws configure` (access keys, default profile). Do not ask for or print keys. CloudFront is global. S3 commands need `--region eu-west-2` because the default profile region is `eu-west-1`.

6. **Look up the distribution** (read-only):
   ```sh
   aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items,'www.listpal.dev.vinsp.in')].{Id:Id,Origin:Origins.Items[0].DomainName,Status:Status}" --output table
   ```
   The ID must match `E1AKHSV400BS9K` and the origin must be the `www.listpal.dev.vinsp.in` bucket. If not, stop and tell the user.

7. **Dry run the upload** (changes nothing). Write the output to a file and report counts:
   ```sh
   aws s3 sync dist/ s3://www.listpal.dev.vinsp.in --dryrun --region eu-west-2 > "$W/../dryrun.txt"
   grep -c upload: "$W/../dryrun.txt"
   ```
   Run it from `$W`. Expect the new `index.html` and the new hashed `assets/index-*` files. Show the counts and ask the user to approve the real upload.

8. **Upload, then invalidate straight away.** Do not add `--delete` here.
   ```sh
   aws s3 sync dist/ s3://www.listpal.dev.vinsp.in --region eu-west-2
   aws cloudfront create-invalidation --distribution-id E1AKHSV400BS9K --paths "/*"
   ```
   Poll until the status is `Completed` (usually under a minute):
   ```sh
   aws cloudfront get-invalidation --distribution-id E1AKHSV400BS9K --id <InvalidationId> --query Invalidation.Status --output text
   ```
   Old bundles stay in the bucket on purpose. A visitor holding a stale cached `index.html` still needs them until the invalidation finishes.

9. **Verify the live site.**
   ```sh
   curl -s https://www.listpal.dev.vinsp.in/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.(js|css)'
   curl -s -o /dev/null -w "%{http_code}\n" https://www.listpal.dev.vinsp.in/assets/<new bundle>.js
   ```
   The names must match the files in `dist/assets`, and the bundle must return 200. Unknown paths such as `/weekly-roundups` also return 200, because CloudFront maps S3's 403 to `/index.html` for the single-page app. That is expected.

10. **Clean up the worktree.** Once nothing else needs `dist`:
    ```sh
    git worktree remove --force "$W" && git worktree prune
    ```

## Optional: prune old bundles

Only when the user asks, and only after the release is confirmed healthy. Old hashed bundles pile up in the bucket (233 files, about 134 MB, were cleared once). This step needs a `dist` from the current release, so run it before step 10 or rebuild.

1. Dry run with `--delete` and write it to a file.
2. Check that every delete is under `assets/index-*.js` or `.css`, that there are no deletes elsewhere, and that the live bundle names are not in the list.
3. Show the counts, get approval, then run it without `--dryrun`.

## Gotchas

- Do not invalidate `EDUADQYS21979`. It serves only the redirect to `www`.
- The Cognito login domain `auth.listpal.dev.vinsp.in` sits behind an AWS-managed distribution. It is not part of this deploy.
- The `terraform_user` keys are broad. If the user mentions a narrower deploy user, switch to that profile with `--profile`.
- If a command is denied, stop and explain what you were trying to do. Do not retry it another way.
