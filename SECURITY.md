# Security Policy

## Supported versions

Security patches are only applied to the latest release and the `main` branch. When running the bot, always use the latest tagged release or the `latest` container image:

- **Docker image:** `ghcr.io/the-a-p-o-l-l-o-organization/nrptimebot:latest`
- **Releases:** [GitHub Releases](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/releases)

## Reporting a vulnerability

Please **do not report security vulnerabilities through public GitHub issues.**

The preferred way to report a vulnerability is through **GitHub's private vulnerability reporting**:

1. Go to the repository's **Security** tab
2. Click **Report a vulnerability**
3. Provide as much detail as you can: affected component, reproduction steps, impact, and any proof-of-concept

We will acknowledge your report, keep you informed of progress toward a fix, and credit you in the release notes if you wish.

Disclosures that follow this process are greatly appreciated by the maintainers and the open-source community as a whole.

## Security-relevant components

- **Discord bot runtime** (`src/index.ts`, commands in `src/*.ts`) — interaction handling, authorization checks for the maintenance override
- **Interlink RPC client** (`src/interlink/client.ts`) — HMAC-SHA256 request signing, nonces, timestamp headers used to authenticate bot-to-bot traffic
- **Container image** (`Dockerfile`) — runs as a non-root `nodejs` user, pinned Node 26 alpine base
- **Supply chain** — pnpm lockfile with `--frozen-lockfile` installs in CI and Docker; dependencies are scanned by `pnpm audit`, OWASP Dependency-Check, Dependabot, and CodeQL

## Third-party dependencies

Dependency updates are managed through [Dependabot](https://github.com/dependabot) and release on `main` only after lint, typecheck, tests, build, and the security audit workflow pass.

## Scope

Please only report exploitable vulnerabilities in this codebase and its default configuration (for example: token leakage, unauthorized use of privileged commands, signature forgery or replay in the Interlink client, container escape). Do not report issues in third-party Discord, GHCR, or Edge infrastructure itself.
