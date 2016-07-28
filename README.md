[![Build Status](https://travis-ci.org/LivelyKernel/lively4-core.svg)](https://travis-ci.org/LivelyKernel/lively4-core) Core functionality for [Lively4](https://github.com/LivelyKernel/Lively4/wiki/).

# Example Lively4 Sites


- [https://livelykernel.github.io/lively4-core/](https://livelykernel.github.io/lively4-core/start.html)
	- HEAD of Lively4 core repository
	- served by github.io
	- no CORS (not usable by [Lively4 chrome plugin](https://github.com/LivelyKernel/lively4-chrome-loader] as backend)
	- edits go to github but take time, login to github using filesystem component
	
- [https://lively-kernel.org/lively4/lively4-core/](https://lively-kernel.org/lively4/lively4-core/start.html)
	- served with lively4-server
	- manually updated
	- CORS support, default server for lively4 chrome extension
	- directly edit source code in a self-supporting way
	- A second server [https://lively-kernel.org/lively4S2/lively4-core/](https://lively-kernel.org/lively4S2/lively4-core/) is used to allow for safe self-supporting develpment even on the [lively4-server code](https://lively-kernel.org/lively4/lively4-core/start.html?edit=https://lively-kernel.org/lively4/lively4-server/httpServer.js)

- [Lively4 Journal](https://lively-kernel.org/lively4/lively4-core/start.html?load=https://lively-kernel.org/lively4/Lively4.wiki/Journal.md) or see the [same in Github Wiki]([https://github.com/LivelyKernel/Lively4/wiki/Journal) 

# Chrome Extension

- install [Chrome Extension](https://chrome.google.com/webstore/detail/lively4-loader/nolpicfdelklinibcdldjhajakffhhom) to load Lively4 into any webpage and start adapting your website while you visit it.... 


# start.html

Innitially, we were not clear on how to navigate from lively page to lively page. To not "boot" Lively4 on every page load and to access all the files the service worker makes available to us, we now use an initial "jump" page.

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


