module.exports = {
  // Base path prepended to initial files and kernel loader
  // Can be an absolute URL or an relative path to kernel location at runtime.
  BASE: "./lively",

  // Enable or disable transpiling for loader module
  // Disabling transpiling requires a static build or precompiled
  // systemjs-like loader compatible files.
  LOADER_TRANSPILE: true,

  // Enable client kernel module
  CLIENT: true,

  // Initial file to load for client module
  CLIENT_INIT: "/init.js",

  // Enable service worker kernel module
  WORKER: true,

  // Initial file to load for service worker
  WORKER_INIT: "/init-sw.js",

  // If WORKER_INIT should be embedded into kernel (static compile)
  WORKER_EMBED: false,
}
