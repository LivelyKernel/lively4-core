# Lively AI Workspace Ideas


## Referencing Sessions and Individual Messages

We could make the opencode sessions and message browseable PolymorphicIdentifier, like `opencode://sessionid/messageid`. 
We could decide if we want to provide:
  - JSON for analysis
  - Markdown for LLM consumption 
  - UI for humans to browse

The second option could be useful in linking to past sessions in overview sessions. E.g. allowing to agent to crawl through old sessions and stably reference them. 

They could either be accessed through special tool calls, or better through lively eval calls. The usage in code snippets would allow it to use JavaScript, to collect and filter data. 

For this maybe the JSON format could be especially helpful, since it contains structure and meta descriptions. 


## Wild Experiment: Give Agents Access to all Chats

By using the session/message protocol vial lively agents would in principle have access to their own chat sessions. The Idea would be that they instead of doing research into the system over and over again they can directly read their own insights in one swoosh. For that they may have to be aware of their own messages and be able to quickly search and navigate in them. 


## IndexDB back Agent Session History

If we store all the messages and session in IndexDB, we can more efficiently structure and search them directly with JavaScript. And we don't have to give the agent access to their own raw data that they have to poke with grep first!


