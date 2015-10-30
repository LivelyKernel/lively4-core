l4.importScripts('src/sw/core.js');
l4.importScripts('src/sw/fetch.js');

l4.importScripts('src/external/babel-browser.js');

l4.importScripts('src/sw/transform.js');

(function() {
    function notBlacklisted(response) {
        var blackList = [
            'src/external/babel-browser.js',
            'bootworker.js',
            'serviceworker.js',
            'src/external/system.src.js',
            'serviceworker-loader.js',
            'https://code.jquery.com/jquery-2.1.4.js'
        ];

        var isJS = response.url.indexOf('.js') > -1;
        var inBlackList = false;
        for(var i = 0; i < blackList.length; i++) {
            inBlackList = inBlackList || response.url.indexOf(blackList[i]) > -1;
        }
        return isJS && !inBlackList;
    }

    function babelTransform(content) {
        return babel.transform(content, {
            //modules: 'system'
        }).code;
    }
    

    l4.fetchTask('babel src transform', notBlacklisted, function(event) {
        return l4.parseEvent(event)
            .then(l4.through(function(request) {
                console.log('#+#+##+#+#+++#+#+#+##+#+#+#+#+#+#+#+#+#+#+##++##+#+#+#+');
                console.log('src transform');
            }))
            .then(fetch) // #TODO why let babel retrieve the source here? Should't this happen in the pipline before #JensLincke
            .then(transform(babelTransform));
    });
})();
