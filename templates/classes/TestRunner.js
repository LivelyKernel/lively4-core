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
      link.href=lively4url + "/node_modules/mocha/mocha.css"
      document.head.appendChild(link)
    }
  }

  async findTestFilesInDir(dir) {
    var dir = lively4url + dir;
    var json = await lively.files.statFile(dir).then(JSON.parse)
    return json.contents.map(ea => ea.name )
      .filter(ea => ea.match(/-test\.js$/))
      .map(ea => dir + ea)
  }
  
  // [1,2,3].reduce((s,ea) => s + ea, 0 )
  async findTestFiles() {
    var files = []
    var list = ["/test/", "/test/templates/"]
    for(var i in list) {
      files = files.concat(await this.findTestFilesInDir(list[i]))
    };
    return files
    // #WhyNotThis #ContinueHere
    // return ["/test/", "/test/templates/"].reduce(async (sum, ea) => {
    //     return sum.concat(await this.findTestFilesInDir(ea))
    // }, [])
  }
// await that.findTestFilesInDir( "/test/templates/")
  
    // debugger
  // it('sds',()=>{})
  // window.it
  
  async onRunButton() {
    mocha.suite.suites.length = 0; // hihi #Holzhammer
    this.querySelector("#mocha").innerHTML= "";
    (await this.findTestFiles()).forEach(async (url) => {
      var name = url.replace(/.*\//,"").replace(/\..*/,"");
      await lively.import(name, url, true).then( module => {
        mocha.run();
      });
    }); 
  }
}
