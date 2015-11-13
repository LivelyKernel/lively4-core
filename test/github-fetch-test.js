define(function(require) {
    "use strict";

    var expect = chai.expect;
    require('./../src/external/focalStorage.js');
    
    describe('Github Fetch API', function() {
        it('throw an error if not github token is available', function(done) {
            focalStorage.getItem("githubToken")
                .then(function(item){
                    expect(item).to.exist
                })
                .then(done)
                .catch(done);
        });

        it('fetches a file with a xmlhttp get request from github', function(done) {
            $.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md", undefined,
                function(result) {
                    expect(result).to.exist                
                    done()
                }).fail(function(err, status) {
                    done(err)
                })
        });
        it('get an 404 when fetching a non existing file with an xmlhttp get request from github', function(done) {
            $.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/I_do_not_exist.txt", undefined,
                function(result) {
                    done(new Error("We expected an error but got this as result: " + result))
                }).fail(function(err, status) {
                    expect(err.status).to.be.equal(404)
                    done()
                })
        });
        it('writes new contents of a file with a xmlhttp put request from github', function(done) {
            var newcontent = "Last write: " + new Date()
            var url = "https://github.lively4/repo/livelykernel/lively4-dummy/master/writetest.txt"
            $.ajax({
                method: "PUT", 
                url: url,
                data: newcontent,
                success: function(result) {
                    $.get(url, null, function(result) {
                        expect(result).to.be.equal(newcontent)
                        done()
                    }).fail(function(err, status) {
                        done(new Error("Github Error" + JSON.stringify(err))) 
                    })
                },
                error: function(err, status) {
                    done(new Error("Github Error" + JSON.stringify(err)))
                }
            })
        });
    });
});
