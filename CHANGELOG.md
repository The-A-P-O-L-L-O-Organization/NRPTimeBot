## [1.0.1](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/compare/v1.0.0...v1.0.1) (2026-11-07)

### Bug Fixes

* **ci:** drop interlink_connect.js from build output check (removed in connect v2) ([415ae55](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/415ae5565c7ca9906de231aa998ea626be5a26aa))
* **release:** force conventional-changelog-writer >=9 for semantic-release ([75a3774](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/75a3774dcf486792b128076a6bd10f0a868850d6))

## 1.0.0 (2026-11-07)

### Features

* add /announce command for bot greeting ([f0bc803](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/f0bc80359234273bbe4074fd64649d59e226dd2f))
* add /maintenance override system for authorized user ([7b33f90](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/7b33f9012abe51df795b29f6c14b06befe83627f))
* add /reset command that sets time to 0 and pauses ([c1cf1ce](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/c1cf1cedc744441c1e4c740b57ee2565a6b99925))
* add admin permission checks for management commands ([7f7984b](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/7f7984bac2d3abcbf988e3f6a9f1587c3fce8b47))
* add bot entry point with slash command handlers ([58995d2](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/58995d295c05962f955584f76e6acc1ceacbe57d))
* add Gregorian calendar conversion module ([9ebec01](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/9ebec016c8067ce5862823ca36435404e782917a))
* add interlink HTTP endpoint for Apollo cross-bot override ([e44cd77](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/e44cd77743dd934117d3efde117d90f0c2329733))
* add standalone command registration script ([784efd8](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/784efd80d75d68d9df4f5f199dfdd7b5935024df))
* add storage module with JSON state persistence ([3bd1d1f](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/3bd1d1ffd6d6612604f8e77432c61fc7a3d5e6d7))
* add timekeeper module for time calculation and formatting ([821e0f1](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/821e0f1d0a02eff5f354451886892062e40e5619))
* announce year progression to channel 1520917412046700606 ([5a9dccf](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/5a9dccf87abfb6a0a71acf53d1db16823194020b))
* hide admin commands from non-admins in Discord UI ([e86e62b](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/e86e62b8019ded1a043621f2ba9b282a03d5b5a5))
* Rewrite interlink to use ConnectRPC protocol ([933eb79](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/933eb793d10f736c3503827512ce0d76f97b900c))
* **tooling:** add comprehensive development tooling ([db2041b](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/db2041b769ea17973d5849748ce13cbfc7f46551))
* use embed for /time command output ([0388b16](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/0388b16a0b607eb50aed40a7b1ddd00298ca0624))
* use embed for year announcement ([c699ce1](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/c699ce101e988a65f8ce49bf029af9b6000f9d14))

### Bug Fixes

* **build:** use local buf plugins instead of remote BSR plugins ([57cc111](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/57cc111dad4c312f2d46134a1f02659d2fe620a7))
* **ci:** add .npmrc with minimum-release-age=0 ([2a13dd1](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/2a13dd11789fa02ded156b2e7a58aff8d944b743))
* **ci:** disable pnpm minimum release age check ([88a90e4](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/88a90e49863f7036bcb975b3632ed4b35aa5d3c8))
* **ci:** pin all GitHub Actions to commit SHAs per org policy ([e4d5848](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/e4d5848a409566ba4f0c9bb5e86fe57c480d7f1f))
* **ci:** remove pnpm version from action config ([ecd7d4f](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/ecd7d4f39898efd41e8b7bd9948ac7a888335689))
* **ci:** set pnpm minimum-release-age via config command ([76026f3](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/76026f3e394c29f35d8e0ef84ea35efa335f3bca))
* **docker:** disable pnpm minimum release age check inside container ([986ccf2](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/986ccf271b43928a040f5f3badda230988d632fe))
* **docker:** install corepack in Node 26 Alpine ([896de16](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/896de16ec4d8780aadc3176b89e205ee74403db2))
* **docker:** revert to corepack for pnpm install in Node 26 Alpine ([9a5ae0a](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/9a5ae0a12ace75967245ca19f7d0244910da8f02))
* lowercase image name for docker tag ([a4d6ee7](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/a4d6ee77dcf0e0b9ee35ccbb7c6c308a852a9461))
* register-commands script no longer needs tsc ([dbfb15a](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/dbfb15a013238d314887d53b6eb19f39203d2a4e))
* **release:** disable husky hooks during release commit in CI ([39c80c6](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/39c80c6428ffe00b013f0069e67f6030069961ea))
* **release:** drop npm plugin and add conventionalcommits preset dep ([36579bc](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/36579bc32ba0d8bc2bad5dff7bf481f6f0a6ffb9))
* **release:** stop publishing to npm — GitHub releases and GHCR only ([1d06369](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/1d063695c1d7794ec32d5771f3156d815efda439))
* Remove unused createClient import ([b968986](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/b968986d9a3a433574f9c87cf8456513d0caade0))
* restore forceOverride, fix import for interlink ([94d2962](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/94d29627afb62f7a65602dde59f3f41124e20179))
* update undici to 6.29.1 to resolve Dependabot alerts ([bf280ca](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/bf280cac11fa5830a582c899aabf8973cabdea35))
* use block chars for progress bar to avoid Discord spoiler markdown ([0f04077](https://github.com/The-A-P-O-L-L-O-Organization/NRPTimeBot/commit/0f04077a52b90981331200bb67f3fc1882dd0aff))
