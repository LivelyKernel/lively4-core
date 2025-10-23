import {expect} from 'src/external/chai.js';
import LivelyAiWorkspace from 'src/components/tools/lively-ai-workspace.js';

describe('LivelyAiWorkspace', () => {
  let workspace;

  beforeEach(async () => {
    workspace = await lively.create('lively-ai-workspace');
    document.body.appendChild(workspace);
  });

  afterEach(() => {
    if (workspace && workspace.parentElement) {
      workspace.remove();
    }
  });

  it('should initialize with a workspace ID', async () => {
    expect(workspace.workspaceId).to.be.a('string');
    expect(workspace.workspaceId).to.have.length.greaterThan(0);
  });

  it('should have historydb database', () => {
    const db = LivelyAiWorkspace.historydb;
    expect(db).to.exist;
    expect(db.name).to.equal('lively-ai-workspace-history');
  });

  it('should store messages', async () => {
    const testMessage = {
      source: 'audio',
      streamType: 'realtime',
      role: 'user',
      content: 'Test message',
      type: 'message',
      timestamp: Date.now()
    };

    await workspace.storeMessage(testMessage);

    const messages = await workspace.getWorkspaceMessages();
    expect(messages).to.be.an('array');
    expect(messages.length).to.be.greaterThan(0);

    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.content).to.equal('Test message');
    expect(lastMessage.source).to.equal('audio');
  });

  it('should store events', async () => {
    const testEvent = {
      source: 'code',
      eventType: 'status_change',
      data: {status: 'working'}
    };

    await workspace.storeEvent(testEvent);

    const events = await workspace.getWorkspaceEvents();
    expect(events).to.be.an('array');
    expect(events.length).to.be.greaterThan(0);

    const lastEvent = events[events.length - 1];
    expect(lastEvent.eventType).to.equal('status_change');
    expect(lastEvent.source).to.equal('code');
  });

  it('should filter messages by source', async () => {
    // Add audio message
    await workspace.storeMessage({
      source: 'audio',
      streamType: 'realtime',
      role: 'user',
      content: 'Audio message',
      type: 'message'
    });

    // Add code message
    await workspace.storeMessage({
      source: 'code',
      streamType: 'opencode',
      role: 'assistant',
      content: 'Code message',
      type: 'text'
    });

    const audioMessages = await workspace.getMessagesBySource('audio');
    const codeMessages = await workspace.getMessagesBySource('code');

    expect(audioMessages).to.be.an('array');
    expect(codeMessages).to.be.an('array');

    // Check that we have at least one message of each type
    const hasAudioMessage = audioMessages.some(m => m.content === 'Audio message');
    const hasCodeMessage = codeMessages.some(m => m.content === 'Code message');

    expect(hasAudioMessage).to.be.true;
    expect(hasCodeMessage).to.be.true;
  });

  it('should export workspace history', async () => {
    // Add some test data
    await workspace.storeMessage({
      source: 'audio',
      streamType: 'realtime',
      role: 'user',
      content: 'Export test message',
      type: 'message'
    });

    await workspace.storeEvent({
      source: 'code',
      eventType: 'test_event',
      data: {test: true}
    });

    const result = await workspace.exportWorkspaceHistory();

    expect(result.success).to.be.true;
    expect(result.workspace).to.exist;
    expect(result.messages).to.be.an('array');
    expect(result.events).to.be.an('array');
    expect(result.exportTime).to.be.a('number');
  });

  it('should create blackboard state', () => {
    expect(workspace.blackboard).to.exist;
    expect(workspace.blackboard.currentTask).to.be.null;
    expect(workspace.blackboard.agentStatus).to.equal('idle');
  });
});
