import { expect } from 'src/external/chai.js';

import Preferences from "src/client/preferences.js"

var oldConfigString
var oldConfig 

describe('Preferences', () => {

  before(() => {  
    oldConfigString = localStorage[Preferences.lively4preferencesKey]
    oldConfig = Preferences.config
  })
  
  describe('readPreferences', () => {
    it('load the config from localStorage', () => {
      var value = `"helloR ${Date.now()}"`
      localStorage[Preferences.lively4preferencesKey] = JSON.stringify({testReadPref: value})
      Preferences.readPreferences()
      expect(Preferences.config.testReadPref).to.equal(value)
      
    });
  });
  
  describe('writePreferences', () => {
    it('store the config to localStorage', () => {      
      var value = `"helloW ${Date.now()}"`
      Preferences.config["testWritePref"] = value
      Preferences.writePreferences()
      var obj = JSON.parse(localStorage[Preferences.lively4preferencesKey])
      expect(obj["testWritePref"]).to.exist
    });
  });
  
  
  describe('read', () => {
    it('reads from localStorage', () => {      
      var value = `"helloRead ${Date.now()}"`
      Preferences.config["testRead"] = value
      var result = Preferences.read("testRead")
      expect(result).to.equal(value)
    });
  });
  
  
  describe('write', () => {
    it('writes to localStorage', () => {      
      var value =`"helloWrite ${Date.now()}"`
      Preferences.write("testWrite", value)
      expect(Preferences.config["testWrite"]).to.equal(value)
      var obj = JSON.parse(localStorage[Preferences.lively4preferencesKey])
       expect(obj["testWrite"]).to.exist
    });
  });
  
   
  describe('get', () => {
    it('reads from localStorage', () => {      
      var value = "hello" + Date.now()
      Preferences.config["testGetPref"] = JSON.stringify(value)
      var result = Preferences.get("testGetPref")
      expect(result).to.equal(value)
    });
  });
  
  
   describe('set', () => {
    it('reads from localStorage', () => {      
      var value = "hello" + Date.now()
      var result = Preferences.set("testSetPref", value)
      expect(Preferences.config["testSetPref"]).to.equal(JSON.stringify(value))
      
      expect(localStorage[Preferences.lively4preferencesKey].match(value)).to.exist
    });
  });
  
  
  
  after(() => {  
    localStorage[Preferences.lively4preferencesKey] = oldConfig
    Preferences.config = oldConfig
  })
  

});
