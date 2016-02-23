[![Build Status](https://travis-ci.org/LivelyKernel/lively4-core.svg)](https://travis-ci.org/LivelyKernel/lively4-core)
 
Core functionality for Lively4 module management

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
