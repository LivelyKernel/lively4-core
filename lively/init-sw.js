
export async function install(event) {
  return self.skipWaiting()
}

export async function activate(event) {
  return self.clients.claim()
}

export async function fetch(event) {
  return event.respondWith(self.fetch(event.request))
}

export async function message(event) {
  console.log(event)
}
