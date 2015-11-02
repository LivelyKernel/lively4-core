l4.importScripts('src/sw/core.js');
l4.importScripts('src/sw/fetch.js');

l4.importScripts('src/sw/messaging-tasks/github/github.js');

l4.importScripts('src/external/focalStorage.js');

//l4.importScripts('src/sw/messaging-tasks/github/credentials.js');

(function() {
    var expression = /^(https:\/\/github.lively4\/)/;

    l4.fetchTask('fetch github', l4.urlMatch(expression), function(event) {
        var request = event.request;

        console.log('GitHub fetch: ', request.url);
        // TODO: timeout?
        function ensureToken(githubToken) {
            // TODO: user rejection not handled yet
            return new Promise(function(resolve, reject) {
                if (!githubToken) {
                    console.log("githubToken not found");
                    var cbId = Date.now();
                    l4.registerCallback(cbId, function(token) {
                         return resolve(token);
                    });
                    self.clients.matchAll().then(function(clients) {
                        console.log("ask client for github token");
                        clients[0].postMessage({
                            name: "githubAuthTokenRequired",
                            callbackId: cbId
                        });
                    })
                } else {
                    resolve(githubToken)
                }
            });
        }

        function fetchWithToken(githubToken) {
            return new Promise(function(resolve, reject) {
                console.log("fetchWithToken " + githubToken);
                
                console.log('got githubCredentials');

                var githubCredentials = {
                    token: githubToken,
                    auth: 'oauth' 
                };
                var s = request.url.replace(expression, '');
                var exp = new RegExp("([^/]*)/([^/]*)/([^/]*)/([^/]*)/(.*)");
                var match = exp.exec(s);

                // Example: https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md
                                
                var username = match[2],
                    reponame = match[3],
                    branch = match[4],
                    path = match[5];

                var method = request.method,
                    isPut = method === 'PUT';

                function sendGithubRequest(contentToWrite) {
                    var message = {
                        topLevelAPI: match[1],
                        topLevelArguments: [username, reponame],
                        method: isPut ? 'write' : 'read',
                        args: isPut ? [branch, path, contentToWrite, 'auto commit'] : [branch, path]
                    };

                    var topLevelAPIMapping = {
                        issues: 'getIssues',
                        repo: 'getRepo',
                        user: 'getUser',
                        gist: 'getGist'
                    };

                    var callback = function(err, data) {
                        console.log("resolve: " + resolve + " error:" + reject);
                        console.log("Github API response (fetch): ", err, data);

                        if(err) {
                            l4.broadCastMessage("Github error: " + JSON.stringify(err));
                            resolve(new Response("Github Error:" + err, 
                                {status: 404, statusText: "Resource not found!"}))
                        }  else {
                            resolve(new Response(data))
                        }
                    };

                    var credentials = githubCredentials,
                        github = new Github(credentials),
                        topLevelAPIName = topLevelAPIMapping[message.topLevelAPI],
                        topLevelAPIFunction = github[topLevelAPIName],
                        apiObject = topLevelAPIFunction.apply(github, message.topLevelArguments),
                        methodName = message.method,
                        methodFunction = apiObject[methodName],
                        args = message.args.concat(callback);

                    methodFunction.apply(apiObject, args);
                }

                if(isPut) {
                    request.text().then(sendGithubRequest);
                } else {
                    sendGithubRequest();
                }
            });
        }

        return focalStorage.getItem("githubToken")
            .then(ensureToken)
            .then(fetchWithToken)
            .catch(function(err) {
                console.log("focalStorage Error: " + err)
                return // Error ??
            });
    })
})();
