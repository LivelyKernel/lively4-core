'use strict';

function swx() {
    if(typeof System === 'undefined') {
        importScripts('./vendor/regenerator-runtime.js')
        importScripts('./vendor/babel-browser.js')
        importScripts('./vendor/es6-module-loader-dev.js')

        System.transpiler = 'babel'
        System.babelOptions = {stage: 0, optional: ['es7.doExpressions']}

        System.fetch = function(load) {
            return fetch(load.address, {cache: 'no-cache'})
                .then((response) => {
                    if(response.ok)
                        return response.text()
                    else
                        throw new Error('')
                })
        }
    }

    return System.import('src/swx/swx.jsx')
}

function __reload__() {
    delete self.System
    swx()
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
        __reload__()
    } else {
        swx().then(function(sw) {
            return sw.message(event)
        }).catch(function(err) {
            console.error(err)
        })
    }
})
