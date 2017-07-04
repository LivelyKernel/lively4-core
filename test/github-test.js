// #Clipboard #Test

import {expect} from '../node_modules/chai/chai.js';
import Github from 'src/client/github.js'

var that;

describe('Github', () => {
  before("load", function(done){
    that = new Github()    
    that._token = "xxx_this_is_not_a_token"
    that._issues = [{
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
    done()
  });

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
    it('parses a story with rest', () => {
      var result = that.parseMarkdownStories("- a story 3P #Foo bla #123")
      expect(result[0].rest).to.equals("3P #Foo bla")
    });

    it('parses an item', () => {
      var result = that.parseMarkdownStories("  - an item")
      expect(result[0].item).to.equals("- an item")
    });
    it('parses a story with project', () => {
      var result = that.parseMarkdownStories("## a project\n- a story")
      expect(result[1].project).to.equals("a project")
    });
    it('parses a story with items', () => {
      var result = that.parseMarkdownStories("- a story\n - an item")
      expect(result[0].items[0].item).to.equals("- an item")
    });
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

    it('prints an item', () => {
      var result = that.stringifyMarkdownStories([{item: "- an item"}])
      expect(result).to.equals("  - an item")
    });

  })
  
});