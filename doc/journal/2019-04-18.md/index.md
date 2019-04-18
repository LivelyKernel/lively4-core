## 2019-04-18

```
1 40ms Setup SystemJS
2 584ms Invalidate Caches (in boot.js)
3 1929ms Initialize SystemJS
4 11ms Wait on service worker (in load.js)
5 592ms Load Base System (lively.js)
6 22ms Load Standard Library
7 1849ms Initialize Document (in lively.js)
8 1ms Look for uninitialized instances of Web Compoments
```


## OMG Cold Bootlolg... even with preloading we have a lot to do!

```
1 880ms Setup SystemJS
2 777ms Invalidate Caches (in boot.js)
3 5054ms Initialize SystemJS
4 223ms Wait on service worker (in load.js)
5 59469ms Preload Files
6 20271ms Load Base System (lively.js)
7 693ms Load Standard Library
8 57562ms Initialize Document (in lively.js)
9 2042ms Look for uninitialized instances of Web Compoments
```