# OceanOS Skill Manifest Spec

Every installable skill MUST expose a `manifest.json` at `<skill>/manifest.json` or a `name`, `version`, and `description` in `SKILL.md` frontmatter.

## Required fields

- `name`: slug, lowercase, hyphens only, unique across marketplace
- `version`: semver, default `0.1.0`
- `description`: one sentence, plain text
- `author`: string

## Optional fields

- `tags`: array of strings
- `price_cents`: int, `0` = free
- `license_key_required`: bool
- `source_repo`: GitHub URL for auditability
- `entrypoint`: relative path to executable script inside the skill folder
- `permissions`: array of Ocean tool names the skill uses (for trust/reviews)

## Prohibited

- No secrets in manifest
- No absolute paths
- No auto-exec on install; explicit `hermes skills run <name>` only
