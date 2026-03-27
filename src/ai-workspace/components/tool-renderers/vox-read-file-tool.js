import * as ToolHelpers from '../chat-tool-helpers.js';
import { VoxBaseTool } from './vox-base-tool.js';

/**
 * Renderer for read_file_voice tool in Vox (realtime/voice agent).
 * Displays file contents with syntax highlighting, matching OpenCode read tool style.
 */
export class VoxReadFileTool extends VoxBaseTool {

  matches(messageObj) {
    if (messageObj.role !== 'tool') return false;
    if (messageObj.source !== 'audio') return false;
    
    const metadata = messageObj.metadata || {};
    
    // Match function_call by function name
    if (metadata.type === 'function_call') {
      const functionName = metadata.functionName || '';
      return functionName === 'read_file_voice';
    }
    
    // Match function_call_output by output.tool field
    if (metadata.type === 'function_call_output') {
      const output = metadata.output || {};
      return output.tool === 'read_file_voice';
    }
    
    return false;
  }

  async renderToolCall(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const args = metadata.arguments || {};
    const callId = metadata.call_id || '';
    const path = args.path || 'unknown';
    const fileName = ToolHelpers.getFileName(path);
    
    const summaryText = `📖 ${fileName}`;
    const details = await this.buildDetails(callId, summaryText, args, showDebug, 'Arguments');
    
    return details;
  }

  async renderToolResult(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const callId = metadata.call_id || '';
    const output = metadata.output || {};
    
    const path = output.path || 'unknown';
    const fileName = ToolHelpers.getFileName(path);
    const content = output.content || '';
    const fileMetadata = output.metadata || {};
    
    // Build range info from metadata
    let rangeInfo = '';
    if (fileMetadata.shownLines) {
      const [start, end] = fileMetadata.shownLines;
      rangeInfo = ` (lines ${start}-${end})`;
    }
    
    const icon = output.success ? '📖' : '❌';
    const summaryText = `${icon} ${fileName}${rangeInfo}`;
    
    const details = <details class="compact-tool-call" {...(callId ? {"data-tool-id": callId} : {})} open={false}>
      <summary>{summaryText}</summary>
    </details>;
    
    // Show error if failed
    if (!output.success || output.error) {
      const errorText = output.error || 'Failed to read file';
      details.appendChild(await this.createMarkdownEl(`**Error:** ${errorText}`));
      return details;
    }
    
    // Show file content with syntax highlighting
    if (content) {
      const language = ToolHelpers.detectLanguage(fileName);
      details.appendChild(await this.createMarkdownEl(`\`\`\`${language}\n${content}\n\`\`\``));
    }
    
    // Show metadata in debug mode
    if (showDebug && fileMetadata) {
      const metaText = [
        fileMetadata.size && `Size: ${fileMetadata.size}`,
        fileMetadata.totalLines && `Total lines: ${fileMetadata.totalLines}`,
        fileMetadata.truncated && 'Truncated: yes'
      ].filter(Boolean).join(', ');
      
      if (metaText) {
        details.appendChild(await this.createMarkdownEl(`*${metaText}*`));
      }
    }
    
    return details;
  }
}
