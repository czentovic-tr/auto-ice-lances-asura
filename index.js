'use strict';

// Salchy's Auto Ice Lances - Asura Edition port.
// Sorcerer-only: auto-weaves Ice Lances (forged C_START_SKILL) when you cast a trigger skill.
// Original: https://github.com/salchy-tera/auto-ice-lances
//
// Asura adaptations vs upstream:
//  - tryHook + '*' fallback so a future patch bump can't hard-fail the load
//  - skill ids / trigger groups are configurable (datacenter values may differ on Asura)
//  - /8 al sniff  : log skill id/group while you cast, to verify the trigger map in-game
//  - /8 al humanize : optional small randomized delay before each weave (instant by default)
//  - GUI (tera-mod-ui) is optional and guarded; commands work even without it

let SettingsUI = null;
try { SettingsUI = require('tera-mod-ui').Settings; } catch (_) { /* GUI optional */ }

module.exports = function SalchySorcAutoLances(mod) {
    // --- defaults for keys this Asura port adds (filled if missing from config.json) ---
    const DEFAULTS = {
        enabled: false,
        nova: true,
        fireblast: true,
        arcane: true,
        hailstorm: false,
        fusion: true,
        distance: 1000,
        humanize: false,
        jitterMin: 30,
        jitterMax: 150,
        iceLanceId: 350100,
        sorcJob: 4,
        // skill group (floor(id/10000)) -> trigger option key, for C_START_SKILL
        groups: { '4': 'arcane', '6': 'fireblast', '27': 'hailstorm', '30': 'nova', '32': 'fireblast', '33': 'arcane', '36': 'fusion' },
        // ... for C_START_INSTANCE_SKILL
        instanceGroups: { '33': 'arcane', '36': 'fusion' }
    };

    let dirty = false;
    for (const k in DEFAULTS) {
        if (mod.settings[k] === undefined) { mod.settings[k] = DEFAULTS[k]; dirty = true; }
    }
    if (dirty) mod.saveSettings();
    const options = mod.settings;

    // --- GUI (tera-mod-ui), optional ---
    let ui = null;
    if (SettingsUI && global.TeraProxy && global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { height: 440 });
        ui.on('update', settings => { mod.settings = settings; mod.saveSettings(); });
    }

    this.destructor = () => {
        if (ui) { ui.close(); ui = null; }
        mod.clearAllTimeouts();
    };

    // --- state ---
    let sorcEnab = false;
    let myPosition = null;
    let myAngle = null;
    let sniff = false;

    // --- helpers ---
    function hook(name, version, ...rest) {
        let h = mod.tryHook(name, version, ...rest);
        if (!h && version !== '*' && version !== 'raw' && version !== 'event') {
            h = mod.tryHook(name, '*', ...rest);
            if (h) mod.log(`${name} v${version} unavailable, using latest ('*').`);
        }
        if (!h) mod.warn(`could not hook ${name} (v${version}).`);
        return h;
    }
    function rng(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
    function skillGroup(id) { return Math.floor(id / 10000); }
    function asBool(v, cur) {
        if (v === undefined) return !cur;
        return v === 'on' || v === 'true' || v === '1' || v === 'yes';
    }

    // --- commands ---
    mod.command.add('alui', () => {
        if (ui) ui.show();
        else mod.command.message('GUI not available (run the toolbox in GUI mode).');
    });

    mod.command.add('al', (sub, a, b) => {
        switch ((sub || '').toLowerCase()) {
            case '':
                options.enabled = !options.enabled;
                mod.saveSettings();
                mod.command.message(`Salchy's sorc auto lance is now ${options.enabled ? 'en' : 'dis'}abled.`);
                break;

            case 'humanize':
                options.humanize = asBool(a, options.humanize);
                mod.saveSettings();
                mod.command.message(`Humanized weave delay ${options.humanize ? `ON (${options.jitterMin}-${options.jitterMax}ms)` : 'OFF (instant)'}.`);
                break;

            case 'jitter': {
                const lo = parseInt(a, 10), hi = parseInt(b, 10);
                if (Number.isFinite(lo) && Number.isFinite(hi) && lo >= 0 && hi >= lo) {
                    options.jitterMin = lo; options.jitterMax = hi; mod.saveSettings();
                    mod.command.message(`Weave jitter set to ${lo}-${hi}ms.`);
                } else mod.command.message('Usage: al jitter <min> <max>  (milliseconds)');
                break;
            }

            case 'distance': {
                const d = parseInt(a, 10);
                if (Number.isFinite(d) && d >= 1 && d <= 99999) {
                    options.distance = d; mod.saveSettings();
                    mod.command.message(`Ice Lance distance set to ${d}.`);
                } else mod.command.message(`Current distance: ${options.distance}. Usage: al distance <1-99999>`);
                break;
            }

            case 'lanceid': {
                const id = parseInt(a, 10);
                if (Number.isFinite(id) && id > 0) {
                    options.iceLanceId = id; mod.saveSettings();
                    mod.command.message(`Ice Lance skill id set to ${id} (group ${skillGroup(id)}).`);
                } else mod.command.message(`Current Ice Lance id: ${options.iceLanceId} (group ${skillGroup(options.iceLanceId)}). Usage: al lanceid <id>`);
                break;
            }

            case 'toggle': {
                const key = (a || '').toLowerCase();
                if (['nova', 'fireblast', 'arcane', 'hailstorm', 'fusion'].includes(key)) {
                    options[key] = !options[key]; mod.saveSettings();
                    mod.command.message(`${key} weave ${options[key] ? 'ON' : 'OFF'}.`);
                } else mod.command.message('Usage: al toggle nova|fireblast|arcane|hailstorm|fusion');
                break;
            }

            case 'sniff':
                sniff = asBool(a, sniff);
                mod.command.message(`Skill sniff ${sniff ? 'ON - cast skills to read their id/group.' : 'OFF.'}`);
                break;

            case 'status':
                mod.command.message(`enabled:${options.enabled} sorc:${sorcEnab} | nova:${options.nova} fireblast:${options.fireblast} arcane:${options.arcane} hailstorm:${options.hailstorm} fusion:${options.fusion} | humanize:${options.humanize}(${options.jitterMin}-${options.jitterMax}) | lanceId:${options.iceLanceId} dist:${options.distance}`);
                break;

            default:
                mod.command.message('al | al toggle <skill> | al humanize [on|off] | al jitter <min> <max> | al distance <n> | al lanceid <id> | al sniff [on|off] | al status | alui');
                break;
        }
    });

    // --- class detection (Sorcerer) ---
    hook('S_LOGIN', 14, event => {
        sorcEnab = (((event.templateId - 10101) % 100) === options.sorcJob);
    });

    // --- location tracking ---
    hook('S_SPAWN_ME', 3, event => { myPosition = event.loc; myAngle = event.w; });
    hook('C_NOTIFY_LOCATION_IN_DASH', 4, event => { myAngle = event.w; myPosition = event.loc; });
    hook('C_NOTIFY_LOCATION_IN_ACTION', 4, event => { myAngle = event.w; myPosition = event.loc; });
    hook('C_PLAYER_LOCATION', 5, event => { myPosition = event.loc; myAngle = event.w; });

    // --- triggers ---
    function weave(event, groupMap) {
        const optKey = groupMap[String(skillGroup(event.skill.id))];
        if (!optKey || !options[optKey]) return;
        myPosition = event.loc;
        myAngle = event.w;
        if (options.humanize) mod.setTimeout(castLances, rng(options.jitterMin, options.jitterMax));
        else castLances();
    }

    // default hook filter is fake:false, so our own forged Ice Lance never re-enters here
    hook('C_START_SKILL', 7, event => {
        if (!sorcEnab) return;
        if (sniff) mod.command.message(`SNIFF C_START_SKILL id ${event.skill.id} -> group ${skillGroup(event.skill.id)}`);
        if (!options.enabled) return;
        weave(event, options.groups);
    });

    hook('C_START_INSTANCE_SKILL', 7, { order: -Infinity, filter: { fake: null } }, event => {
        if (!sorcEnab) return;
        if (sniff) mod.command.message(`SNIFF C_START_INSTANCE_SKILL id ${event.skill.id} -> group ${skillGroup(event.skill.id)}`);
        if (!options.enabled) return;
        weave(event, options.instanceGroups);
    });

    function castLances() {
        if (!myPosition || myAngle === null || myAngle === undefined) return;
        const d = options.distance;
        mod.send('C_START_SKILL', 7, {
            skill: { reserved: 0, npc: false, type: 1, huntingZoneId: 0, id: options.iceLanceId },
            w: myAngle,
            loc: myPosition,
            dest: {
                x: (Math.cos(myAngle) * d) + myPosition.x,
                y: (Math.sin(myAngle) * d) + myPosition.y,
                z: myPosition.z
            },
            unk: true,
            moving: false,
            continue: false,
            target: 0,
            unk2: false
        });
    }
};
