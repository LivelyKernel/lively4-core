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