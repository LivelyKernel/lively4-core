# Lively4 

- Self-supporting Web-based Development Environment

- Workflow of developing JavaScript on a Web-page
  - persisted into GitHub (indirectly through lively4-server or directly through service worker)
  - reload modules at runtime. 
  - Models that provide prototypes for templates such as "Windows" are also updated at runtime. 

- Workflow of developing components as HTML templates on a Web-page
  - persisted into GitHub
  - templates can be exchanged at runtime, so that new HTML elements are build with the new template
  - old html elements are migrated by replacing them with new ones. 
    - attributes and children are preseved
    - all inner content (subnodes of shadowRoot) are thrown away
    - outgoing and incoming JavaScript object references are ignored

## Future Work

- Workflow of live object based editing of templates
- Cutting out any HTML objects as templates on the Web and reusing them later (in mashups)? #Tim 
 
