/*MD
# Claude Message Colors

Shared color system for Claude components with automatic color derivation.
Provides consistent message role colors across conversations, session viewer, and statistics.

## Usage

```javascript
import ClaudeMessageColors from 'src/client/claude-message-colors.js';

// Get colors for a message role
const colors = ClaudeMessageColors.getColors('user');
console.log(colors.color);      // #4CAF50
console.log(colors.background); // rgba(76, 175, 80, 0.1)
console.log(colors.border);     // #4CAF50

// Get Graphviz color (hex format)
const graphvizColor = ClaudeMessageColors.getGraphvizColor('assistant');
```

MD*/

export default class ClaudeMessageColors {
  
  // Base colors for different message roles
  static baseColors = {
    user: '#4CAF50',      // Green - represents user input/questions
    assistant: '#2196F3', // Blue - represents AI responses
    system: '#FF9800',    // Orange - represents system messages  
    tool: '#9C27B0',      // Purple - represents general tool usage
    tool_use: '#E91E63',  // Pink - represents assistant making tool calls
    tool_result: '#795548', // Brown - represents tool execution results
    tool_interaction: '#673AB7', // Deep Purple - represents grouped tool call+result
    unknown: '#757575'    // Gray - fallback for unrecognized types
  };
  
  /**
   * Get complete color scheme for a message role
   * @param {string} role - Message role (user, assistant, system, tool, unknown)
   * @returns {Object} Color scheme with color, background, border, etc.
   */
  static getColors(role) {
    const normalizedRole = this.normalizeRole(role);
    const baseColor = this.baseColors[normalizedRole] || this.baseColors.unknown;
    
    return {
      color: baseColor,
      background: this.addAlpha(baseColor, 0.1),        // 10% opacity background
      border: baseColor,
      lightBackground: this.addAlpha(baseColor, 0.05),  // 5% for subtle backgrounds
      darkBackground: this.addAlpha(baseColor, 0.2),    // 20% for emphasis
      hover: this.darken(baseColor, 0.1),               // Slightly darker for hover
      textColor: this.getContrastColor(baseColor)       // Readable text color
    };
  }
  
  /**
   * Get hex color suitable for Graphviz (no alpha channel)
   * @param {string} role - Message role
   * @returns {string} Hex color string
   */
  static getGraphvizColor(role) {
    const normalizedRole = this.normalizeRole(role);
    return this.baseColors[normalizedRole] || this.baseColors.unknown;
  }
  
  /**
   * Normalize role names to standard values
   * @param {string|Object} role - Role string or message object
   * @returns {string} Normalized role
   */
  static normalizeRole(role) {
    // Handle message objects
    if (typeof role === 'object' && role !== null) {
      if (role.isUserMessage || (role.type === 'user' && !role.toolUseResult)) {
        return 'user';
      }
      
      // Check for tool result messages (highest priority for tool-related)
      if (role.toolUseResult) {
        return 'tool_result';
      }
      
      // Check if message has tool_result content
      if (role.message?.content && Array.isArray(role.message.content)) {
        const hasToolResult = role.message.content.some(c => c.type === 'tool_result');
        if (hasToolResult) {
          return 'tool_result';
        }
        
        // Check if message has tool_use content (assistant making tool calls)
        const hasToolUse = role.message.content.some(c => c.type === 'tool_use');
        if (hasToolUse) {
          return 'tool_use';
        }
      }
      
      // Check for direct tool use/result in role object
      if (role.type === 'tool_result') {
        return 'tool_result';
      }
      if (role.type === 'tool_use') {
        return 'tool_use';
      }
      
      return role.role || role.message?.role || 'unknown';
    }
    
    // Handle string roles
    const roleStr = String(role).toLowerCase();
    
    // Map variations to standard roles
    const roleMap = {
      'user': 'user',
      'human': 'user',
      'assistant': 'assistant',
      'ai': 'assistant',
      'system': 'system',
      'tool': 'tool',
      'tool_use': 'tool_use',
      'tool_result': 'tool_result',
      'tool_interaction': 'tool_interaction',
      'toolUseResult': 'tool_result'
    };
    
    return roleMap[roleStr] || 'unknown';
  }
  
  /**
   * Convert hex color to rgba with alpha channel
   * @param {string} hexColor - Hex color (e.g., '#4CAF50')
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} RGBA color string
   */
  static addAlpha(hexColor, alpha) {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * Darken a color by a percentage
   * @param {string} hexColor - Hex color
   * @param {number} amount - Amount to darken (0-1)
   * @returns {string} Darkened hex color
   */
  static darken(hexColor, amount) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r * (1 - amount));
    const newG = Math.round(g * (1 - amount));
    const newB = Math.round(b * (1 - amount));
    
    return '#' + [newR, newG, newB].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  
  /**
   * Lighten a color by a percentage
   * @param {string} hexColor - Hex color
   * @param {number} amount - Amount to lighten (0-1)
   * @returns {string} Lightened hex color
   */
  static lighten(hexColor, amount) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);
    
    return '#' + [newR, newG, newB].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  
  /**
   * Get contrasting text color (black or white) for a background
   * @param {string} hexColor - Background hex color
   * @returns {string} Contrasting text color ('#000000' or '#FFFFFF')
   */
  static getContrastColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
  
  /**
   * Apply colors to a DOM element
   * @param {HTMLElement} element - Element to style
   * @param {string} role - Message role
   * @param {Object} options - Styling options
   */
  static applyColors(element, role, options = {}) {
    const colors = this.getColors(role);
    const {
      background = false,
      border = false,
      text = false,
      hover = false
    } = options;
    
    if (text) {
      element.style.color = colors.color;
    }
    
    if (background) {
      element.style.backgroundColor = colors.background;
    }
    
    if (border) {
      element.style.borderColor = colors.border;
    }
    
    if (hover) {
      element.addEventListener('mouseenter', () => {
        if (background) element.style.backgroundColor = colors.darkBackground;
        if (border) element.style.borderColor = colors.hover;
      });
      
      element.addEventListener('mouseleave', () => {
        if (background) element.style.backgroundColor = colors.background;
        if (border) element.style.borderColor = colors.border;
      });
    }
  }
  
  /**
   * Generate CSS custom properties for all roles
   * @returns {string} CSS custom properties as string
   */
  static generateCSSVariables() {
    let css = ':root {\n';
    
    Object.keys(this.baseColors).forEach(role => {
      const colors = this.getColors(role);
      css += `  --claude-${role}-color: ${colors.color};\n`;
      css += `  --claude-${role}-background: ${colors.background};\n`;
      css += `  --claude-${role}-border: ${colors.border};\n`;
      css += `  --claude-${role}-hover: ${colors.hover};\n`;
    });
    
    css += '}\n';
    return css;
  }
  
  /**
   * Get all available role names
   * @returns {string[]} Array of role names
   */
  static getRoles() {
    return Object.keys(this.baseColors);
  }
}