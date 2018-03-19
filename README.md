# The **Lively4** Web-based Development Environment

[![Build Status](https://travis-ci.org/LivelyKernel/lively4-core.svg)](https://travis-ci.org/LivelyKernel/lively4-core)

A self-supporting Web-based development environment. 

## Getting Started

[Getting Started Guide](./doc/tutorial/index.md)

### Example Lively4 Sites

<!-- 

- [https://livelykernel.github.io/lively4-core/](https://livelykernel.github.io/lively4-core/start.html)
	- HEAD of Lively4 core repository
	- served by github.io
	- no CORS (not usable by [Lively4 chrome plugin](https://github.com/LivelyKernel/lively4-chrome-loader)
	- edits go to github but take time, login to github using filesystem component

-->

### [lively-kernel.org > lively4-core](https://lively-kernel.org/lively4/lively4-core/start.html)

- served with lively4-server
- manually updated
- CORS support, default server for lively4 chrome extension
- directly edit source code in a self-supporting way
- A second server [https://lively-kernel.org/lively4S2/lively4-core/](https://lively-kernel.org/lively4S2/lively4-core/) is used to allow for safe self-supporting develpment even on the [lively4-server code](https://lively-kernel.org/lively4/lively4-core/start.html?edit=https://lively-kernel.org/lively4/lively4-server/httpServer.js)

<!--
- [Lively4 Journal](https://lively-kernel.org/lively4/lively4-core/start.html?load=https://lively-kernel.org/lively4/Lively4.wiki/Journal.md) or see the [same in Github Wiki](https://github.com/LivelyKernel/Lively4/wiki/Journal) 
-->

## Other Projects


### Chrome Extension

- install [Chrome Extension](https://chrome.google.com/webstore/detail/lively4-loader/nolpicfdelklinibcdldjhajakffhhom) to load Lively4 into any webpage and start adapting your website while you visit it.... 


# start.html

Initially, we were not clear on how to navigate from lively page to lively page. To not "boot" Lively4 on every page load and to access all the files the service worker makes available to us, we now use an initial "jump" page.

One can be able to browse all kind of content:

```
https://livelykernel.github.io/lively4-core/start.html?load=/README.md

https://livelykernel.github.io/lively4-core/start.html?load=/sys/mounts
```

The last example demonstrates also the magic of service worker. Through this indirection we can access all mounted file systems, the service worker provided to us.


To edit files directly, one can use "edit" instead of "load":
```
https://livelykernel.github.io/lively4-core/start.html?edit=/README.md
```

# Subtrees

```
# #TODO refactor this into lively4-server
git subtree add -P src/external/lively4-search https://github.com/LivelyKernel/lively4-search.git master
```

# Welcome to <img alt="Lively 4" style="position:relative; top: 25px" src="media/lively4_logo_smooth_100.png" />

- Sofware Architecture Group, Hasso Plattner Institute,  2015-2018 [MIT LICENSE](LICENSE)
- Jens Lincke, Stefan Ramson, Tim Felgentreff, Fabio Niephaus, Robert Hirschfeld, Marcel Taeumel
- Seminars
  - Software Design  [SWD 2015](doc/SWD2015/index.md) 
   [SWD 2016](doc/SWD2015/index.md)
  - Web-based Development [WebDev 2016](doc/WebDev2016/index.md), [WebDev 2017/18](doc/WebDev2017/index.md)
- [readme](README.md)
- Lively funktioniert auch offline

## Live Source Code

- [modules](src/client/) 
  - [lively.js](src/client/lively.js)
  - [contextmenu.js](src/client/contextmenu.js)
  - [keys.js](src/client/keys.js)
  - [html.js](src/client/html.js)
  - ...
- [UI components ](templates/) [parts](parts/)

## External Code

We hope to come up with a solution, that will be as comfortable as npm for node.js development, 
but at the same time will serve our need better to jump into development and immediatly make local customizations. 

- [external](src/external/): static copies, manually management needed

