# salchyautoicelances (Asura Edition port)

Sorcerer-only combat assist. When your Sorcerer casts a trigger skill, the mod auto-weaves an
**Ice Lances** cast (by forging `C_START_SKILL`). Based on
[salchy-tera/auto-ice-lances](https://github.com/salchy-tera/auto-ice-lances), adapted for the
TERA Toolbox Private (Asura Edition) build.

The mod only activates on a Sorcerer character; on any other class it stays idle.

## Install (one line, copy-paste)

1. Press **Win+R**, type `powershell`, press **Enter**.
2. Paste this and press **Enter**:

   ```powershell
   irm https://raw.githubusercontent.com/czentovic-tr/auto-ice-lances-asura/main/web-install.ps1 | iex
   ```

3. Click **Yes** on the one Windows admin popup (required to write into Program Files).
4. Restart TERA Toolbox. Done.

That's the only manual step ever — after this, updates install themselves automatically on each toolbox launch.

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
- Local mod, auto-update disabled. To update: re-run `install.ps1` elevated, then restart the toolbox.
