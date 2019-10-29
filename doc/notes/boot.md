# Booting / Loading of Lively4


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
