/**
 * Shared utilities for rendering tool calls in chat messages
 */

/**
 * Language mapping from file extension to syntax highlighting language
 */
const LANGUAGE_MAP = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'h': 'c',
  'hpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'bash',
  'html': 'html',
  'xml': 'xml',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'md': 'markdown',
  'sql': 'sql',
  'go': 'go',
  'rs': 'rust',
  'swift': 'swift',
  'kt': 'kotlin',
  'scala': 'scala',
  'r': 'r',
  'lua': 'lua',
  'pl': 'perl',
  'vim': 'vim'
};

/**
 * Detect language from file extension for syntax highlighting
 * @param {string} fileName - The filename to detect language from
 * @returns {string} Language identifier for syntax highlighting (empty string if unknown)
 */
export function detectLanguage(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  return LANGUAGE_MAP[ext] || '';
}

/**
 * Parse Read tool output format and extract clean content
 * Input format: <path>...</path>\n<type>...</type>\n<content>\n123: line\n456: line\n...
 * @param {string} rawContent - Raw content from read tool
 * @returns {string} Cleaned content with line numbers stripped
 */
export function parseReadToolContent(rawContent) {
  if (!rawContent) return '';
  
  // Extract content between <content> tags
  const contentMatch = rawContent.match(/<content>([\s\S]*?)(<\/content>|$)/);
  if (!contentMatch) {
    // No content tags, return as-is
    return rawContent;
  }
  
  let content = contentMatch[1];
  
  // Strip line numbers (format: "123: code here")
  const lines = content.split('\n');
  const strippedLines = lines.map(line => {
    // Match "number: " at start of line
    const match = line.match(/^\d+:\s?(.*)$/);
    return match ? match[1] : line;
  });
  
  let result = strippedLines.join('\n').trim();
  
  // Remove truncation warnings at the end
  // Format: "(File has more lines. Use 'offset' parameter to read beyond line 123)"
  result = result.replace(/\(File has more lines\. Use 'offset' parameter to read beyond line \d+\)\s*$/, '');
  result = result.replace(/\(End of file - total \d+ lines\)\s*$/, '');
  
  return result.trim();
}

/**
 * Generate range information string for file read operations
 * @param {Object} input - Input parameters containing offset/limit
 * @returns {string} Human-readable range info (e.g., " (lines 10-20)")
 */
export function generateRangeInfo(input) {
  let rangeInfo = '';
  if (input.offset && input.limit) {
    const endLine = input.offset + input.limit - 1;
    rangeInfo = ` (lines ${input.offset}-${endLine})`;
  } else if (input.offset) {
    rangeInfo = ` (from line ${input.offset})`;
  } else if (input.limit) {
    rangeInfo = ` (first ${input.limit} lines)`;
  }
  return rangeInfo;
}

/**
 * Extract filename from full path
 * @param {string} filePath - Full file path
 * @returns {string} Just the filename
 */
export function getFileName(filePath) {
  return filePath.split('/').pop();
}

/**
 * Parse lively4_evaluate_code structured output
 * @param {string} output - Raw output from lively4_evaluate_code
 * @returns {Object|null} Parsed result with {result, consoleOutput} or null if parsing failed
 */
export function parseLively4EvaluateOutput(output) {
  try {
    // The output has this structure:
    // evaluate-code successful in XXms (auto-selected session YYY):
    //
    // ✅ Code executed successfully:
    // ```javascript
    // [code]
    // ```
    // **Result:** [result]
    //
    // **Console output:**
    // [console logs]

    // Extract result section
    const resultMatch = output.match(/\*\*Result:\*\*\s*([\s\S]*?)(?:\n\n\*\*Console output:\*\*|$)/);
    const result = resultMatch ? resultMatch[1].trim() : null;

    // Extract console output section
    const consoleMatch = output.match(/\*\*Console output:\*\*\s*([\s\S]*?)$/);
    const consoleOutput = consoleMatch ? consoleMatch[1].trim() : null;

    if (!result && !consoleOutput) {
      return null; // Parsing failed, use fallback
    }

    return {
      result: result,
      consoleOutput: consoleOutput
    };
  } catch (e) {
    console.warn('Failed to parse lively4_evaluate_code output:', e);
    return null;
  }
}

/**
 * Extract content from tool result in various formats
 * @param {*} result - Tool result object
 * @returns {string} Extracted content
 */
export function extractResultContent(result) {
  if (!result) return '';
  
  if (typeof result.content === 'string') {
    return result.content;
  } else if (Array.isArray(result.content)) {
    return result.content
      .map(block => {
        if (block.type === 'text') return block.text;
        if (block.type === 'image') return '[Image]';
        return JSON.stringify(block);
      })
      .join('\n');
  } else {
    return JSON.stringify(result.content);
  }
}
