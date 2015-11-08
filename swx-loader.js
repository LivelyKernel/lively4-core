'use strict';

function swx() {
    var options = arguments[0] || {}

    if(typeof System === 'undefined' || options.force) {
        if(options.force) {
            console.log('SWL: force reload')
        } else {
            console.log('SWL: reload')
        }

        importScripts('./vendor/babel-browser.js')
        importScripts('./vendor/es6-module-loader-dev.js')
        System.transpiler = 'babel'
    }

    return System.import('src/swx/swx.jsx')
}

self.addEventListener('install', function(event) {
    console.log('SWL: install')

    event.waitUntil(Promise.all([
        self.skipWaiting(),
        swx().then(function(swx) {
            return swx.install(event)
        })
    ]))
})

self.addEventListener('activate', function(event) {
    console.log('SWL: activate')

    event.waitUntil(Promise.all([
        self.clients.claim(),
        swx().then(function(swx) {
            return swx.activate(event)
        })
    ]))
})

self.addEventListener('fetch', function(event) {
    swx().then(function(sw) {
        return sw.fetch(event)
    })
})

self.addEventListener('message', function(event) {
    swx().then(function(sw) {
        return sw.message(event)
    })
})
