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
}
