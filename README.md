# Lively Kernel

The Lively kernel is a small bootloader for the Lively environment. It provides a minimal ES6 module loader, allows to transpile ES6+ into runnable code and prepares the environment. This includes testing for ServiceWorker availability and initializes the a service worker environment.

The kernel must be generated (compiled) and put into the document root to support loading ServiceWorkers.

## Usage

Include a script tag like the following to load the kernel:

```html
<script
    src="../dist-kernel.js"
    type="text/javascript"
    charset="utf-8"
    data-lively-kernel>
</script>
```

The `data-lively-kernel` is required as the kernel has to identify it's own script tag to load itself as a service worker.

After the environment is initialized the kernel will load either `/init.js` in the browser tab or `/init-sw.js` in the service worker. These paths will be resolved using a base path, by default `./lively`, that is resolved relative to the `dist-kernel.js`.

All paths are configurable when compiling the kernel (see below).

These init "processes" can be ES6 modules including other files. They will be resolved relative to current file and absolute to the base path from above.

See the following example:

```js
# We are at /src/client.js

import '/my/file.js' # Will load `./lively/my/file.js`

System.import('./header.js') # `./lively/src/header.js`
```

## Kernel API

The kernel exports a module providing functions to communicate with the kernel. This module can be required by importing `"kernel"`:

```js
import * as kernel from 'kernel'

kernel.compile(...)
```

### TODO: List kernel functions

`...`

## Compile

```
$ npm install
$ npm start
```

Running `npm start` will invoke webpack to compile and package the kernel loader sources into a single bundle.

Compilation will be places at `./dist-kernel.js`.

Use `kernel.conf.js` to configure kernel before compiling:

* *base*: The base path used to resolve init files.
  When it's a relative path it be resolved relative to the `dist-kernel.js` path from the script tag.
  An absolute path or a full URL can also be specified.
  The base path cannot be escaped when importing code, the import path will be normalized before being appended to the base path.

* *init*: The path to load in the client (browser tab) after boot.

* *initsw*: The service worker init file to load.

## Development

Run `npm start -- --watch` to start webpack in watch mode. It will continue to watch the source files for changes after initial build and recompile the bundle whenever something changed. Such recompiles will be much faster compared to invoke `npm start` manually as only changes will be recompiled.

## License

(c) Jan Graichen

MIT License
