l4.importScripts('src/sw/core.js');
l4.importScripts('src/sw/fetch.js');

(function() {
    var expression = /^(https:\/\/openwindow\/)/;

    l4.fetchTask('openwindow', l4.urlMatch(expression), function(event) {

        // clients.openWindow("https://livelykernel.github.io/lively4-core/draft/test.html")

        self.addEventListener('notificationclick', function(event) {
            console.log('On notification click: ', event.notification.tag);
            event.notification.close();
            // This looks to see if the current is already open and
            // focuses if it is
            event.waitUntil(clients.matchAll({
                type: "window"
            }).then(function(clientList) {
                return clients.openWindow('/');
            }));
        });
        return new Response("Yeah! Windows 95!")
    });
})();
