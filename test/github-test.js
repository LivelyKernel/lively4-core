// #Clipboard #Test

import {expect} from '../node_modules/chai/chai.js';
import Github from 'src/client/github.js'

var that;

function setupGithub() {
  that = new Github()    
  that._token = "xxx_this_is_not_a_token"
  that.issues = function() {
    this._issues = [{
    "url": "https:\/\/api.github.com\/repos\/LivelyKernel\/lively4-core\/issues\/108",
    "repository_url": "https:\/\/api.github.com\/repos\/LivelyKernel\/lively4-core",
    "labels_url": "https:\/\/api.github.com\/repos\/LivelyKernel\/lively4-core\/issues\/108\/labels{\/name}",
    "comments_url": "https:\/\/api.github.com\/repos\/LivelyKernel\/lively4-core\/issues\/108\/comments",
    "events_url": "https:\/\/api.github.com\/repos\/LivelyKernel\/lively4-core\/issues\/108\/events",
    "html_url": "https:\/\/github.com\/LivelyKernel\/lively4-core\/issues\/108",
    "id": 240440332,
    "number": 108,
    "title": "found a bug",
    "user": {
      "login": "JensLincke",
      "id": 1466247, /* ... */
      "type": "User",
      "site_admin": false
    },
    "labels": [
       {"id":365044053,"name":"comp: lively sync","color":"bfd4f2","default":false},
       {"id":412921943,"name":"effort1: easy (hour)","color":"c2e0c6","default":false},
       {"id":412921768,"name":"P0: critical","color":"b60205","default":false},
       {"id":266209579,"name":"type: bug","color":"e6e6e6","default":false}
    ],
    "state": "open",
    "locked": false,
    "assignee": null,
    "assignees": [
    ],
    "milestone": null,
    "comments": 0,
    "created_at": "2017-07-04T14:42:36Z",
    "updated_at": "2017-07-04T14:42:36Z",
    "closed_at": null,
    "body": "just kidding"
  }];
   return Promise.resolve(this._issues) 
  }
}


describe('Github', () => {
  before("setup", () => { setupGithub() });

  describe('issueByTitle', () => {
    it('finds the issue', async (done) => {
      var issue = await that.issueByTitle("found a bug")
      expect(issue.title).to.equals("found a bug")
      done()
    });
  })
  
  describe('issueByNumber', () => {
    it('finds the issue', async (done) => {
      var issue = await that.issueByNumber(108)
      expect(issue.title).to.equals("found a bug")
      done()
    });
  })
})
  
describe('Github Stories', () => {
  before("setup", () => { 
    setupGithub() 
    var lastStoryNumber =1;
    that.create = function(title, body) {
      return Promise.resolve({
        number: lastStoryNumber++,
        title, 
        body,
      })
    }
  });
  
  describe('parseMarkdownStories', () => {
    
    it('parses a project', () => {
      var result = that.parseMarkdownStories("## A Project")
      expect(result[0].project).to.equals("A Project")
    });
    it('parses a commect', () => {
      var result = that.parseMarkdownStories("this is a comment")
      expect(result[0].comment).to.equals("this is a comment")
    });
    it('parses a story', () => {
      var result = that.parseMarkdownStories("- a story")
      expect(result[0].title).to.equals("a story")
    });
    it('parses a story with number', () => {
      var result = that.parseMarkdownStories("- a story #123")
      expect(result[0].number).to.equals(123)
    });
    it('parses a story with state open', () => {
      var result = that.parseMarkdownStories("- a story #open")
      expect(result[0].state).to.equals("open")
    });
    it('parses a story with state closed', () => {
      var result = that.parseMarkdownStories("- a story #closed")
      expect(result[0].state).to.equals("closed")
    });

    it('parses a story with rest', () => {
      var result = that.parseMarkdownStories("- a story 3P #Foo bla #123")
      expect(result[0].title).to.equals("a story")
      expect(result[0].rest).to.equals("3P bla")
    });
    
    it('parses a story with rest and whitespace', () => {
      var result = that.parseMarkdownStories("- a story     3P #Foo bla #123")
      expect(result[0].title).to.equals("a story")
      expect(result[0].rest).to.equals("3P bla")
    });

    it('parses an item', () => {
      var result = that.parseMarkdownStories("  - an item")
      expect(result[0].item).to.equals("- an item")
    });
    it('parses a story with project', () => {
      var result = that.parseMarkdownStories("## a project\n- a story")
      expect(result[1].project).to.equals("a project")
    });
    it('parses a story with labels', () => {
      var result = that.parseMarkdownStories("- a story #bug")
      expect(result[0].labels).to.be.a("array")
      expect(result[0].labels).to.have.length(1)
      expect(result[0].labels[0]).to.equals("type: bug")
    });
    it('parses a story with comp labels', () => {
      var result = that.parseMarkdownStories("- a story #LivelySync")
      expect(result[0].labels[0]).to.equals("comp: lively sync")
    });

    it('parses a story with effort labels', () => {
      var result = that.parseMarkdownStories("- a story #easy")
      expect(result[0].labels[0]).to.equals("effort1: easy (hour)")
    });

    it('parses a story with unknow labels', () => {
      var result = that.parseMarkdownStories("- a story #FooBarBaz")
      expect(result[0].labels[0]).to.equals("comp: foo bar baz")
    });

    it('parses a story with items', () => {
      var result = that.parseMarkdownStories("- a story\n - an item")
      expect(result[0].items[0].item).to.equals("- an item")
    });
  })
  
  describe('fix label', () => {
    it('bug', () => {
      expect(that.labelToTag("type: bug")).to.equals("#bug")
    })
    it('comp: lively sync', () => {
      expect(that.labelToTag("comp: lively sync")).to.equals("#LivelySync")
    })
    it('effort1: easy (hour)', () => {
      expect(that.labelToTag("effort1: easy (hour)")).to.equals("#easy")
    })
    it('P0: critical', () => {
      expect(that.labelToTag("P0: critical")).to.equals("#critical")
    })
  })
  
  describe('tagToLabel', () => {
    it('bug', () => {
      expect(that.tagToLabel("#bug")).to.equals("type: bug")
    })
    it('comp: lively sync', () => {
      expect(that.tagToLabel("#LivelySync")).to.equals("comp: lively sync")
    })
    it('effort1: easy (hour)', () => {
      expect(that.tagToLabel("#easy")).to.equals("effort1: easy (hour)")
    })
    it('P0: critical', () => {
      expect(that.tagToLabel("#critical")).to.equals("P0: critical")
    })

    it('Priority', () => {
      expect(that.tagToLabel("#urgent")).to.equals("P1: urgent")
      expect(that.tagToLabel("#required")).to.equals("P2: required")
      expect(that.tagToLabel("#important")).to.equals("P3: important")
      expect(that.tagToLabel("#NiceToHave")).to.equals("P4: nice to have")
    })
  })

  describe('stringifyMarkdownStories', () => {
    it('prints a project', () => {
      var result = that.stringifyMarkdownStories([{project: "A Project"}])
      expect(result).to.equals("## A Project")
    });
    it('prints a story', () => {
      var result = that.stringifyMarkdownStories([{title: "a story"}])
      expect(result).to.equals("- a story")
    });
    it('prints a story with number', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", number: 123}])
      expect(result).to.equals("- a story #123")
    });

    it('prints a story with rest', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", rest: "3P"}])
      expect(result).to.equals("- a story 3P")
    });

    it('prints a story with state', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", state: "open"}])
      expect(result).to.equals("- a story #open")
    });

    it('prints a story with state closed', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", state: "closed"}])
      expect(result).to.equals("- a story #closed")
    });


    it('prints a story with labels', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", state: "closed", labels: ["type: bug"]}])
      expect(result).to.equals("- a story #bug #closed")
    });


    it('prints an item', () => {
      var result = that.stringifyMarkdownStories([{item: "- an item"}])
      expect(result).to.equals("  - an item")
    });

  })
  
  describe('syncMarkdownStories', () => {

    it('create new issue', async (done) => {
      try {
        var stories = [{title: "a new story"}];
        await that.syncMarkdownStories(stories)
        expect(stories[0].number).not.to.be.undefined
      } catch(e) {
        return done(e)
      }
      done()
    });
    
    it("don't create new issue if number is there", async (done) => {
      try {
        var stories = [{title: "a new story", number: 301}];
        await that.syncMarkdownStories(stories)
        expect(stories[0].number).to.equal(301)
      } catch(e) {
        return done(e)
      }
      done()
    });

    it("update labels from github", async (done) => {
      try {
        var stories = [{title: "found a bug", number: 108}];
        await that.syncMarkdownStories(stories)
        expect(stories[0].labels).to.contain("comp: lively sync")
      } catch(e) {
        return done(e)
      }
      done()
    });

    it("dont throw away local labels", async (done) => {
      try {
        var stories = [{title: "found a bug", labels: ["comp: foo bar"], number: 108}];
        await that.syncMarkdownStories(stories)
        expect(stories[0].labels).to.contain("comp: foo bar")
      } catch(e) {
        return done(e)
      }
      done()
    });


    it("don't create new issue if exact title is there", async (done) => {
      try {
        var oldCreate = that.create
        that.create = function() { done(new Error("create should not be called"))}
        var stories = [{title: "found a bug"}];
        await that.syncMarkdownStories(stories)
        expect(stories.length).to.equal(1)
        expect(stories[0].number).to.equal(108)
      } catch(e) {
        that.create
        return done(e)
      } finally {
        that.create = oldCreate
      }
      done()
    });


    it("add issues that were in github, but not ins stories", async (done) => {
      try {
        var stories = [{title: "a new story", number: 301}];
        await that.syncMarkdownStories(stories)
        expect(stories.length, "size of stories").to.equal(2)
        expect(stories[1].number).to.equal(108)
      } catch(e) {
        return done(e)
      }
      done()
    });

    
  })
  
  
  
  
});