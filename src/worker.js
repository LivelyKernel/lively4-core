export default function() {
  this.addEventListener('install', (event) => {
    event.waitUntil(this.skipWaiting())
  })

  this.addEventListener('activate', (event) => {
    console.log('L4K: activate', event)

    event.waitUntil(this.clients.claim())
  })

  this.addEventListener('fetch', (event) => {
    console.log('L4K: fetch', event, event.request.url)

    event.respondWith(this.fetch(event.request))
  })

  this.addEventListener('message', (event) => {
    if(typeof event.data.__l4k_boot_kernel !== 'undefined') {

    }

    console.log('L4K: message', event, event.data)
  })
}
