/**
 * Update claude-pricing-data.js from the live Anthropic pricing page.
 *
 * Run this in a Lively4 workspace or script tag:
 *
 *   SystemJS.delete(SystemJS.resolve('src/client/claude/update-claude-pricing.js'));
 *   const m = await SystemJS.import('src/client/claude/update-claude-pricing.js');
 *   await m.updatePricing()
 *
 * Or evaluate the updatePricing() call directly in a workspace.
 * Requires lively4-server to be running (uses lively.files.saveFile to write the result).
 */

const PRICING_URL = 'https://platform.claude.com/docs/en/about-claude/pricing';
const DATA_FILE_URL = `${lively4url.replace(/\/?$/, '/')}src/client/claude/claude-pricing-data.js`;

// --- Parse a "$N / MTok" string to a number ---
function parsePrice(text) {
  const m = text.match(/\$([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

// --- Parse the HTML pricing table using DOMParser ---
function parseHtmlTable(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // The first tbody with 6-column rows is the model pricing table
  const rows = [...doc.querySelectorAll('tbody tr')];
  const models = [];

  for (const row of rows) {
    const cells = [...row.querySelectorAll('td')];
    if (cells.length < 6) continue;
    const rawName    = cells[0].textContent.trim();
    const deprecated = /deprecated/i.test(rawName);
    const displayName = rawName.replace(/\s*\(deprecated\)\s*/gi, '').trim();
    const entry = {
      displayName,
      deprecated,
      baseInput:    parsePrice(cells[1].textContent),
      cacheWrite5m: parsePrice(cells[2].textContent),
      cacheWrite1h: parsePrice(cells[3].textContent),
      cacheHit:     parsePrice(cells[4].textContent),
      output:       parsePrice(cells[5].textContent),
    };
    if (entry.baseInput == null) continue; // skip non-pricing rows
    models.push(entry);
  }

  if (models.length === 0) throw new Error('Could not find pricing table in page HTML');
  return models;
}

// --- Format PRICING_DATA as JS source ---
function formatDataFile(models) {
  const today = new Date().toISOString().slice(0, 10);
  const pad = (n, w = 5) => String(n).padEnd(w);

  const lines = models.map(m => {
    const dep = m.deprecated ? 'true ' : 'false';
    return `  { displayName: ${JSON.stringify(m.displayName).padEnd(24)}, deprecated: ${dep}, baseInput: ${pad(m.baseInput)}, cacheWrite5m: ${pad(m.cacheWrite5m)}, cacheWrite1h: ${pad(m.cacheWrite1h)}, cacheHit: ${pad(m.cacheHit)}, output: ${m.output} },`;
  });

  return `// AUTO-GENERATED — do not edit manually.
// Run src/client/claude/update-claude-pricing.js in a Lively4 browser session to refresh.
// Source: ${PRICING_URL}
// Last updated: ${today}

export const PRICING_DATA = [
${lines.join('\n')}
];
`;
}

// --- Main: fetch, parse, save ---
export async function updatePricing() {
  console.log(`Fetching ${PRICING_URL} ...`);
  const res = await fetch(PRICING_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${PRICING_URL}`);
  const html = await res.text();

  const models = parseHtmlTable(html);
  if (models.length === 0) throw new Error('No models parsed — check table format');

  console.log(`Parsed ${models.length} models:`);
  models.forEach(m =>
    console.log(`  ${m.deprecated ? '[dep]' : '     '} ${m.displayName.padEnd(22)} $${m.baseInput} in / $${m.output} out`)
  );

  const source = formatDataFile(models);
  console.log('\nGenerated source:\n', source);

  const saveRes = await lively.files.saveFile(DATA_FILE_URL, source);
  if (!saveRes.ok) throw new Error(`Save failed: HTTP ${saveRes.status} ${await saveRes.text()}`);

  console.log(`\nSaved to ${DATA_FILE_URL}`);
  // Hot-reload the module so the new data is live immediately
  await lively.reloadModule(DATA_FILE_URL);
  console.log('Module reloaded. Pricing is up to date.');

  return models;
}
