/**
 * JSONL Statistics Analyzer
 * Analyzes JSONL data and generates a schema with embedded statistics
 */

export function analyzeJSONL(jsonlString) {
  const lines = jsonlString.trim().split('\n').filter(line => line.trim());
  const schema = {};

  lines.forEach(line => {
    try {
      const obj = JSON.parse(line);
      analyzeObject(obj, schema);
    } catch (e) {
      console.warn('Failed to parse JSONL line:', e);
    }
  });

  // Post-process to truncate long string values in _values for readability
  truncateValuesForDisplay(schema);

  return schema;
}

function truncateValuesForDisplay(obj) {
  for (const key in obj) {
    if (key === '_values' && typeof obj[key] === 'object') {
      // Truncate keys (which are the actual string values) to 100 chars
      const values = obj[key];
      const truncated = {};
      for (const [stringValue, count] of Object.entries(values)) {
        const displayValue = stringValue.length > 100
          ? stringValue.substring(0, 100) + '...'
          : stringValue;
        truncated[displayValue] = count;
      }
      obj[key] = truncated;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively process nested objects
      truncateValuesForDisplay(obj[key]);
    }
  }
}

function analyzeObject(obj, schema) {
  for (const [key, value] of Object.entries(obj)) {
    // Initialize node with metadata
    if (!schema[key]) {
      schema[key] = {
        _count: 0,
        _types: {}
      };
    }

    schema[key]._count++;

    const type = getType(value);
    schema[key]._types[type] = (schema[key]._types[type] || 0) + 1;

    // Handle different types
    if (type === 'string') {
      updateStringStats(schema[key], value);
    } else if (type === 'number') {
      updateNumberStats(schema[key], value);
    } else if (type === 'array') {
      updateArrayStats(schema[key], value);
      // Recursively analyze array elements
      value.forEach(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          if (!schema[key]._arrayElements) {
            schema[key]._arrayElements = {};
          }
          analyzeObject(item, schema[key]._arrayElements);
        }
      });
    } else if (type === 'object') {
      // For nested objects, recursively analyze into the same node
      // But skip metadata properties that start with _
      analyzeObject(value, schema[key]);
    }
  }
}

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function updateStringStats(node, value) {
  const len = value.length;

  if (!node._sum) {
    node._sum = 0;
    node._min = Infinity;
    node._max = -Infinity;
  }

  node._sum += len;
  node._min = Math.min(node._min, len);
  node._max = Math.max(node._max, len);
  node._avg = node._sum / node._count;

  // Track distinct values (up to a limit for memory)
  if (!node._values) {
    node._values = {};
    node._distinctCount = 0;
  }

  // Only track values if we haven't exceeded limit
  if (node._distinctCount < 100) {
    if (!node._values[value]) {
      node._distinctCount++;
    }
    node._values[value] = (node._values[value] || 0) + 1;
  } else if (node._distinctCount === 100) {
    // Remove _values if too many distinct values
    delete node._values;
    node._distinctCount++;
  }
}

function updateNumberStats(node, value) {
  if (!node._sum) {
    node._sum = 0;
    node._min = Infinity;
    node._max = -Infinity;
  }

  node._sum += value;
  node._min = Math.min(node._min, value);
  node._max = Math.max(node._max, value);
  node._avg = node._sum / node._count;
}

function updateArrayStats(node, value) {
  const len = value.length;

  if (!node._arrayLength) {
    node._arrayLength = {
      _sum: 0,
      _min: Infinity,
      _max: -Infinity
    };
  }

  node._arrayLength._sum += len;
  node._arrayLength._min = Math.min(node._arrayLength._min, len);
  node._arrayLength._max = Math.max(node._arrayLength._max, len);
  node._arrayLength._avg = node._arrayLength._sum / node._types.array;

  // Track content size for array elements (especially important for large strings)
  if (!node._arrayContentSize) {
    node._arrayContentSize = {
      _sum: 0,
      _min: Infinity,
      _max: -Infinity
    };
  }

  // Calculate total content size of all elements in this array
  let contentSize = 0;
  value.forEach(item => {
    contentSize += calculateContentSize(item);
  });

  node._arrayContentSize._sum += contentSize;
  node._arrayContentSize._min = Math.min(node._arrayContentSize._min, contentSize);
  node._arrayContentSize._max = Math.max(node._arrayContentSize._max, contentSize);
  node._arrayContentSize._avg = node._arrayContentSize._sum / node._types.array;
}

function calculateContentSize(value) {
  const type = getType(value);

  if (type === 'string') {
    return value.length;
  } else if (type === 'number' || type === 'boolean') {
    // Approximate size for primitive types
    return String(value).length;
  } else if (type === 'null' || type === 'undefined') {
    return 4; // "null" or "undefined" as strings
  } else if (type === 'array') {
    // Recursively calculate size for nested arrays
    let size = 2; // brackets []
    value.forEach((item, i) => {
      size += calculateContentSize(item);
      if (i < value.length - 1) size += 1; // comma
    });
    return size;
  } else if (type === 'object') {
    // Approximate JSON string size for objects
    try {
      return JSON.stringify(value).length;
    } catch (e) {
      return 0; // Circular reference or other error
    }
  }

  return 0;
}

/**
 * Generate ASCII tree visualization of JSONL statistics
 * Shows hierarchical structure with accumulated sizes (treemap-style)
 * Filters out nodes below 1% of total size
 *
 * @param {object} stats - Statistics object from analyzeJSONL()
 * @param {number} cutoffPercent - Minimum percentage to show (default: 1)
 * @returns {string} ASCII tree visualization
 */
export function generateStatsTree(stats, cutoffPercent = 1) {
  // First pass: calculate total size and accumulated sizes
  const totalSize = calculateNodeSize(stats);
  const cutoffSize = totalSize * (cutoffPercent / 100);

  // Generate tree
  const lines = [];
  lines.push(`Total Size: ${formatSize(totalSize)}`);
  lines.push(`Cutoff: ${cutoffPercent}% (${formatSize(cutoffSize)})`);
  lines.push('');

  // Recursively build tree
  buildTreeLines(stats, '', true, totalSize, cutoffSize, lines);

  return lines.join('\n');
}

/**
 * Calculate accumulated size for a node (including all children)
 */
function calculateNodeSize(node) {
  if (!node || typeof node !== 'object') return 0;

  let size = 0;

  // Add string content size
  if (node._sum !== undefined && node._types?.string) {
    size += node._sum;
  }

  // Add array content size
  if (node._arrayContentSize?._sum !== undefined) {
    size += node._arrayContentSize._sum;
  }

  // Recursively add children (skip metadata fields starting with _)
  for (const [key, value] of Object.entries(node)) {
    if (!key.startsWith('_') && typeof value === 'object' && value !== null) {
      size += calculateNodeSize(value);
    }
  }

  return size;
}

/**
 * Recursively build tree lines with ASCII art
 */
function buildTreeLines(node, prefix, isLast, totalSize, cutoffSize, lines, nodeName = 'root') {
  if (!node || typeof node !== 'object') return;

  const nodeSize = calculateNodeSize(node);
  const percent = totalSize > 0 ? (nodeSize / totalSize * 100) : 0;

  // Skip nodes below cutoff (except root)
  if (nodeName !== 'root' && nodeSize < cutoffSize) {
    return;
  }

  // Generate the line for this node
  if (nodeName !== 'root') {
    const connector = isLast ? '└── ' : '├── ';
    const sizeStr = formatSize(nodeSize);
    const percentStr = percent.toFixed(1) + '%';
    const nodeInfo = getNodeInfo(node);

    lines.push(`${prefix}${connector}${nodeName} ${sizeStr} (${percentStr}) ${nodeInfo}`);
  }

  // Get children (non-metadata fields)
  const children = Object.entries(node)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => ({ key, value, size: calculateNodeSize(value) }))
    .filter(child => child.size >= cutoffSize)
    .sort((a, b) => b.size - a.size); // Sort by size descending

  // Recursively process children
  children.forEach((child, index) => {
    const childIsLast = index === children.length - 1;
    const childPrefix = nodeName === 'root' ? '' : prefix + (isLast ? '    ' : '│   ');
    buildTreeLines(child.value, childPrefix, childIsLast, totalSize, cutoffSize, lines, child.key);
  });
}

/**
 * Get summary information about a node
 */
function getNodeInfo(node) {
  const parts = [];

  if (node._count !== undefined) {
    parts.push(`n=${node._count}`);
  }

  if (node._types) {
    const types = Object.keys(node._types).join(',');
    parts.push(`types=${types}`);
  }

  if (node._arrayLength) {
    parts.push(`len=${node._arrayLength._avg?.toFixed(1) || '?'}`);
  }

  return parts.length > 0 ? `[${parts.join(' ')}]` : '';
}

/**
 * Format size in human-readable format
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes.toFixed(0) + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
