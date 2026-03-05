const PAD = { top: 8, right: 4, bottom: 24, left: 32 };
function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}
function pointsToPath(pts) {
    if (!pts.length)
        return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}
export function renderCycleChart(svg, observed, predicted) {
    while (svg.firstChild)
        svg.removeChild(svg.firstChild);
    const W = svg.clientWidth || 700;
    const H = svg.clientHeight || 120;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    if (!observed.length)
        return;
    // Date range: observed start → furthest of (observed end, predicted end)
    const minDate = observed[0]['time-tag'];
    const obsMax = observed[observed.length - 1]['time-tag'];
    const predMax = predicted.length ? predicted[predicted.length - 1]['time-tag'] : '';
    const maxDate = obsMax > predMax ? obsMax : predMax;
    const allSSN = [
        ...observed.map((d) => d.smoothed_swpc_ssn).filter((v) => v >= 0),
        ...predicted.map((d) => d.high_ssn),
    ];
    const maxSSN = Math.max(...allSSN, 100);
    const dateToMs = (s) => new Date(s + '-01').getTime();
    const t0 = dateToMs(minDate);
    const t1 = dateToMs(maxDate);
    const tRange = t1 - t0;
    const tx = (tag) => PAD.left + ((dateToMs(tag) - t0) / tRange) * plotW;
    const ty = (ssn) => PAD.top + plotH - (ssn / maxSSN) * plotH;
    const g = svgEl('g');
    // ── confidence band ──
    if (predicted.length) {
        const upper = predicted.map((d) => [tx(d['time-tag']), ty(d.high_ssn)]);
        const lower = predicted
            .map((d) => [tx(d['time-tag']), ty(d.low_ssn)])
            .reverse();
        const band = svgEl('path');
        band.setAttribute('d', `${pointsToPath(upper)} L${lower[0][0].toFixed(1)},${lower[0][1].toFixed(1)} ${lower
            .slice(1)
            .map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)
            .join(' ')} Z`);
        band.setAttribute('fill', '#ebebeb');
        band.setAttribute('stroke', 'none');
        g.appendChild(band);
    }
    // ── baseline ──
    const baseline = svgEl('line');
    baseline.setAttribute('x1', String(PAD.left));
    baseline.setAttribute('x2', String(PAD.left + plotW));
    baseline.setAttribute('y1', String(PAD.top + plotH));
    baseline.setAttribute('y2', String(PAD.top + plotH));
    baseline.setAttribute('stroke', '#e0e0e0');
    baseline.setAttribute('stroke-width', '1');
    g.appendChild(baseline);
    // ── year ticks + labels ──
    const startYear = parseInt(minDate.slice(0, 4));
    const endYear = parseInt(maxDate.slice(0, 4));
    for (let yr = startYear; yr <= endYear; yr += 2) {
        const x = tx(`${yr}-01`);
        const tick = svgEl('line');
        tick.setAttribute('x1', String(x));
        tick.setAttribute('x2', String(x));
        tick.setAttribute('y1', String(PAD.top + plotH));
        tick.setAttribute('y2', String(PAD.top + plotH + 4));
        tick.setAttribute('stroke', '#ddd');
        tick.setAttribute('stroke-width', '1');
        g.appendChild(tick);
        const label = svgEl('text');
        label.setAttribute('x', String(x));
        label.setAttribute('y', String(PAD.top + plotH + 14));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#aaa');
        label.setAttribute('font-size', '9');
        label.setAttribute('font-family', 'Space Mono, monospace');
        label.textContent = String(yr);
        g.appendChild(label);
    }
    // ── predicted line (dashed) ──
    if (predicted.length) {
        const pts = predicted.map((d) => [tx(d['time-tag']), ty(d.predicted_ssn)]);
        const path = svgEl('path');
        path.setAttribute('d', pointsToPath(pts));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#aaa');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('stroke-dasharray', '4 3');
        g.appendChild(path);
    }
    // ── observed smoothed line ──
    const smoothedPts = observed
        .filter((d) => d.smoothed_swpc_ssn >= 0)
        .map((d) => [tx(d['time-tag']), ty(d.smoothed_swpc_ssn)]);
    if (smoothedPts.length) {
        const path = svgEl('path');
        path.setAttribute('d', pointsToPath(smoothedPts));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#222');
        path.setAttribute('stroke-width', '1.5');
        g.appendChild(path);
    }
    // ── current-month marker ──
    const now = new Date();
    const nowTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (nowTag >= minDate && nowTag <= maxDate) {
        const x = tx(nowTag);
        const marker = svgEl('line');
        marker.setAttribute('x1', String(x));
        marker.setAttribute('x2', String(x));
        marker.setAttribute('y1', String(PAD.top));
        marker.setAttribute('y2', String(PAD.top + plotH));
        marker.setAttribute('stroke', '#ccc');
        marker.setAttribute('stroke-width', '1');
        marker.setAttribute('stroke-dasharray', '2 3');
        g.appendChild(marker);
    }
    svg.appendChild(g);
}
