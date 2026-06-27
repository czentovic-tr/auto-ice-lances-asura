const DefaultSettings = {
    "enabled": false,
    "nova": true,
    "fireblast": true,
    "arcane": true,
    "hailstorm": false,
    "fusion": true,
    "distance": 1000,
    "humanize": false,
    "jitterMin": 30,
    "jitterMax": 150,
    "iceLanceId": 350100,
    "sorcJob": 4,
    "groups": { "4": "arcane", "6": "fireblast", "27": "hailstorm", "30": "nova", "32": "fireblast", "33": "arcane", "36": "fusion" },
    "instanceGroups": { "33": "arcane", "36": "fusion" }
}

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) {
        // Migrate legacy config file
        return Object.assign(Object.assign({}, DefaultSettings), settings)
    } else if (from_ver === null) {
        // No config file exists, use default settings
        return Object.assign({}, DefaultSettings)
    } else {
        // Migrate from older version (using the new system) to latest one
        if (from_ver + 1 < to_ver) { // Recursively upgrade in one-version steps
            settings = MigrateSettings(from_ver, from_ver + 1, settings)
            return MigrateSettings(from_ver + 1, to_ver, settings)
        }
        // from_ver === to_ver - 1: implement a switch for each version step
        switch (to_ver) {
            default:
                // keep known keys from old settings, fill the rest with defaults
                let oldsettings = settings
                settings = Object.assign({}, DefaultSettings)
                for (let option in oldsettings) {
                    if (settings[option] !== undefined) {
                        settings[option] = oldsettings[option]
                    }
                }
                break
        }
        return settings
    }
}
