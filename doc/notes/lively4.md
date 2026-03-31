# Lively4 

- Self-supporting Web-based Development Environment
- Workflow of developing JavaScript on a webpage
  - persisted into GitHub (indirectly through lively4-server or directly through service worker)
  - reload modules at runtime. 
  - Models that provide prototypes for templates, such as "Windows," are also updated at runtime. 
- Workflow of developing components as HTML templates on a webpage
  - persisted into GitHub
  - templates can be exchanged at runtime, so that new HTML elements are built with the new template
  - Old HTML elements are migrated by replacing them with new ones. 
    - attributes and children are preserved
    - all inner content (subnodes of shadowRoot) is thrown away
    - outgoing and incoming JavaScript object references are ignored