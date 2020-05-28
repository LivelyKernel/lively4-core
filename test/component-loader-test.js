import {expect} from 'src/external/chai.js';
import ComponentLoader from "src/client/morphic/component-loader.js"

describe('Component loader', () => {
  
    describe('applyTemplateElement', () => {
      it('fills shadow root ', () => {        
        var element = <div>World</div>
        var template = <template><div id="foo">Hello</div><slot></slot></template>
        ComponentLoader.applyTemplateElement(element,template)

        expect(element.shadowRoot).to.not.be.undefined        
        expect(element.shadowRoot.querySelector("#foo").localName).to.equal("div")
      })

      it('fills style ', async () => {        
        var element = <div>World</div>
        var path = "/test/component-loader-test.css"
        var url = lively4url + path
        var template = <template><style data-src={path}></style><slot></slot></template>
        await lively.fillTemplateStyles(template) 
        
        expect(template.querySelector("style").getAttribute("data-url"), "template style url is there").to.equal(url)
        
        ComponentLoader.applyTemplateElement(element, template)
        expect(element.shadowRoot.querySelector("style").innerHTML).to.match(/\#foo/)
        
        expect(element.shadowRoot.querySelector("style").getAttribute("data-url"), "style url is copied").to.equal(url)
      })

      
    })
});