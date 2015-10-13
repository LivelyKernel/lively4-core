(function() {
    "use strict";

    l4.parseEvent = function parseEvent(event) {
        console.log(event.request.url);
        return Promise.resolve(event.request);
    };

    /**
     * Takes a regular expression and returns a function.
     * The returned function consumes a Request object and returns true iff
     * the its url matches the regular expression.
     * @param {Regex} regex
     * @returns {Function}
     */
    l4.urlMatch = function(regex) {
        return function(request) {
            return request.url.match(regex);
        }
    };

    var fetchTasks = [];

    /**
     *
     * @param {String} name
     * @param {Function} matcher
     * @param {Function} processor
     */
    l4.fetchTask = function(name, matcher, processor) {
        fetchTasks.unshift({
            name: name,
            matcher: matcher,
            processor: processor
        });
    };

    self.addEventListener('fetch', function applyTasks(event) {
        console.log('Service Worker: Fetch ' + event.request.method + " "+ event.request.url);
        
        var chosenTask = null;
        fetchTasks.some(function(task) {
            var useTask = task.matcher(event.request);

            if(useTask) {
                console.log('use ' + task.name + ' for ' + event.request.url);
                chosenTask = task.processor;
            }

            return useTask;
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
