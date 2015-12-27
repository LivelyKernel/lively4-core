'use strict';

var swx = self.__swx_refresh__ = function swx() {
    var options = arguments[0] || {}

    if(typeof System === 'undefined' || options.force) {
        if(options.force) {
            delete self.System
            console.log('SWL: force reload')
        } else {
            console.log('SWL: reload')
        }

        importScripts('./vendor/regenerator-runtime.js')
        importScripts('./vendor/babel-browser.js')
        importScripts('./vendor/es6-module-loader-dev.js')

        System.transpiler = 'babel'
        System.babelOptions = {stage: 0, optional: ['es7.doExpressions']}
    }

    return System.import('src/swx/swx.jsx')
}

self.addEventListener('install', function(event) {
    console.log('SWL: install')

    event.waitUntil(Promise.all([
        self.skipWaiting(),
        swx().then(function(swx) {
            return swx.install(event)
        }).catch(function(err) {
            console.error(err)
        })
    ]))
})

self.addEventListener('activate', function(event) {
    console.log('SWL: activate')

    event.waitUntil(Promise.all([
        self.clients.claim(),
        swx().then(function(swx) {
            return swx.activate(event)
        }).catch(function(err) {
            console.error(err)
        })
    ]))
})

self.addEventListener('fetch', function(event) {
    swx().then(function(sw) {
        return sw.fetch(event)
    }).catch(function(err) {
        console.error(err)
    })
})

self.addEventListener('message', function(event) {
    if(event.data === 'swx-loader:force-reload') {
        swx({force: true})
    } else {
        swx().then(function(sw) {
            return sw.message(event)
        }).catch(function(err) {
            console.error(err)
        })
    }
})
