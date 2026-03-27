import * as ToolHelpers from '../chat-tool-helpers.js';
import { VoxBaseTool } from './vox-base-tool.js';

/**
 * Renderer for list_files_voice tool in Vox (realtime/voice agent).
 * Displays directory listings with tree structure, filtering, and recursion support.
 */
export class VoxListFilesTool extends VoxBaseTool {

  matches(messageObj) {
    if (messageObj.role !== 'tool') return false;
    if (messageObj.source !== 'audio') return false;
    
    const metadata = messageObj.metadata || {};
    
    // Match function_call by function name
    if (metadata.type === 'function_call') {
      const functionName = metadata.functionName || '';
      return functionName === 'list_files_voice';
    }
    
    // Match function_call_output by output.tool field
    if (metadata.type === 'function_call_output') {
      const output = metadata.output || {};
      return output.tool === 'list_files_voice';
    }
    
    return false;
  }

  async renderToolCall(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const args = metadata.arguments || {};
    const callId = metadata.call_id || '';
    const path = args.path || '.';
    const recursive = args.recursive || false;
    const filter = args.filter || null;
    
    // Build summary text
    let summaryText = `📁 ${path}`;
    if (recursive) summaryText += ' (recursive)';
    if (filter) summaryText += ` [${filter}]`;
    
    const details = await this.buildDetails(callId, summaryText, args, showDebug, 'Arguments');
    
    return details;
  }

  async renderToolResult(messageObj, showDebug) {
    const metadata = messageObj.metadata || {};
    const callId = metadata.call_id || '';
    const output = metadata.output || {};
    
    const path = output.path || '.';
    const files = output.files || [];
    const meta = output.metadata || {};
    
    // Build summary text
    const icon = output.success ? '📁' : '❌';
    let summaryText = `${icon} ${path}`;
    if (meta.recursive) summaryText += ' (recursive)';
    if (meta.filter) summaryText += ` [${meta.filter}]`;
    summaryText += ` — ${meta.totalFiles || 0} file${meta.totalFiles === 1 ? '' : 's'}`;
    if (meta.totalDirs > 0) summaryText += `, ${meta.totalDirs} dir${meta.totalDirs === 1 ? '' : 's'}`;
    
    const details = <details class="compact-tool-call" {...(callId ? {"data-tool-id": callId} : {})} open={false}>
      <summary>{summaryText}</summary>
    </details>;
    
    // Show error if failed
    if (!output.success || output.error) {
      const errorText = output.error || 'Failed to list files';
      details.appendChild(await this.createMarkdownEl(`**Error:** ${errorText}`));
      return details;
    }
    
    // Build tree structure
    if (files.length > 0) {
      const tree = this.buildFileTree(files, meta.recursive || false);
      details.appendChild(await this.createMarkdownEl(`\`\`\`\n${tree}\n\`\`\``));
    } else {
      details.appendChild(await this.createMarkdownEl('*Empty directory*'));
    }
    
    // Show metadata in debug mode
    if (showDebug && meta) {
      const metaParts = [];
      if (meta.maxDepth !== null) metaParts.push(`Max depth: ${meta.maxDepth}`);
      if (meta.truncated) metaParts.push('⚠️ Truncated (max depth reached)');
      
      if (metaParts.length > 0) {
        details.appendChild(await this.createMarkdownEl(`*${metaParts.join(', ')}*`));
      }
    }
    
    return details;
  }

  /**
   * Build a tree-like text representation of files
   * For recursive listings, shows hierarchy with indentation
   * For flat listings, shows simple list
   */
  buildFileTree(files, recursive) {
    if (!recursive) {
      // Flat listing
      return files.map(f => {
        const icon = f.type === 'directory' ? '📁' : '📄';
        const name = f.type === 'directory' ? `${f.name}/` : f.name;
        return `${icon} ${name}`;
      }).join('\n');
    }

    // Build hierarchical tree
    // First, organize files into a tree structure
    const root = { name: '', children: {} };
    
    for (const file of files) {
      const parts = file.relativePath.split('/');
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: isLast ? file.type : 'directory',
            children: {}
          };
        }
        
        current = current.children[part];
      }
    }
    
    // Render tree with indentation
    const renderNode = (node, depth = 0, prefix = '') => {
      const lines = [];
      const entries = Object.values(node.children).sort((a, b) => {
        // Directories first, then files
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      entries.forEach((child, idx) => {
        const isLast = idx === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const icon = child.type === 'directory' ? '📁' : '📄';
        const name = child.type === 'directory' ? `${child.name}/` : child.name;
        
        lines.push(`${prefix}${connector}${icon} ${name}`);
        
        // Recurse for directories
        if (child.type === 'directory' && Object.keys(child.children).length > 0) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          lines.push(...renderNode(child, depth + 1, newPrefix));
        }
      });
      
      return lines;
    };
    
    return renderNode(root).join('\n');
  }
}
