# NRPTimeBot

[![CI](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/actions/workflows/ci.yml/badge.svg)](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/actions/workflows/ci.yml)
[![CodeQL](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/actions/workflows/codeql.yml/badge.svg)](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/security/code-scanning)
[![Docker Image](https://img.shields.io/badge/ghcr.io-the--a--p--o--l--l--o--organization-orange?logo=docker)](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/pkgs/container/nrptimebot)
[![Latest Release](https://img.shields.io/github/v/tag/The-A-P-O-L-L-O-Organization/NRPTimeBot)](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/releases)
[![License](https://img.shields.io/github/license/The-A-P-O-L-L-O-Organization/NRPTimeBot)](LICENSE)

A [discord.js](https://discord.js.org)-based Discord bot for in-game time & schedule management, with a protobuf-based inter-bot messaging API ([Interlink](#interlink)) built on [ConnectRPC](https://connectrpc.com).

## Features

- **In-game time tracking** — configurable time rate (`years per day`), manual time setting, pause/resume, reset, and a `/time` lookup command
- **Persistent state** — bot state survives restarts via a JSON store in `data/`
- **Announcements** — send greeting announcements to a configured channel
- **Maintenance override system** — time-limited override codes printed to the bot logs for authorized users
- **Interlink client** — HMAC-SHA256-signed RPC communication with other Apollo bots (register, heartbeat, subscribe, send) using protobuf envelopes over ConnectRPC
- **Runs as a container** — production Docker image with a non-root user, resource limits, and log rotation

## Slash Commands

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `/time`               | Show the current in-game time                     |
| `/setrate years:<n>`  | Set the in-game rate in years per day             |
| `/settime years:<n>`  | Manually set the current in-game year             |
| `/pause`              | Pause time progression                            |
| `/resume`             | Resume time progression                           |
| `/reset`              | Reset time to year 0 and pause                    |
| `/announce`           | Send a greeting announcement to the channel       |
| `/maintenance on/off` | Toggle the maintenance override (authorized only) |

## Getting Started

### Prerequisites

- **Node.js 26** and **pnpm 12** (enabled via [corepack](https://nodejs.org/api/corepack.html))
- A Discord bot token — create an application on the [Discord Developer Portal](https://discord.com/developers/applications) if you don't have one

### Local development

```bash
git clone https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot.git
cd NRPTimeBot
corepack enable
pnpm install
```

Create a `.env` file in the project root:

```ini
# Required
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-application-client-id

# Optional — Interlink ConnectRPC client
INTERLINK_ADDRESS=https://your-interlink-server
INTERLINK_AUTH_KEY=your-interlink-auth-key
INTERLINK_BOT_ID=nrp-time-bot
```

Register the slash commands with Discord, then run the bot:

```bash
pnpm build
pnpm run register-commands
pnpm start
```

### Docker

The prebuilt image is published to GHCR on every push to `main` and on tagged releases:

```bash
docker pull ghcr.io/the-a-p-o-l-l-o-organization/nrptimebot:latest
```

Or build and run locally with the provided compose file (reads the same `.env`):

```bash
docker compose up -d
```

State is persisted by mounting `./data:/app/data`.

## Development

| Script                          | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                      | Build and start the bot locally                             |
| `pnpm build`                    | Compile TypeScript into `dist/`                             |
| `pnpm typecheck`                | Type-check without emitting                                 |
| `pnpm test`                     | Run tests with vitest and coverage (v8)                     |
| `pnpm check` / `pnpm check:fix` | Biome lint + format check (with autofix)                    |
| `pnpm proto:generate`           | Regenerate protobuf types into `src/generated/`             |
| `pnpm release`                  | Run semantic-release dry gate (CI performs actual releases) |

### Tech stack

- **Runtime:** Node.js 26, pnpm 12
- **Language:** TypeScript 7
- **Bot framework:** discord.js 14
- **RPC:** [ConnectRPC (connect-es) v2](https://connectrpc.com) + [Protobuf-ES](https://protobufes.com)
- **Testing:** vitest 5 with v8 coverage (enforced thresholds)
- **Linting/formatting:** Biome 2
- **Releases:** semantic-release with [conventional commits](https://www.conventionalcommits.org) — commits must follow the convention; releases are cut automatically on `main`

## Interlink

Interlink is Apollo's inter-bot messaging layer. `/proto` contains the protobuf definitions (protobuf-es generated service descriptors live in `src/generated/`). The bot authenticates its requests with HMAC-SHA256 request signatures (procedure, timestamp, nonce, canonical body hash) and maintains registration + heartbeats against the configured server. See `src/interlink/client.ts` for the reference client implementation.

## Contributing

Contributions are welcome! Please read the [contributing guide](CONTRIBUTING.md) before opening a pull request, and note our [code of conduct](CODE_OF_CONDUCT.md).

## Security

To report a security vulnerability, please read our [security policy](SECURITY.md) — do **not** open a public issue for vulnerabilities.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

### How to Apply These Terms to Your New Programs

<details>
<summary>License notice instructions (from the GNU GPL v3 text)</summary>

If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

To do so, attach the following notices to the program. It is safest
to attach them to the start of each source file to most effectively
state the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

```
    NRPTimeBot, a discord.js-based in-game time and schedule
    management Discord bot.
    Copyright (C) 2026  Mitchell Sehenuk (CodeMaster013)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

Also add information on how to contact you by electronic and paper mail.

If the program does terminal interaction, make it output a short
notice like this when it starts in an interactive mode:

```
    NRPTimeBot  Copyright (C) 2026  Mitchell Sehenuk (CodeMaster013)
    This program comes with ABSOLUTELY NO WARRANTY; for details type `show w'.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type `show c' for details.
```

The hypothetical commands `show w' and `show c' should show the appropriate
parts of the General Public License. Of course, your program's commands
might be different; for a GUI interface, you would use an "about box".

You should also get your employer (if you work as a programmer) or school,
if any, to sign a "copyright disclaimer" for the program, if necessary.
For more information on this, and how to apply and follow the GNU GPL, see
<https://www.gnu.org/licenses/>.

</details>
