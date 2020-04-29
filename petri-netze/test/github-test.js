// #Clipboard #Test

import {expect} from 'src/external/chai.js';
import Github from 'src/client/github.js'

var that;

function setupGithub() {
  that = new Github()    
  that._token = "xxx_this_is_not_a_token"
  that.issues = function() {
    if (!this._issues) {
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
        
    }
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
    
    that.patch = function(number, issuePatch) {
      var labels = issuePatch.labels && issuePatch.labels.map(l => ({ id: 0, name: l})) 
      var issue = this._issues.find(ea => ea.number == number)
      // lively.notify("patch issue " + number)
      if (!issue) throw new Error("issue not there (" + number + ")")
      issue.labels = labels
      return Promise.resolve({
        number: lastStoryNumber,
        title: issuePatch.title, 
        body: issuePatch.body,
        labels: labels
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

    it('parses a story with no project', () => {
      var result = that.parseMarkdownStories("## a project\n<!--NoProject-->\n- a story")
      expect(result).length(3)
      expect(result[2].project).to.equals(undefined)
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
      expect(result).to.length(2)
    });

    it('parses a story with items recursively', () => {
      var result = that.parseMarkdownStories("- a story\n - an item", true)
      expect(result[0].items[0].item).to.equals("- an item")
      expect(result, "items are only in story").to.length(1)
    });
    
    it('parses a project with story with items recursively', () => {
      var result = that.parseMarkdownStories("## a project\n- a story\n - an item", true)
      expect(result, "stories are only in project").to.length(1)
      expect(result[0].stories[0].items[0].item).to.equals("- an item")
    });

    it('parses a project with comments and story with items recursively', () => {
      var result = that.parseMarkdownStories("## a project\na comment\n\n- a story\n - an item", true)
      expect(result, "stories are only in project").to.length(1)
      expect(result[0].stories[0].items[0].item).to.equals("- an item")
      expect(result[0].comments[0].comment).to.equals("a comment")
      expect(result[0].comments[1].comment).to.equals("")
    });

    
    it("removes duplicate entries on parsing", () => {
      var result = that.parseMarkdownStories("- a story #easy #LivelyUi #LivelyUi #easy #open #115")
      expect(result[0].title).to.equals("a story")
      expect(result[0].labels).length(2)
      expect(result[0].labels, "label").to.deep.equals(["effort1: easy (hour)", "comp: lively ui"])
      expect(result[0].rest, "rest").to.equals("")
    })
    
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
      expect(that.labelToTag("effort2: medium (day)")).to.equals("#medium")
      expect(that.labelToTag("effort3: hard (week)")).to.equals("#hard")

    })
    it('P0: critical', () => {
      expect(that.labelToTag("P0: critical")).to.equals("#critical")
    })
  })
  
  describe('tagToLabel', () => {
    it('bug', () => {
      expect(that.tagToLabel("#bug")).to.equals("type: bug")
    })
    it('comp', () => {
      expect(that.tagToLabel("#LivelySync")).to.equals("comp: lively sync")
      expect(that.tagToLabel("#LivelyUi")).to.equals("comp: lively ui")
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


    it('prints a story without project in label', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", project: "A Project", labels: ["comp: a project", "type: bug"]}])
      expect(result).to.equals("- a story #bug")
    });

    it('prints a story without project in label BaseSystem Bug', () => {
      var stories = that.parseMarkdownStories("## Base System\n- Load lively from external web pages #feature #BaseSystem #open #41")
      var result = that.stringifyMarkdownStories(stories)
      expect(result).to.equals("## Base System\n- Load lively from external web pages #feature #open #41")
    });

    it('prints a story recursively', () => {
      var result = that.stringifyMarkdownStories([
        {title: "a story", project: "A Project", items: [{item: "- an item"}]}], true)
      expect(result).to.equals("- a story\n  - an item")
    });

    it('prints a project recursively', () => {
      var result = that.stringifyMarkdownStories([
        {project: "A Project", stories: [
            {title: "a story", project: "A Project", items: [{item: "- an item"}]}
          ]
        }], true)
      expect(result).to.equals("## A Project\n- a story\n  - an item")
    });

    it('prints a project with comments recursively', () => {
      var result = that.stringifyMarkdownStories([
        { 
          project: "A Project", 
          stories: [{title: "a story", project: "A Project", items: [{item: "- an item"}]}],
          comments: [{comment: "a comment"}, {comment: ""}]
        }], true)
      expect(result).to.equals("## A Project\na comment\n\n- a story\n  - an item")
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


    it("add issues that were in github, but not in stories", async (done) => {
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

    it("add issues that were in github, but not in stories", async (done) => {
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

    it("updates project as label", async (done) => {
      try {
        var stories = [{project: "a project", labels: [], title: "found a bug", number: 108}];
        expect(that._issues[0].labels.length).to.equal(4)
        await that.syncMarkdownStories(stories)
        expect(that._issues[0].labels.length, "normal sync").to.equal(5)
        
        await that.syncMarkdownStories(stories)
        expect(that._issues[0].labels.length, "wrong issues: " + 
          that._issues[0].labels.map(ea => ea.name)).to.equal(5)
        
        expect(stories[0].labels).to.be.of.length(5)
      } catch(e) {
        return done(e)
      }
      done()
    });



    
  })
  
  
  
  
});