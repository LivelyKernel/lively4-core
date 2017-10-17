# Software Design 2017 - HPI Seminar on evolving the Lively4 Web-based Development Environment

The seminar will build upon the results of our previous [SWD](SWD15), [SWD](SWD16) and [WebDev](WebDev16) seminars.

The development environment runs in the browser and uses browser local storage, GitHub, Dropbox and other Cloud APIs for persistence. 

For faster development and other experiments we also have our very basic node.js service, that gives us more control during development. 


## Quick Manual for Lively4

- CTRL+Click opens Halo to drag, copy, edit all DOM elements directly on a web page
- (CTRL+)RightClick opens context menu with various tools...

## Halo

<script>
fetch(lively4url + "/doc/SWD2017/halo.html").then(t => t.text())
</script>


## Context Menus


<script>
fetch(lively4url + "/doc/SWD2017/contextmenu.html").then(t => t.text())
</script>


## Tools

<script>
fetch(lively4url + "/doc/SWD2017/tools.html").then(t => t.text())
</script>




# Getting Started

## Basic Lively4 development workflow:

- a) Go to https://lively-kernel.org/lively4/lively4-core/start.html
- b) Play around with objects and in workspace 
  - Ctrl-Left/Right Click for Halo and context menu
- c) Use tools to browse and change modules and templates
- d) Open Sync tool and log with github account 
- e) Press sync to update your instance and commit changes

## Advanced Lively4: 

- Work in different [branches](https://lively-kernel.org/lively4/) created with the "Sync Github"
- Install your own lively4-server

## Development Links

- Github Projects: 
  - https://github.com/livelykernel/lively4-core 
  - https://github.com/LivelyKernel/lively4-server (optional) 
  - https://github.com/LivelyKernel/lively4-chrome-loader (optional)
- Deployed on lively-kernel.org: 
  - https://lively-kernel.org/lively4/lively4-core/start.html

