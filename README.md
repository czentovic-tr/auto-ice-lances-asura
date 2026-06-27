# salchyautoicelances (Asura Edition port)

Sorcerer-only combat assist. When your Sorcerer casts a trigger skill, the mod auto-weaves an
**Ice Lances** cast (by forging `C_START_SKILL`). Based on
[salchy-tera/auto-ice-lances](https://github.com/salchy-tera/auto-ice-lances), adapted for the
TERA Toolbox Private (Asura Edition) build.

The mod only activates on a Sorcerer character; on any other class it stays idle.

## Install (download from GitHub, once)

1. On this page: green **Code** button → **Download ZIP**.
2. Extract it. Rename the extracted folder `auto-ice-lances-asura-main` → `salchyautoicelances`.
3. Move that folder into your TERA Toolbox `mods\` folder
   (e.g. `…\TeraToolbox Private (Asura Edition)\mods\`). Windows asks for admin once → **Continue**.
4. Start TERA Toolbox.

That's the only manual step ever. After this first download the mod keeps **itself** up to date:
every time the toolbox starts it pulls the latest version from this repo automatically (before any
mod loads), so you never reinstall.

## Commands (`/8 ...`)

| Command | What it does |
| --- | --- |
| `/8 al` | Enable / disable the mod |
| `/8 alui` | Open the GUI settings menu (GUI mode only) |
| `/8 al toggle nova\|fireblast\|arcane\|hailstorm\|fusion` | Toggle a single trigger skill |
| `/8 al humanize [on\|off]` | Toggle a small random delay before each weave (default: off = instant) |
| `/8 al jitter <min> <max>` | Set the humanized delay range in ms (default 30-150) |
| `/8 al distance <1-99999>` | Ice Lance throw distance (default 1000) |
| `/8 al lanceid <id>` | Override the Ice Lance skill id (default 350100) |
| `/8 al sniff [on\|off]` | Log the id/group of each skill you cast (calibration) |
| `/8 al status` | Print current settings |

## Calibration (do this once on Asura)

Skill ids and groups are server/patch-specific. To confirm they match this build:

1. On a Sorcerer, `/8 al sniff on`.
2. Cast each of Nova, Fireblast, Arcane Pulse, Hailstorm, Fusion once and read the logged
   `group` numbers. Defaults: Nova=30, Fireblast=6/32, Arcane=4/33, Hailstorm=27, Fusion=36.
3. Cast **Ice Lances** manually and read its `id` (default 350100). If different, set it with
   `/8 al lanceid <id>`.
4. `/8 al sniff off`.

If a trigger group differs from the defaults, edit `config.json` -> `data.groups`
(map `"group": "optionKey"`) and reload, or tell me the numbers and I'll patch it.

## Notes

- Forged `C_START_SKILL` is accepted because the proxy auto-stamps the anti-replay counter for
  this protocol version (376012) - no manual calibration of the counter is needed.
- Auto-update is enabled: on each launch the toolbox re-downloads any changed file (per
  `manifest.json`) from this repo. Your `config.json` settings are never touched (it's excluded
  from the manifest).
