# Contributing to NRPTimeBot

First off, thank you for considering to contribute! 🎉

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting started

1. Fork the repository and create your branch from `main`
2. Install **Node.js 26** and **pnpm 12** (enable with `corepack enable`)
3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Create a `.env` file for local development (see the [README](README.md#getting-started))

## Development workflow

Before opening a pull request, make sure everything passes locally:

```bash
pnpm typecheck   # TypeScript 7 type check
pnpm check       # Biome lint + format check
pnpm test        # vitest with coverage thresholds
pnpm build       # production build must succeed
```

### Style

- Formatting and linting are handled by **Biome**. Run `pnpm check:fix` to auto-fix issues before committing
- New features should come with tests; keep overall coverage above the enforced thresholds (80% statements/lines, 70% branches)

### Protobuf changes

If you change anything under `proto/`, regenerate the generated code:

```bash
pnpm proto:generate
```

Commit refreshed `src/generated/` files together with the `.proto` change (the CI build verifies that generation is reproducible and that build output is intact).

### Docker

If your change affects the runtime image, test the image locally:

```bash
docker compose up -d
docker logs -f nrp-time-bot
```

## Commit messages

This repo uses **[Conventional Commits](https://www.conventionalcommits.org)** and **semantic-release**: releases, tags, and the changelog are generated automatically from commit messages on `main`.

Use the format `type(scope?): description`. Common types:

| Type       | Triggers   | Use for                                            |
| ---------- | ---------- | -------------------------------------------------- |
| `fix`      | patch ⬆    | Bug fixes                                          |
| `feat`     | minor ⬆    | New features                                       |
| `perf`     | patch ⬆    | Performance improvements                           |
| `refactor` | —          | Code changes that neither fix nor add features     |
| `docs`     | —          | Documentation changes                              |
| `test`     | —          | Adding or fixing tests                             |
| `chore`    | —          | Maintenance, tooling, dependencies                 |
| `ci`       | —          | CI/CD changes                                      |

Breaking changes: add `!` after the type (e.g. `feat!: ...`) or include a `BREAKING CHANGE:` footer — this triggers a major semver bump.

Examples:

```
feat(timekeeper): add scheduled epoch events
fix(storage): prevent corrupted state after crash
chore(deps): update discord.js to 14.28.1
```

> Husky runs pre-commit hooks (format/lint checks), so malformed commits are caught early.

## Pull requests

- Keep PRs focused; one feature or fix per PR
- Include a short description of **what** changed and **why**
- Link any related issues (`Fixes #123`)
- CI must pass on your PR (lint, typecheck, tests, build, security audit)
- Do not include generated artifacts (e.g. `coverage/`, `dist/`) in your changes — they are gitignored

## Reporting issues

- **Bugs:** open a [bug report](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/issues/new?template=bug_report.yml) with reproduction steps and logs
- **Features:** propose new features via a [feature request](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/issues/new?template=feature_request.yml)
- **Security vulnerabilities:** do **not** open a public issue — follow the [security policy](SECURITY.md)

## Questions?

Open a [discussion](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/discussions) or an issue and we'll help.
