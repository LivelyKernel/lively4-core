import { testWorld, loadComponent } from 'test/templates/templates-fixture.js';
import { expect } from 'src/external/chai.js';

describe('LivelyChatMessage', () => {
  let component;

  before(async () => {
    component = await loadComponent("lively-chat-message");
  });

  after(() => {
    testWorld().innerHTML = "";
  });

  // Helper function to get rendered text from the markdown component
  function getRenderedText() {
    const markdown = component.get('lively-markdown');
    if (!markdown || !markdown.shadowRoot) return '';
    const markdownContent = markdown.shadowRoot.querySelector('#content');
    return markdownContent ? markdownContent.textContent : '';
  }

  it('should load component', async () => {
    expect(component).to.exist;
    expect(component.tagName.toLowerCase()).to.equal('lively-chat-message');
  });

  describe('function_call_output handling', () => {
    it('should handle function_call_output with metadata.output.response', async () => {
      // This is the exact structure from the OpenCode audio realtime model
      const messageObj = {
        conversationId: "ff2d713c-08be-4daa-abf5-3259729dce14",
        timestamp: 1762873635791,
        type: "function_call_output",
        role: "tool",
        content: "↩️ Result: ✅ {\"success\":true,\"response\":\"Hi Jens! I can get the current time for you using a bash command.\\nTue Nov 11 16:07:12 CET 2025\\n\",\"immediate\":true,\"re...",
        metadata: {
          type: "function_call_output",
          call_id: "call_jGP7sPFcneIbJOV0",
          output: {
            success: true,
            response: "Hi Jens! I can get the current time for you using a bash command.\nTue Nov 11 16:07:12 CET 2025\n",
            immediate: true,
            requestId: "req-1762873628226-xefha129n"
          }
        },
        sequence: 3,
        id: 2043,
        source: "audio",
        streamType: "realtime",
        messageFormat: "flat"
      };

      await component.setMessage(messageObj);

      // The component should store the message data
      expect(component._messageData).to.exist;
      expect(component._messageData).to.deep.equal(messageObj);

      // Get the rendered content
      const renderedText = getRenderedText();

      // Should display "Function Result" header
      expect(renderedText).to.include("Function Result");

      // The rendered content should show the full output as JSON
      expect(renderedText).to.include("success");
      expect(renderedText).to.include("Hi Jens! I can get the current time for you using a bash command.");
      expect(renderedText).to.include("Tue Nov 11 16:07:12 CET 2025");
      expect(renderedText).to.include("Call ID: call_jGP7sPFcneIbJOV0");
    });

    it('should display function result as JSON when metadata.output exists', async () => {
      const messageObj = {
        role: "tool",
        content: "↩️ Result: ✅ Some preview text...",
        metadata: {
          type: "function_call_output",
          call_id: "call_123",
          output: {
            success: true,
            response: "This is the full response text that should be displayed",
            data: { key: "value" }
          }
        }
      };

      await component.setMessage(messageObj);

      const renderedText = getRenderedText();

      // Should show "Function Result" header
      expect(renderedText).to.include("Function Result");

      // Should display the full output as JSON
      expect(renderedText).to.include("success");
      expect(renderedText).to.include("This is the full response text that should be displayed");
      expect(renderedText).to.include("Call ID: call_123");
    });

    it('should handle long responses without truncation', async () => {
      const longResponse = "A".repeat(500); // 500 characters, much longer than 150 char truncation

      const messageObj = {
        role: "tool",
        content: "↩️ Result: ✅ " + longResponse.substring(0, 147) + "...",
        metadata: {
          type: "function_call_output",
          call_id: "call_long",
          output: {
            success: true,
            response: longResponse
          }
        }
      };

      await component.setMessage(messageObj);

      const renderedText = getRenderedText();

      // Should render the full response from metadata.output
      expect(renderedText).to.include(longResponse);
    });

    it('should handle function_call_output with special characters', async () => {
      const messageObj = {
        role: "tool",
        content: "↩️ Result: ✅ preview...",
        metadata: {
          type: "function_call_output",
          call_id: "call_special",
          output: {
            success: true,
            response: "Special chars: \n\t\"quotes\" 'apostrophes' <html> & symbols"
          }
        }
      };

      await component.setMessage(messageObj);

      const renderedText = getRenderedText();

      // Should handle special characters correctly
      expect(renderedText).to.include("Special chars:");
      expect(renderedText).to.include("quotes");
      expect(renderedText).to.include("apostrophes");
    });

    it('should handle function_call_output without metadata.output', async () => {
      const messageObj = {
        role: "tool",
        content: "↩️ Result: ✅ Fallback content",
        metadata: {
          type: "function_call_output",
          call_id: "call_no_output"
        }
      };

      await component.setMessage(messageObj);

      const renderedText = getRenderedText();

      // Should still render something (at minimum the header)
      expect(renderedText).to.include("Function Result");
    });
  });

  describe('OpenCode message format', () => {
    it('should handle OpenCode function_call_output format', async () => {
      const realtimeMessage = {
        type: "function_call_output",
        role: "tool",
        content: "↩️ Result: ✅ truncated...",
        metadata: {
          type: "function_call_output",
          call_id: "call_opencode",
          output: {
            success: true,
            response: "OpenCode function response with full text"
          }
        }
      };

      // This is realtime format, so use setMessage(), not setOpenCodeMessage()
      await component.setMessage(realtimeMessage);

      const renderedText = getRenderedText();

      expect(renderedText).to.include("OpenCode function response with full text");
    });
  });
});
