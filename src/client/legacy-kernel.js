//
// This legacy kernel provide the kernel API from lively4-kernel
// for the old load.js and lively.js in core
//
// This allows to start rewrite code using the kernel API that can still
// be loaded by load.js / lively.js


export function resolve(name) {
  return new URL(realpath(name), window.lively4url).toString()
}

export function realpath(name) {
  return new URL(window.lively4url + '/' + name).pathname.replace(/\/+/, '/')
}
