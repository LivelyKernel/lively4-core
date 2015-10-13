l4.importScripts('src/sw/messaging-tasks/github/github.js');
//l4.importScripts('src/sw/messaging-tasks/github/credentials.js');

l4.messageTask('github api', function match(event) {
    return hasPort(event) &&
        event.data &&
        event.data.meta &&
        event.data.meta.type === 'github api';
}, function react(event) {
    var topLevelAPIMapping = {
        getIssues: 'getIssues',
        getRepo: 'getRepo',
        getUser: 'getUser',
        getGist: 'getGist'
    };

    var callback = function(err, data) {
        console.log(err, data);

        if(err) {
            console.log("GithubError: " +  JSON.serialize(err));
        }
        getSource(event).postMessage({
            meta: {
                type: 'github api response',
                receivedMessage: event.data
            },
            message: data
        });
    };

    var message = event.data.message,
        credentials = message.credentials || GITHUB_CREDENTIALS,
        github = new Github(credentials),
        topLevelAPIName = topLevelAPIMapping[message.topLevelAPI],
        topLevelAPIFunction = github[topLevelAPIName],
        apiObject = topLevelAPIFunction.apply(github, message.topLevelArguments),
        methodName = message.method,
        methodFunction = apiObject[methodName],
        args = message.args.concat(callback);

    methodFunction.apply(apiObject, args);

    return true;
});

/*
var github = new Github(GITHUB_CREDENTIALS),
    repo = github.getRepo('jquery', 'jquery');

repo.show(function showRepoCallback(err, repo) {
    console.log('----------------------------------------------------------');
    if(err) { console.log('ERROR', err); }
    console.log(repo);
    console.log('----------------------------------------------------------');
});

repo.fork(function(err, res) {
    console.log(err);
    console.log(res);
});
(new Github(GITHUB_CREDENTIALS))
    .getRepo('Lively4', 'manuallycreated')
    .read('master', 'README.md', function(err, data) {
        console.log(err, data);
    });
(new Github(GITHUB_CREDENTIALS))
    .getRepo('Lively4', 'manuallycreated')
    .write('master', 'README.md', `# manuallycreated
 A repository to be deleted by Lively4.
 THIS IS NEW!
 `,
    'autocommitted by Lively4',
    function(err, data) {
        console.log(err, data);
    });

(new Github(GITHUB_CREDENTIALS))
    .getUser()
    .show('Lively4', function(err, data) {
        console.log('Lively4\'s User Profile', err, data);
    });

(new Github(GITHUB_CREDENTIALS))
    .getUser()
    .userRepos('Lively4', function(err, data) {
        console.log('Lively4\'s Repos', err, data);
    });

(new Github(GITHUB_CREDENTIALS))
    .getUser()
    .userRepos('Lively4', function(err, data) {
        console.log('Lively4\'s Repos #####################################');
        console.log(err, data);
    });

(new Github(GITHUB_CREDENTIALS))
    .getUser()
    .createRepo({
        name: 'autorepo',
        description: 'This repo is auto-generated',
        "private": false,
        "has_issues": true,
        "has_wiki": true,
        "has_downloads": true,
        auto_init: true
    }, function(err, data) {
        console.log('POSSIBLY CREATED A REPO', err, data);
        repo = github.getRepo('Lively4', 'autorepo');
        repo.deleteRepo(function(err, res) {
            if(err) {
                console.log('ERROR ON DELETING A REPO!!!!');
                console.log(err);
            } else {
                console.log('DELETED A REPO!!!!');
                console.log(res);
            }
        });
    });
 */
