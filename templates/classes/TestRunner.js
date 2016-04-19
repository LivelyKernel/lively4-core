'use strict';

export default class TestRunner extends HTMLDivElement {
  initialize() {
    lively.html.registerButtons(this)
    if (!this.querySelector("#mocha")) {
      var mochadiv  = document.createElement("div")
      mochadiv.id = "mocha"
      this.appendChild(mochadiv)
    }
    this.querySelector("#mocha").innerHTML= ""
    
    if(!document.querySelector("#mochaCSS")) {
      var link = document.createElement("link")
      link.id="mochaCSS"
      link.type="text/css"
      link.rel="stylesheet"
      link.href="../node_modules/mocha/mocha.css"
      document.head.appendChild(link)
    }
  }

  findTestFiles() {
    return [lively4url + "/test/templates/lively-sync-test.js"]
  }
  
  // debugger
  // it('sds',()=>{})
  // window.it
  
  
  async onRunButton() {
    mocha.suite.suites.length = 0 // hihi #Holzhammer
    this.querySelector("#mocha").innerHTML= ""
    
    this.findTestFiles().forEach(async (url) => {
      var name = url.replace(/.*\//,"").replace(/\..*/,"")
      await lively.import(name, url, true).then( module => {
        mocha.run()
      })
    }) 
    lively.notify("run tests")
  }
}
