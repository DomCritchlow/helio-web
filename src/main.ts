import './style.css'
import { cycle25Observed, fetchAll, groupRegionsByDate, latestFlux, maxFlareProbs } from './api'
import { renderCycleChart } from './chart'
import { drawSun, initCanvas } from './sun'
import type { SolarRegion } from './types'

// ── element refs ──
const canvas      = document.getElementById('sun-canvas') as HTMLCanvasElement
const sunDate     = document.getElementById('sun-date') as HTMLSpanElement
const sliderStart = document.getElementById('slider-start') as HTMLSpanElement
const sliderEnd   = document.getElementById('slider-end') as HTMLSpanElement
const slider      = document.getElementById('date-slider') as HTMLInputElement
const utcClock    = document.getElementById('utc-clock') as HTMLSpanElement
const statRegions = document.getElementById('stat-regions') as HTMLElement
const statFlux    = document.getElementById('stat-flux') as HTMLElement
const statFluxAvg = document.getElementById('stat-flux-avg') as HTMLElement
const statSsn     = document.getElementById('stat-ssn') as HTMLElement
const barC        = document.getElementById('bar-c') as HTMLElement
const barM        = document.getElementById('bar-m') as HTMLElement
const barX        = document.getElementById('bar-x') as HTMLElement
const pctC        = document.getElementById('pct-c') as HTMLElement
const pctM        = document.getElementById('pct-m') as HTMLElement
const pctX        = document.getElementById('pct-x') as HTMLElement
const cycleChart  = document.getElementById('cycle-chart') as unknown as SVGSVGElement
const lastUpdated = document.getElementById('last-updated') as HTMLElement

// ── UTC clock ──
function tickClock() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  utcClock.textContent = `${now.getUTCFullYear()}·${pad(now.getUTCMonth() + 1)}·${pad(now.getUTCDate())}  ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`
}
setInterval(tickClock, 1000)
tickClock()

initCanvas(canvas)

// ── state ──
let dateSlices: { date: string; regions: SolarRegion[] }[] = []

function renderDay(idx: number) {
  const slice = dateSlices[idx]
  if (!slice) return

  drawSun(canvas, slice.regions)

  const isToday = idx === dateSlices.length - 1
  sunDate.textContent = isToday ? 'TODAY' : slice.date

  // Sidebar reflects the selected day
  statRegions.textContent = String(slice.regions.length)
  const probs = maxFlareProbs(slice.regions)
  setProb(barC, pctC, probs.c)
  setProb(barM, pctM, probs.m)
  setProb(barX, pctX, probs.x)
}

slider.addEventListener('input', () => {
  renderDay(Number(slider.value))
})

// ── load + render ──
async function refresh() {
  try {
    const data = await fetchAll()

    dateSlices = groupRegionsByDate(data.regions)
    const last = dateSlices.length - 1

    // Configure slider range
    slider.min = '0'
    slider.max = String(last)
    slider.value = String(last)

    // Endpoint labels
    sliderStart.textContent = dateSlices[0]?.date.slice(5) ?? ''  // MM-DD
    sliderEnd.textContent = 'TODAY'

    // Render today
    renderDay(last)

    // F10.7 flux (always live — not date-scrubbed)
    const fluxRec = latestFlux(data.flux)
    if (fluxRec) {
      statFlux.textContent = fluxRec.flux.toFixed(1)
      if (fluxRec.ninety_day_mean !== null) {
        statFluxAvg.textContent = `90d avg ${fluxRec.ninety_day_mean.toFixed(1)}`
      }
    }

    // SSN (always live)
    const c25 = cycle25Observed(data.cycleHistory)
    if (c25.length) {
      const latest = c25[c25.length - 1]
      const ssn = latest.smoothed_swpc_ssn >= 0 ? latest.smoothed_swpc_ssn : latest.observed_swpc_ssn
      statSsn.textContent = String(Math.round(ssn))
    }

    renderCycleChart(cycleChart, c25, data.predicted)

    const t = data.fetchedAt
    const pad = (n: number) => String(n).padStart(2, '0')
    lastUpdated.textContent = `updated ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC`
  } catch (err) {
    console.error('fetch failed', err)
  }
}

function setProb(bar: HTMLElement, label: HTMLElement, pct: number) {
  bar.style.width = `${pct}%`
  label.textContent = `${pct}%`
}

refresh()
setInterval(refresh, 60 * 60 * 1000)

let resizeTimer: ReturnType<typeof setTimeout>
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(refresh, 200)
})
