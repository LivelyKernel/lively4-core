# First Steps

## Generell

Wenn ihr fr&uuml;her Feedback haben wollt oder auf Show-Stopper sto&szlig;t: Kommt vorbei (C.E-3, C.E-8)

---

# VivideJS
## Gruppe 1: Jonas Chromik

- Resources
  - Vivide Tutorial Videos
  - Vivide Paper
  - Marcel
- Humans to talk to
  - Marcel (Theory, Dataflow, Tangible Objects)
  - Patrick (Use Case Driven, Big Picture)
  - Stefan (Polishment, no explorability)
- Start with **real data**:
  - [Lively4 SystemJS Modules](https://lively-kernel.org/lively4/lively4-core/templates/lively-module-graph.js)
  - your dropbox/google drive

---

# Offline First
## Gruppe 2: David Rauch, Sebastian Koall

Your domain: [Service Worker](https://lively-kernel.org/lively4/lively4-core/swx-loader.js)

Tasks:

- Intercept every stat, read, write, and delete request
- Serve from cache if offline
- Write cached write requests once reconnected

Zu beachten:

- Transparent to mounted file systems
- Later:
  - update policies
  - managing conflicts

---

# PDF Annotator
## Gruppe 3: Henriette Dinger, Sebastian Kliem

Web component [lively-pdf](https://lively-kernel.org/lively4/lively4-core/templates/lively-pdf.html) already uses [pdf.js](https://lively-kernel.org/lively4/lively4-core/src/external/pdf.js) to read annotations.
- try it out
- understand API
- edit pdf with anntotation by hand, look at the result

Related work:
- [Hypothes.is](https://via.hypothes.is/http://lively-kernel.org/publications/media/KrahnIngallsHirschfeldLinckePalacz_2009_LivelyWikiADevelopmentEnvironmentForCreatingAndSharingActiveWebContent_AcmDL.pdf) with the respective [github project](https://github.com/hypothesis/via).

Tasks:
- extract annotations
- display extern and intern annotations
- save annotation internally

---

# Handwriting Recognition
## Gruppe 4: Toni Stachewicz, Niklas Hoffmann


Failed Attempts
- [Grail Handwriting recognition](https://lively-kernel.org/lively4/lively4-core/demos/grail-handwriting.html)
- [Tesseract as JS Library (OCR)](https://lively-kernel.org/lively4/lively4-core/demos/tesseract_hand.html)
- MyScript (Paid Service: 2000 Requests per month free)
- [ocrad.js - ocr using emscripten](https://antimatter15.com/project/ocrad-js/)
- Windows App (Awesome Recognition, not accessible from outside)

Successes
- [MorphicJS (Windows App)](https://github.com/timfel/morphicjs-pen)
- [Hyper Lively (Astrid Thomschkes Master Thesis)](http://athomschke.github.io/hyperlively/src/client/index.html)

Task: Go wide!
- Explore many possibilities (for now)
- No polishment
- Target immediate handwriting recognition

---

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

---

# Semantic Source Code Navigation
## Gruppe 6: Siegfried Horschig, Theresa Zobel

Task: Webstorm-like Shift+Click navigation for senders and implementors.

Code mirror + [Tern plugin for auto-completion](https://lively-kernel.org/lively4/lively4-core/templates/lively-code-mirror.js)
- limited to currently open file
- provide tern multiple (all? (cached in local storage)) files, properly linked up (e.g. [lively-specific aliases](https://lively-kernel.org/lively4/lively4-core/src/client/boot.js))

---

# Lively4 App
## Gruppe 7: Marcel Jankrift, Benjamin Feldmann

Task:
1. Local lively setup
2. Bundle local setup into  (using e.g. Electron)
  - Archiving of Demos
  - Work locally
    - how to synchronize with the world?

---

# Exploring Microdata
## Gruppe 8: Volker Schiewe

- Take a look at the [Previous student project](https://lively-kernel.org/lively4/lively4-core/doc/WebDev2016/project2.md)
- Use [Googles Testing Tool](https://developers.google.com/structured-data/testing-tool/
) to explore microformats on websites
  - Use websides that provide semantic information not only in the header
- Use Lively Plugin to load Lively on those sites
- Make semantic data tangible (visible + scriptable)
  - extract data
  - publish/connect data

Ansprechpartner: Patrick Rein (C.E-5)
