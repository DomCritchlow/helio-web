const BASE = 'https://services.swpc.noaa.gov/json';
async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok)
        throw new Error(`fetch ${path} → ${res.status}`);
    return res.json();
}
export async function fetchAll() {
    const [regions, cycleHistory, flux, predicted] = await Promise.all([
        get('/solar_regions.json'),
        get('/solar-cycle/observed-solar-cycle-indices.json'),
        get('/f107_cm_flux.json'),
        get('/solar-cycle/predicted-solar-cycle.json'),
    ]);
    return { regions, cycleHistory, flux, predicted, fetchedAt: new Date() };
}
/**
 * Group all regions by observed_date, returning a sorted array of
 * { date, regions } so index 0 is oldest and last is today.
 */
export function groupRegionsByDate(regions) {
    const map = new Map();
    for (const r of regions) {
        const arr = map.get(r.observed_date) ?? [];
        arr.push(r);
        map.set(r.observed_date, arr);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, regions]) => ({ date, regions }));
}
/** Returns only the most-recent day's regions */
export function latestRegions(regions) {
    if (!regions.length)
        return [];
    const maxDate = regions.reduce((m, r) => (r.observed_date > m ? r.observed_date : m), '');
    return regions.filter((r) => r.observed_date === maxDate);
}
/** Returns the highest per-class flare probability across all active regions */
export function maxFlareProbs(regions) {
    return regions.reduce((acc, r) => ({
        c: Math.max(acc.c, r.c_flare_probability ?? 0),
        m: Math.max(acc.m, r.m_flare_probability ?? 0),
        x: Math.max(acc.x, r.x_flare_probability ?? 0),
    }), { c: 0, m: 0, x: 0 });
}
/** Latest F10.7 flux record with a non-null 90-day mean */
export function latestFlux(records) {
    for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].ninety_day_mean !== null)
            return records[i];
    }
    return records[records.length - 1] ?? null;
}
/** Observed monthly SSN since Solar Cycle 25 start (~Dec 2019) */
export function cycle25Observed(history) {
    return history.filter((d) => d['time-tag'] >= '2019-12' && d.observed_swpc_ssn >= 0);
}
