define(function(require) {
    "use strict";

    var expect = chai.expect;
    require('https://code.jquery.com/jquery-2.1.4.js');
    var messaging = require('./../src/client/messaging.js');

    describe('Github API', function() {
        // credentials for test user Lively4
        var GITHUB_CREDENTIALS = {
            token: localStorage.githubToken,
            auth: 'oauth'
        };

        it('should show the content of README.md', function(done) {
            messaging.postMessage({
                meta: {
                    type: 'github api'
                },
                message: {
                    credentials: GITHUB_CREDENTIALS,
                    topLevelAPI: 'getRepo',
                    topLevelArguments: ['Lively4', 'manuallycreated'],
                    method: 'read',
                    args: ['master', 'README.md']
                }
            }).then(function(event) {
                console.log('--------------------------------');
                console.log(event.data.message);
                try {
                    expect(event.data.message).to.match(/^# manuallycreated/);
                } catch(e) {
                    console.error(e);
                    throw e;
                }
                done();
            });
        });

        it('should show the jquery repository', function(done) {
            messaging.postMessage({
                meta: {
                    type: 'github api'
                },
                message: {
                    credentials: GITHUB_CREDENTIALS,
                    topLevelAPI: 'getRepo',
                    topLevelArguments: ['jquery', 'jquery'],
                    method: 'show',
                    args: []
                }
            }).then(function(event) {
                expect(event.data.message).to.contain({
                    id: 167174,
                    name: 'jquery',
                    full_name: 'jquery/jquery',
                    fork: false
                });
                done();
            });
        });

        /*
        // debug facilities
        it('should show how to debug failed tests', function(done) {
            messaging.postMessage({
                meta: {
                    type: 'github api'
                },
                message: {
                    credentials: GITHUB_CREDENTIALS,
                    topLevelAPI: 'getRepo',
                    topLevelArguments: ['Lively4', 'manuallycreated'],
                    method: 'read',
                    args: ['master', 'README.md']
                }
            }).then(function(event) {
                console.log('--------------------------------');
                console.log(event.data.message);
                try {
                    expect(event.data.message).to.match(/^# manuallycreated/);
                } catch(e) {
                    console.error(e);
                    throw e;
                }
                done();
            });
             //$.ajax({
             //url: "https://eval/3+4",
             //type: "get",
             //success: function(d) {
             //expect('7').to.equal(d);
             //expect(Github.answer).to.equal(42);
             //done();
             //}
             //});
        });
        */
    });
});
