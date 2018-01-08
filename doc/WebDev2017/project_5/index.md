
# Scripting Cloud Data Flow
## Gruppe 5: Jonas Keutel, Cornelius Hagmeister

Scripting Cloud Data Flow: Schaut euch (kurz) einige existierende Systeme an(diese sind konfigurationssystemem, keine script-umgebungen)
- IfThisThanThat (e.g. [Dropbox](https://ifttt.com/dropbox)/[Trello](https://ifttt.com/trello)/[Github](https://ifttt.com/github)) (uses polling)
- Yahoo! Pipes
- Apple Automator

Recent student Project: [Lively Services](https://lively-kernel.org/lively4/lively4-core/templates/lively-services.js) (Fabio Niephaus)

- REST plumbing
  - Task: change events from remote storages (currently, we support file access for google drive, dropbox, github)
  - provide simple dataflow model, or something similar, to script on those changes
  - codify the following:
  
```
(1) When a new '.pdf' file is in my dropbox folder 'PhD/papers'
(2) Search for its '.bibtex' data on google scholar
(3) Append that data to 'references.bib' in the dropbox folder
(4) And rename the file to '%author_%year_%title'
```

- Alternative: can we integrate with those meta services?

![frontend](./vision.png)