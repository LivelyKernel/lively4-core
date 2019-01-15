## 2018-11-05 #LivelyServer

- [ ] fix lively server mkdir, PUT, OPTIONs when dealing with no git repository... 

```
[2018-11-05T10:56:14.570Z] [server] ERROR
[2018-11-05T10:58:13.719Z] [server] request OPTIONS /Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:13.719Z] [server] doing a stat on /home/jens/lively4/Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:13.720Z] [server] stats directory: false
[2018-11-05T10:58:13.780Z] [server] request PUT /Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:13.780Z] [server] write file: /home/jens/lively4/Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:13.804Z] [server] last version: null
[2018-11-05T10:58:13.804Z] [server] current version:
[2018-11-05T10:58:13.804Z] [server] size 20
[2018-11-05T10:58:13.808Z] [server] EMAIL undefined USER undefined
[2018-11-05T10:58:13.808Z] [server] [AUTO-COMMIT] cd "/home/jens/lively4/Dropbox";  git add "hpi/Vorlesungen/SWA17/ingalls_1989.md"; git commit -m "AUTO-COMMIT hpi/Vorlesungen/SWA17/ingalls_1989.md"
[2018-11-05T10:58:13.853Z] [server] stdout:
[2018-11-05T10:58:13.854Z] [server] stderr: fatal: Not a git repository (or any parent up to mount point /mnt/e)
Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).
fatal: Not a git repository (or any parent up to mount point /mnt/e)
Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).

[2018-11-05T10:58:13.854Z] [server] ERROR
[2018-11-05T10:58:13.981Z] [server] request OPTIONS /Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:13.981Z] [server] doing a stat on /home/jens/lively4/Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:13.983Z] [server] stats directory: false
[2018-11-05T10:58:14.060Z] [server] request GET /Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
[2018-11-05T10:58:14.060Z] [server] read file /home/jens/lively4/Dropbox/hpi/Vorlesungen/SWA17/ingalls_1989.md
```


## #Insight Lively4 does and Class-based Inheritance?

- Observation
  - Lively4 uses a lot of object composition...
  - but not many inheritance
    - Exceptions: lively-halo-item
  - reason?: Web Components (v0) 
    - use a template and a HTMLElement class in a module
    - one can only inherit from the class in a module, and one has to COPY the template
    - NOT REUSSABLE through simple inheritance
  - #Idea... Next gen Web Components will ditch the HTML component loading through HTML inserts through links and use JavaScript imports
    - that way, the  JavaScript can make use of any inheritance it likes...
  
  