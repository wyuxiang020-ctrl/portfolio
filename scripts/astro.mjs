// Keep CLI side effects inside this project; no global Astro telemetry config.
process.env.ASTRO_TELEMETRY_DISABLED = '1';
await import('../node_modules/astro/bin/astro.mjs');
