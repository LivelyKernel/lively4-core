[![Build Status](https://travis-ci.org/LivelyKernel/lively4-core.svg)](https://travis-ci.org/LivelyKernel/lively4-core)


Core functionality for Lively4 module management.


# Example Lively4 Sites

- [https://livelykernel.github.io/lively4-core/draft/start.html?load=/README.md](https://livelykernel.github.io/lively4-core/draft/start.html?load=/README.md)
	- HEAD of Lively4 core repository
	- served by github.io
	- no CORS (not usable by lively4 chromeplugin as backend)
	- edits go to github but take time, login to github using filesystem component
	
- [https://lively-kernel.org/lively4/draft/start.html?load=/README.md](https://livelykernel.github.io/lively4-core/draft/start.html?load=/README.md) 
	- served with lively4-server
	- manually updated
	- CORS support, default server for lively4 chrome extension
	- directly edit source code (not version and will end in file system, but not githbub yet)

# Chrome Extension

- install [Chrom Extension](https://chrome.google.com/webstore/detail/lively4-loader/nolpicfdelklinibcdldjhajakffhhom) to load Lively4 into any webpage and start adapting your website while you visit it.... 


# start.html

We, are not clear how we want to navigate from lively page to lively page. To not "boot" lively on every
page load and to access all the files the service worker makes available to us, we will now use an initial "jump"
page.



One should be able to browse all kind of content. Such as basic HTML
```
https://livelykernel.github.io/lively4-core/draft/start.html?load=/draft/hello.html
```

To Markdown:

```
https://livelykernel.github.io/lively4-core/draft/start.html?load=/README.md
```

To plain files:

```
https://livelykernel.github.io/lively4-core/draft/start.html?load=/sys/mounts
```

The last example demonstrates also the magic of service worker. Through this indirection we can access all
mounted file systems, the service worker provided to us.


To edit files directly, one can use "edit" instead of "load":
```
https://livelykernel.github.io/lively4-core/draft/start.html?edit=/draft/hello.html
```


