const upstream = require('./kernel.conf.l4.js')

Object.assign(module.exports, upstream, {
  WORKER_BASE: "/lively4-serviceworker/src/",
})
