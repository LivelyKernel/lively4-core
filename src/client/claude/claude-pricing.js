/**
 * Claude Pricing API
 *
 * Pricing data lives in claude-pricing-data.js (auto-generated).
 * To refresh pricing, run update-claude-pricing.js in a Lively4 browser session.
 *
 * Token type keys:
 *   baseInput    - Base Input Tokens ($/MTok)
 *   cacheWrite5m - 5-minute Cache Writes ($/MTok)
 *   cacheWrite1h - 1-hour Cache Writes ($/MTok)
 *   cacheHit     - Cache Hits & Refreshes ($/MTok)
 *   output       - Output Tokens ($/MTok)
 *
 * All prices are USD per million tokens ($/MTok).
 */

import { PRICING_DATA } from './claude-pricing-data.js';

// OpenAI pricing used by OpenCode model usage/cost displays.
// Prices are USD per million tokens ($/MTok).
const OPENAI_PRICING_DATA = [
  { displayName: 'GPT-5', baseInput: 2.5, cacheHit: 0.25, output: 15 }
];

// --- Internal: normalize a name to a lookup key ---
// "Claude Sonnet 4.5" -> "claude-sonnet-4-5"
function normalizeName(name) {
  if (name == null) return '';
  return String(name)
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\./g, '-');
}

function normalizeModelLookupKey(nameOrId) {
  return normalizeName(nameOrId)
    .replace(/-\d{8}$/, '')
    .replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

function stripProviderPrefix(key) {
  return key.replace(/^(openai|anthropic)[:/\-]/, '');
}

// Attach normalized id to each entry once at module load
const pricing = PRICING_DATA.map(m => ({ ...m, id: normalizeName(m.displayName) }));
const openAIPricing = OPENAI_PRICING_DATA.map(m => ({ ...m, id: normalizeName(m.displayName) }));

function findInPricingTable(models, key) {
  const providerStrippedKey = stripProviderPrefix(key);
  return models.find(m => {
    const idKey = normalizeModelLookupKey(m.id || m.displayName);
    const nameKey = normalizeModelLookupKey(m.displayName);
    return key === idKey ||
      key === nameKey ||
      providerStrippedKey === idKey ||
      providerStrippedKey === nameKey;
  }) || null;
}

function findOpenAIFallbackModel(key) {
  const providerStrippedKey = stripProviderPrefix(key);
  // Map OpenCode/OpenAI variants like gpt-5.3-codex to GPT-5 pricing.
  if (/^gpt-5($|[-:].*)/.test(providerStrippedKey)) {
    return findInPricingTable(openAIPricing, 'gpt-5');
  }
  return null;
}

// --- Public API ---

/**
 * All model pricing entries.
 * @returns {Array<Object>}
 */
export function allModels() {
  return pricing;
}

/**
 * Look up pricing for a model by display name or normalized id.
 * Case-insensitive; ignores "(deprecated)".
 *
 * Examples:
 *   forModel("claude-sonnet-4-5")   // by id
 *   forModel("Claude Sonnet 4.5")   // by display name
 *
 * @param {string} nameOrId
 * @returns {Object|null}
 */
export function forModel(nameOrId) {
  const key = normalizeModelLookupKey(nameOrId);
  return findInPricingTable(pricing, key) ||
    findInPricingTable(openAIPricing, key) ||
    findOpenAIFallbackModel(key);
}

/**
 * Cost per single token in dollars for a given model and token type.
 * (Divides $/MTok by 1,000,000)
 *
 * @param {string} nameOrId
 * @param {string} tokenType  one of TOKEN_TYPES
 * @returns {number|null}
 */
export function costPerToken(nameOrId, tokenType) {
  const model = forModel(nameOrId);
  if (!model || model[tokenType] == null) return null;
  return model[tokenType] / 1_000_000;
}

/**
 * Cost per million tokens ($/MTok) for a given model and token type.
 *
 * @param {string} nameOrId
 * @param {string} tokenType  one of TOKEN_TYPES
 * @returns {number|null}
 */
export function costPerMTok(nameOrId, tokenType) {
  const model = forModel(nameOrId);
  return model ? (model[tokenType] ?? null) : null;
}

/**
 * Price ratio between two token types for a model.
 * ratio = typeA_price / typeB_price
 *
 * Example:
 *   ratio("claude-sonnet-4-5", "cacheHit", "baseInput") → 0.1
 *   (cache hits cost 10% of base input)
 *
 * @param {string} nameOrId
 * @param {string} typeA
 * @param {string} typeB
 * @returns {number|null}
 */
export function ratio(nameOrId, typeA, typeB) {
  const model = forModel(nameOrId);
  if (!model || model[typeA] == null || !model[typeB]) return null;
  return model[typeA] / model[typeB];
}

/**
 * Total cost in dollars for a given token usage across multiple token types.
 *
 * @param {string} nameOrId
 * @param {Object} usage  e.g. { baseInput: 100_000, output: 20_000, cacheHit: 5_000 }
 * @returns {number|null}
 */
export function computeCost(nameOrId, usage) {
  const model = forModel(nameOrId);
  if (!model) return null;
  let total = 0;
  for (const [type, tokens] of Object.entries(usage)) {
    if (model[type] != null) {
      total += (model[type] / 1_000_000) * tokens;
    }
  }
  return total;
}

/**
 * Token type constants.
 */
export const TOKEN_TYPES = Object.freeze({
  BASE_INPUT:     'baseInput',
  CACHE_WRITE_5M: 'cacheWrite5m',
  CACHE_WRITE_1H: 'cacheWrite1h',
  CACHE_HIT:      'cacheHit',
  OUTPUT:         'output',
});
