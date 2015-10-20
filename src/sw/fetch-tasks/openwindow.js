l4.importScripts('src/sw/core.js');
l4.importScripts('src/sw/fetch.js');

(function() {
    var expression = /^(https:\/\/openwindow\/)/;

    l4.fetchTask('openwindow', l4.urlMatch(expression), function(event) {

        clients.openWindow("https://livelykernel.github.io/lively4-core/draft/test.html")

        return new Response("Yeah! Windows 95!")
    });
})();
