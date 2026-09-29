/*MD
# Coloring modes for architecture diagram renderers

Strategy-based node coloring shared by all renderers. Each mode maps a
normalized node descriptor `{ name, url, size, modified, owner }` to a CSS
color (SVG renderers) and to a numeric attribute + color scheme (3D treemap).

To add a new mode:
1. Write a strategy function `(descriptor) => cssColor`.
2. Append an entry to `COLORING_MODES` with an `id`, `label`, `color`,
   and — for the 3D treemap — a numeric `treemapAttribute` + `treemapScheme`
   (must be one of TreemapColorSchemes in lively-treemap.js).
3. Ensure the numeric attribute is produced in Treemap3DRenderer.prepareTreemapData().
MD*/
import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";

// Default categorical palette (distinct, reasonably color-blind aware)
export const DEFAULT_PALETTE = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'
];

const NEUTRAL = '#cccccc';

// --- shared helpers ---------------------------------------------------------

// Directory owning a file, used as a "responsible party" proxy (parent folder).
export function ownerOf(url) {
  if (!url) return null;
  const parts = url.replace(lively4url + '/', '').split('/').filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : (parts[0] || null);
}

// Stable string -> palette index (deterministic across sessions).
export function ownerHash(owner) {
  if (!owner) return 0;
  let hash = 0;
  for (let i = 0; i < owner.length; i++) hash = (hash * 31 + owner.charCodeAt(i)) | 0;
  return Math.abs(hash) % DEFAULT_PALETTE.length;
}

// Age of a file in days (0 when unknown).
export function ageDays(modified) {
  if (!modified) return 0;
  return moment.duration(moment(Date.now()).diff(moment(modified))).asDays();
}

// --- strategy functions -----------------------------------------------------

const sizeScale = d3.scaleLinear()
  .domain([0, 2, 4])                              // log10(chars): ~1, ~100, ~10000
  .range(['#f7fbff', '#6baed6', '#08306b'])
  .interpolate(d3.interpolateHcl);

const recencyScale = d3.scaleLinear()
  .range(['#aaccff', '#808080'])                  // recent (blue) -> old (gray)
  .domain([10, 365])
  .interpolate(d3.interpolateHcl);

export function colorBySize(d) {
  return sizeScale(Math.log10(Math.max(d.size || 0, 1)));
}

export function colorByOwner(d) {
  return d.owner ? DEFAULT_PALETTE[ownerHash(d.owner)] : NEUTRAL;
}

export function colorByRecency(d) {
  return d.modified ? recencyScale(ageDays(d.modified)) : NEUTRAL;
}

// --- mode registry ----------------------------------------------------------

export const COLORING_MODES = [
  { id: 'size',    label: 'By Size',         color: colorBySize,    treemapAttribute: 'sqrt_loc',   treemapScheme: 'viridis' },
  { id: 'owner',   label: 'By Owner',        color: colorByOwner,   treemapAttribute: 'owner_hash', treemapScheme: 'Set1' },
  { id: 'recency', label: 'By Last Changed', color: colorByRecency, treemapAttribute: 'age_days',   treemapScheme: 'YlOrRd' },
];

export const DEFAULT_COLORING_MODE = 'recency';

export function getColoringMode(id) {
  return COLORING_MODES.find(m => m.id === id)
      || COLORING_MODES.find(m => m.id === DEFAULT_COLORING_MODE);
}
