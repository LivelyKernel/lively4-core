import * as ToolHelpers from '../chat-tool-helpers.js';
import { OpenCodeBaseTool } from './opencode-base-tool.js';

// Renderer for Skill tool (skill)
// Shows the skill name loaded and a brief preview of the injected skill content.
// Output wraps skill content in <skill_content name="...">...</skill_content>
export class OpenCodeSkillTool extends OpenCodeBaseTool {

  matches(part) {
    const toolName = part.name || part.tool;
    return toolName === 'skill';
  }

  /**
   * Extract skill name from output XML wrapper, or fall back to input.
   */
  parseSkillName(input, output) {
    if (output) {
      const m = output.match(/<skill_content\s+name="([^"]+)"/);
      if (m) return m[1];
    }
    return input.name || 'unknown';
  }

  /**
   * Extract a brief description preview from the skill content body.
   * Takes the first non-empty, non-heading paragraph after the # Skill: header.
   */
  extractPreview(output) {
    if (!output) return '';
    // Strip XML wrapper tags
    const body = output
      .replace(/<skill_content[^>]*>/g, '')
      .replace(/<\/skill_content>/g, '')
      .replace(/<skill_files>[\s\S]*?<\/skill_files>/g, '')
      .trim();

    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    // Skip "# Skill: ..." heading and blank lines, grab first content line
    const contentLine = lines.find(l => !l.startsWith('#') && l.length > 10);
    if (!contentLine) return '';
    return contentLine.length > 120 ? contentLine.slice(0, 120) + '…' : contentLine;
  }

  async renderCompact(part, result, showDebug) {
    const input = part.input || {};
    const toolId = part.id;
    if (!toolId) console.warn('OpenCodeSkillTool.renderCompact: part.id is missing', part);

    const rawOutput = ToolHelpers.extractResultContent(result);
    const skillName = this.parseSkillName(input, rawOutput);
    const preview = this.extractPreview(rawOutput);
    const hasError = result && result.is_error;

    const summary = `💡 skill: ${skillName}`;
    const details = await this.buildDetails(toolId, summary, input, showDebug);

    if (preview && !hasError) {
      details.appendChild(await this.createMarkdownEl(`*${preview}*`));
    }
    if (hasError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${rawOutput}\n\`\`\``));
    }

    return details;
  }

  async renderCompactStreaming(part, showDebug) {
    const state = part.state || {};
    const input = state.input || {};
    const output = state.output || '';
    const toolId = part.callID;
    if (!toolId) console.warn('OpenCodeSkillTool.renderCompactStreaming: part.callID is missing', part);

    const skillName = this.parseSkillName(input, output);
    const preview = this.extractPreview(output);

    const summary = `💡 skill: ${skillName}`;
    const details = await this.buildDetails(toolId, summary, input, showDebug, 'Input');

    if (preview) {
      details.appendChild(await this.createMarkdownEl(`*${preview}*`));
    }

    return details;
  }
}
