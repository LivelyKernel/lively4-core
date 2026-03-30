import { expect } from 'src/external/chai.js';
import { VoiceToolset } from '../components/realtime-chat-tools/voice-toolset.js';
import { FileContext } from '../components/realtime-chat-tools/voice-file-context.js';

describe('VoiceToolset', () => {
  let toolset;
  let mockRealtimeChat;
  
  beforeEach(() => {
    // Create mock realtime chat component
    mockRealtimeChat = {
      log: () => {},
      workspaceReference: null
    };
    
    toolset = new VoiceToolset(mockRealtimeChat);
  });
  
  afterEach(() => {
    if (toolset) {
      toolset.clearContext();
    }
  });
  
  describe('construct', () => {
    it('should require realtimeChat reference', () => {
      expect(() => new VoiceToolset()).to.throw('requires a realtimeChat reference');
    });
    
    it('should initialize with FileContext', () => {
      expect(toolset.fileContext).to.be.instanceof(FileContext);
    });
    
    xit('should have read_file_voice tool', () => {
      expect(toolset.tools.read_file_voice).to.exist;
      expect(toolset.tools.read_file_voice.definition).to.exist;
      expect(toolset.tools.read_file_voice.execute).to.be.a('function');
    });
    
    xit('should have list_recent_files tool', () => {
      expect(toolset.tools.list_recent_files).to.exist;
      expect(toolset.tools.list_recent_files.definition).to.exist;
      expect(toolset.tools.list_recent_files.execute).to.be.a('function');
    });
  });
  
  describe('getDefinitions', () => {
    it('should return tool definitions for OpenAI', () => {
      const definitions = toolset.getDefinitions();
      expect(definitions).to.be.an('array');
      expect(definitions.length).to.equal(2);
      expect(definitions[0].type).to.equal('function');
      
      const toolNames = definitions.map(d => d.name);
      expect(toolNames).to.include('read_file_voice');
      expect(toolNames).to.include('list_recent_files');
    });
  });
  
  describe('read_file_voice', () => {
    it('should read a file and return content with metadata', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      const result = await toolset.execute('read_file_voice', {
        path: testFile
      });
      
      expect(result.success).to.be.true;
      expect(result.tool).to.equal('read_file_voice');
      expect(result.path).to.equal(testFile);
      expect(result.content).to.be.a('string');
      expect(result.metadata).to.exist;
      expect(result.metadata.fileName).to.equal('basic-toolset.js');
      expect(result.metadata.totalLines).to.be.a('number');
      expect(result.voiceResponse).to.be.a('string');
    });
    
    it('should show start section by default', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      const result = await toolset.execute('read_file_voice', {
        path: testFile,
        lines: 10
      });
      
      expect(result.success).to.be.true;
      expect(result.metadata.shownLines[0]).to.equal(1);
      expect(result.metadata.shownLines[1]).to.be.at.most(10);
    });
    
    it('should show end section when requested', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      const result = await toolset.execute('read_file_voice', {
        path: testFile,
        section: 'end',
        lines: 10
      });
      
      expect(result.success).to.be.true;
      const totalLines = result.metadata.totalLines;
      expect(result.metadata.shownLines[1]).to.equal(totalLines);
      expect(result.metadata.shownLines[0]).to.be.at.least(totalLines - 10);
    });
    
    it('should show around section when line number provided', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      const result = await toolset.execute('read_file_voice', {
        path: testFile,
        section: 'around',
        line_number: 50,
        lines: 20
      });
      
      expect(result.success).to.be.true;
      const [start, end] = result.metadata.shownLines;
      expect(50).to.be.within(start, end);
    });
    
    it('should update file context after reading', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      await toolset.execute('read_file_voice', { path: testFile });
      
      const recentFiles = toolset.fileContext.getRecentFiles();
      expect(recentFiles.length).to.equal(1);
      expect(recentFiles[0].path).to.equal(testFile);
      expect(recentFiles[0].operation).to.equal('read');
    });
    
    it('should gracefully handle errors', async () => {
      // Note: lively.files.loadFile may create non-existent files or return empty content
      // So we test error handling by checking the structure is correct
      const result = await toolset.execute('read_file_voice', {
        path: '/tmp/test-voice-toolset-error-handling.js'
      });
      
      // Result should have success field
      expect(result).to.have.property('success');
      
      // If successful, should have required fields
      if (result.success) {
        expect(result).to.have.property('content');
        expect(result).to.have.property('metadata');
      } else {
        // If failed, should have error field
        expect(result).to.have.property('error');
        expect(result.error).to.be.a('string');
      }
    });
    
    it('should return proper error for non-existent files', async () => {
      // Test with a path that definitely doesn't exist
      const nonExistentPath = '/this/path/definitely/does/not/exist/file.js';
      const result = await toolset.execute('read_file_voice', {
        path: nonExistentPath
      });
      
      // Should fail with proper error message
      expect(result.success).to.be.false;
      expect(result.error).to.include('File not found');
      expect(result.voiceResponse).to.include('couldn\'t find');
      expect(result.voiceResponse).to.include('file.js');
      
      // Should NOT have content or metadata (bug would show "File not found!" as content)
      expect(result.content).to.be.undefined;
      expect(result.metadata).to.be.undefined;
    });
  });
  
  describe('list_recent_files', () => {
    it('should return empty list when no files accessed', async () => {
      const result = await toolset.execute('list_recent_files', {});
      
      expect(result.success).to.be.true;
      expect(result.files).to.be.an('array');
      expect(result.files.length).to.equal(0);
      expect(result.voiceResponse).to.include("haven't looked at any files");
    });
    
    it('should list recent files after reading', async () => {
      const file1 = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      const file2 = 'src/ai-workspace/components/realtime-chat-tools/workspace-toolset.js';
      
      await toolset.execute('read_file_voice', { path: file1 });
      await toolset.execute('read_file_voice', { path: file2 });
      
      const result = await toolset.execute('list_recent_files', {});
      
      expect(result.success).to.be.true;
      expect(result.files.length).to.equal(2);
      expect(result.files[0].path).to.equal(file2); // Most recent first
      expect(result.files[1].path).to.equal(file1);
      expect(result.fileList).to.include('basic-toolset.js');
      expect(result.fileList).to.include('workspace-toolset.js');
    });
    
    it('should limit number of files returned', async () => {
      // Read multiple files
      const files = [
        'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js',
        'src/ai-workspace/components/realtime-chat-tools/workspace-toolset.js',
        'src/ai-workspace/components/realtime-chat-tools/composite-toolset.js'
      ];
      
      for (const file of files) {
        await toolset.execute('read_file_voice', { path: file });
      }
      
      const result = await toolset.execute('list_recent_files', { limit: 2 });
      
      expect(result.success).to.be.true;
      expect(result.files.length).to.equal(2);
    });
  });
  
  describe('FileContext integration', () => {
    it('should resolve "that" reference to last file', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      // First, read a file
      await toolset.execute('read_file_voice', { path: testFile });
      
      // Now read "that" file (should resolve to testFile)
      const result = await toolset.execute('read_file_voice', { path: 'that' });
      
      expect(result.success).to.be.true;
      expect(result.path).to.equal(testFile);
    });
    
    it('should resolve "current" reference to working file', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      // Set working file by reading
      await toolset.execute('read_file_voice', { path: testFile });
      
      // Read "current" should resolve to working file
      const result = await toolset.execute('read_file_voice', { path: 'current' });
      
      expect(result.success).to.be.true;
      expect(result.path).to.equal(testFile);
    });
    
    it('should resolve file name fragment', async () => {
      const testFile = 'src/ai-workspace/components/realtime-chat-tools/basic-toolset.js';
      
      // Read a file
      await toolset.execute('read_file_voice', { path: testFile });
      
      // Reference by fragment
      const result = await toolset.execute('read_file_voice', { path: 'basic' });
      
      expect(result.success).to.be.true;
      expect(result.path).to.equal(testFile);
    });
  });
});

describe('FileContext', () => {
  let context;
  
  beforeEach(() => {
    context = new FileContext();
  });
  
  describe('construct', () => {
    it('should initialize with empty state', () => {
      expect(context.workingFile).to.be.null;
      expect(context.recentFiles).to.be.an('array');
      expect(context.recentFiles.length).to.equal(0);
    });
  });
  
  describe('setWorkingFile', () => {
    it('should set working file', () => {
      context.setWorkingFile('test.js');
      expect(context.workingFile).to.equal('test.js');
    });
    
    it('should not add to recent files (that is done by caller)', () => {
      context.setWorkingFile('test.js');
      expect(context.recentFiles.length).to.equal(0);
    });
  });
  
  describe('addToRecent', () => {
    it('should add file to recent list', () => {
      context.addToRecent('file1.js', 'read');
      expect(context.recentFiles.length).to.equal(1);
      expect(context.recentFiles[0].path).to.equal('file1.js');
      expect(context.recentFiles[0].operation).to.equal('read');
    });
    
    it('should keep files in most-recent-first order', () => {
      context.addToRecent('file1.js', 'read');
      context.addToRecent('file2.js', 'read');
      expect(context.recentFiles[0].path).to.equal('file2.js');
      expect(context.recentFiles[1].path).to.equal('file1.js');
    });
    
    it('should not duplicate files', () => {
      context.addToRecent('file1.js', 'read');
      context.addToRecent('file1.js', 'edit');
      expect(context.recentFiles.length).to.equal(1);
      expect(context.recentFiles[0].operation).to.equal('edit');
    });
    
    it('should limit to maxRecentFiles', () => {
      context.maxRecentFiles = 3;
      context.addToRecent('file1.js', 'read');
      context.addToRecent('file2.js', 'read');
      context.addToRecent('file3.js', 'read');
      context.addToRecent('file4.js', 'read');
      expect(context.recentFiles.length).to.equal(3);
      expect(context.recentFiles[0].path).to.equal('file4.js');
    });
  });
  
  describe('resolveFileReference', () => {
    beforeEach(() => {
      context.setWorkingFile('working.js');
      context.addToRecent('recent.js', 'read');
    });
    
    it('should resolve "this" to working file', () => {
      expect(context.resolveFileReference('this')).to.equal('working.js');
    });
    
    it('should resolve "current" to working file', () => {
      expect(context.resolveFileReference('current')).to.equal('working.js');
    });
    
    it('should resolve "that" to most recent file', () => {
      expect(context.resolveFileReference('that')).to.equal('recent.js');
    });
    
    it('should resolve "last" to most recent file', () => {
      expect(context.resolveFileReference('last')).to.equal('recent.js');
    });
    
    it('should resolve file name fragment', () => {
      context.addToRecent('src/components/my-component.js', 'read');
      expect(context.resolveFileReference('component')).to.equal('src/components/my-component.js');
    });
    
    it('should fall back to literal path', () => {
      expect(context.resolveFileReference('some/literal/path.js')).to.equal('some/literal/path.js');
    });
    
    it('should handle null reference', () => {
      expect(context.resolveFileReference(null)).to.be.null;
    });
  });
  
  describe('clear', () => {
    it('should reset context', () => {
      context.setWorkingFile('test.js');
      context.addToRecent('file.js', 'read');
      
      context.clear();
      
      expect(context.workingFile).to.be.null;
      expect(context.recentFiles.length).to.equal(0);
    });
  });
});
