const GRID = 96;
const SCALE = 4;
const RADIUS = 44;
const CX = GRID / 2;
const CY = GRID / 2;
// Grid line color (the circle background that shows through cell gaps)
const GRID_COLOR = '#d0d0d0';
const CELL_EMPTY = '#ffffff';
const CELL_UMBRA = '#111111';
const CELL_PENUMBRA = '#555555';
export function initCanvas(canvas) {
    canvas.width = GRID * SCALE;
    canvas.height = GRID * SCALE;
}
/**
 * Heliographic (lat °, lon ° from central meridian) → grid cell.
 * Returns null if beyond the visible hemisphere.
 */
function heliographicToGrid(latDeg, lonDeg) {
    const lat = (latDeg * Math.PI) / 180;
    const lon = (lonDeg * Math.PI) / 180;
    const xDisk = Math.cos(lat) * Math.sin(lon);
    const yDisk = Math.sin(lat);
    if (xDisk * xDisk + yDisk * yDisk > 1)
        return null;
    return {
        gx: Math.round(CX + xDisk * RADIUS),
        gy: Math.round(CY - yDisk * RADIUS),
    };
}
export function drawSun(canvas, regions) {
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    // Transparent canvas — page background shows outside the circle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw solar disk in grid-line color; cell fills will be drawn on top,
    // leaving SCALE-1 pixel fills with 1px grid gaps showing through
    ctx.beginPath();
    ctx.arc(CX * SCALE + 0.5, CY * SCALE + 0.5, RADIUS * SCALE, 0, Math.PI * 2);
    ctx.fillStyle = GRID_COLOR;
    ctx.fill();
    const spotMap = new Map();
    for (const region of regions) {
        const pos = heliographicToGrid(region.latitude, region.longitude);
        if (!pos)
            continue;
        // Null area = decaying/minimal region; use a small default
        const area = region.area ?? 20;
        const spotR = Math.max(2, Math.sqrt(area) * 0.1);
        const gxMin = Math.floor(pos.gx - spotR);
        const gxMax = Math.ceil(pos.gx + spotR);
        const gyMin = Math.floor(pos.gy - spotR);
        const gyMax = Math.ceil(pos.gy + spotR);
        for (let gy = gyMin; gy <= gyMax; gy++) {
            for (let gx = gxMin; gx <= gxMax; gx++) {
                if (gx < 0 || gx >= GRID || gy < 0 || gy >= GRID)
                    continue;
                const d = Math.sqrt((gx - pos.gx) ** 2 + (gy - pos.gy) ** 2);
                if (d > spotR)
                    continue;
                const key = gy * GRID + gx;
                const type = d / spotR < 0.45 ? 'umbra' : 'penumbra';
                if (!spotMap.has(key) || spotMap.get(key) === 'penumbra') {
                    spotMap.set(key, type);
                }
            }
        }
    }
    // Draw each cell within the disk
    // Each fill is (SCALE-1)×(SCALE-1); the 1px right+bottom gap shows the gray arc background
    for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
            const dx = gx - CX;
            const dy = gy - CY;
            if (dx * dx + dy * dy > RADIUS * RADIUS)
                continue;
            const spot = spotMap.get(gy * GRID + gx);
            ctx.fillStyle = spot === 'umbra' ? CELL_UMBRA : spot === 'penumbra' ? CELL_PENUMBRA : CELL_EMPTY;
            ctx.fillRect(gx * SCALE, gy * SCALE, SCALE - 1, SCALE - 1);
        }
    }
}
