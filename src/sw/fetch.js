(function() {
    "use strict";

    l4.parseEvent = function parseEvent(event) {
        console.log(event.request.url);
        return Promise.resolve(event.request);
    };

    l4.urlMatch = function(regex) {
        return function(request) {
            return request.url.match(regex);
        }
    };

    l4.THETASKS = [];
    l4.fetchTask = function(name, matcher, processor) {
        l4.THETASKS.unshift({
            name: name,
            matcher: matcher,
            processor: processor
        });
    };

    self.addEventListener('fetch', function applyTasks(event) {
        console.log('Service Worker: Fetch', event.request, event.request.url);
        l4.broadCastMessage('FETCHING THIS STUFF2: ' + event.request.url);

        var chosenTask = null;
        l4.THETASKS.some(function(THETASK) {
            console.log('trying', THETASK.name);
            return THETASK.matcher(event.request) && (chosenTask = THETASK.processor);
        });

        event.respondWith(chosenTask(event));
    });
})();

/*
 // TODO: gulp-like stream processing of requests and/or messages
 // what is a task?
 l4.task('github*', str => {
 l4.start(str)
 .then(loader(l4-github.request))
 .then(transform(l4_babel))
 .then(transform(l4_bbb))
 .then(l4_write())
 });
 */

l4.fetchTask('default', function() { return true; }, function(event) {
    return l4.parseEvent(event)
        .then(fetch);
});
