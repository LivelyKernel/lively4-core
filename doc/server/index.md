# Lively Server

- source: <https://lively-kernel.org/lively4/lively4-server/>
- production server <https://lively-kernel.org/lively4>
  - auto restarts after crash/kill and updates from github
- dev server <https://lively-kernel.org/lively4S2>
  - auto restarts after changes in source  
- [filelist](filelist.md) format
- A second server [https://lively-kernel.org/lively4S2/lively4-core/](https://lively-kernel.org/lively4S2/lively4-core/) is used to allow for safe self-supporting develpment even on the [lively4-server code](https://lively-kernel.org/lively4/lively4-core/start.html?edit=https://lively-kernel.org/lively4/lively4-server/httpServer.js)


## Workflow

- edit source in lively4-server 
- get feedback and with `fetch` on "lively4S2" 
- see logout through ssh/screen terminal connection 
  - #TODO get rid of this step and replace it with feedback within Lively4