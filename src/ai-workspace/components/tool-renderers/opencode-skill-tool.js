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

  async render(part, result, showDebug, isStreaming) {
    const data = this.parsePart(part, result);
    
    if (!data.toolId) {
      console.warn('OpenCodeSkillTool.render: toolId is missing', part);
    }

    const skillName = this.parseSkillName(data.input, data.output);
    const preview = this.extractPreview(data.output);

    const summary = `💡 skill: ${skillName}`;
    const debugLabel = isStreaming ? 'Input' : undefined;
    const details = await this.buildDetails(data.toolId, summary, data.input, showDebug, debugLabel);

    if (preview && !data.isError) {
      details.appendChild(await this.createMarkdownEl(`*${preview}*`));
    }
    if (data.isError) {
      details.appendChild(await this.createMarkdownEl(`**⚠️ Error:**\n\`\`\`\n${data.output}\n\`\`\``));
    }

    return details;
  }
}
