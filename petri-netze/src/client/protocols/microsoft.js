import RestScheme  from "./rest.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import {parseQuery, getDeepProperty} from 'utils'
  

import OAuth2 from "src/client/oauth2.js"

/*MD

- [Microsoft Graph Overview](https://docs.microsoft.com/en-us/graph/overview)
- [Microsoft Graph Navigation](https://docs.microsoft.com/en-us/onedrive/developer/rest-api/concepts/addressing-driveitems?view=odsp-graph-online)
  - "/me - A top-level Microsoft Graph resource being addressed, in this case the current user.
  - /drive - The default drive for the previous resource, in this case the user's OneDrive.
  - /root - The root folder for the drive.
  - :/Documents/MyFile.xlsx: - The : : around /Documents/MyFile.xlsx represents a switch to the path-based addressing syntax. Everything between the two colons is treated as a path relative to the item before the path (in this case, the root).
  - /content - Represents the default binary stream for the file. You can also address other properties or relationships on the item."
  - maybe we should make use of OData
    - e.g. use a client side [OData Library](https://www.odata.org/blog/OData-JavaScript-library-o.js-explained/)
  - or use the [Microsoft Graph JavaScript Client](https://github.com/microsoftgraph/msgraph-sdk-javascript)
- #TODO support PUT, PATCH, POST, needed for [writing data](https://docs.microsoft.com/en-us/graph/api/range-update?view=graph-rest-1.0&tabs=http)
```
MD*/

export default class MicrosoftScheme extends RestScheme {
  
  get scheme() {
    return "microsoft"
  }
  
  get baseURL() {
    return "https://graph.microsoft.com/v1.0/"
  }  
  auth() {
     return new OAuth2("microsoft")
  }
  
  async getMetaData() {
    if (!window.lively4MicrosoftCachedMetadata) {
      var metadataURL = "https://graph.microsoft.com/v1.0/$metadata" // we could also do it dynamically...
      var source  = await fetch(metadataURL).then(r => r.text())
      var parser = new DOMParser();
      window.lively4MicrosoftCachedMetadata = parser.parseFromString(source, "application/xml");
    }
    return window.lively4MicrosoftCachedMetadata
  }
  
  
  async getMetaDataType(contextPath, contextNode) { 
    let metadata = await this.getMetaData()
    
    if (contextPath == "") return contextNode
    
    if (!contextNode) {
      let m = contextPath.match(/^([a-zA-Z0-9]+)$/) // entySet
      if (m) {
        let [pattern, enityTypeName] = m
        let enityType =  metadata.querySelector(`EntityType[Name="${enityTypeName}"]`)
        return enityType
      }

      m = contextPath.match(/^([a-zA-Z0-9]+)\/(.*)/) // entySet
      if (m) {
        let [pattern, enitySetName, rest] = m
        let entitySet =  metadata.querySelector(`EntitySet[Name="${enitySetName}"]`)
        return this.getMetaDataType(rest, entitySet) 
      }

      m = contextPath.match(/^([a-zA-Z0-9]+)\([^)]*\)\/?(.*)/) // entySet function?
      if (m) {
        let [pattern, enitySetName, rest] = m
        let entitySet =  metadata.querySelector(`EntitySet[Name="${enitySetName}"]`)
        
        let entityTypeFullName = entitySet.getAttribute("EntityType")
        let entityType = metadata.querySelector(`EntityType[Name="${entityTypeFullName.split(".").last}"]`)
        
        return this.getMetaDataType(rest, entityType) 
      }
    } else { 
      
      
      let m = contextPath.match(/^([a-zA-Z0-9]+)\/?(.*)/) // navigation
      if (m) {
        let [pattern, name, rest] = m
        
        var navigationProperty = contextNode.querySelector(`NavigationProperty[Name="${name}"]`)
        if (navigationProperty) {
          var typeName = navigationProperty.getAttribute("Type")
          
          var collectionMatch = typeName.match(/^Collection\((.*)\)$/)
          if (collectionMatch) {
            typeName = collectionMatch[1]
          }
          
          var shortTypeName = typeName.split(".").last
          var entityType = metadata.querySelector(`EntityType[Name="${shortTypeName}"]`)
          return this.getMetaDataType(rest, entityType) 
        } else {
          console.warn("[protocols.microsoft] could not find navigationProperty " + name +" in", contextNode)
          return 
        }
        
      }
      
      m = contextPath.match(/^\$entity$/) // entySet
      if (m) {
        let entityTypeFullName = contextNode.getAttribute("EntityType")
        if (entityTypeFullName) {
          let entityType = metadata.querySelector(`EntityType[Name="${entityTypeFullName.split(".").last}"]`)
          return entityType
        } else {
          // maybe we are alred and entity
          return contextNode
        }
      }
    }
  
    // \$entity
    
    // var functionPattern = /^([a-zA-Z09]+)\([^]*)\)\//
    // if (!m) {
    //   m = contextPath.match(entySetPattern)
    // }
    
    return undefined // could not resolve rest... so we are undefined
  }
  
  
  async OPTIONS(options) {
  
    var result = {
      name: this.path,
      type: "directory",
      contents: []
    }
    
    try {
      var json = await this.apiJSON("GET", this.path + "")
      
    } catch(e) {
      json = {}
      // do nothing
    }


    
    if (json.value) {
      
      result.contents.push(...json.value.map(ea => {
        var child = {
            name: ea.name || ea.displayName || ea.title || ea.createdDateTime || "",
            type: "directory"
        }
        
        if (ea.url && ea.url.match(/^[a-zA-Z0-9/]+$/)) {
          child.href =  "microsoft://" + ea.url                                                                  
        } else if (ea.sectionsUrl) { // #OneNote
          // there is also sectionGroupsUrl
          child.href =  "microsoft://" + ea.sectionsUrl.replace("https://graph.microsoft.com/v1.0/","")                                                       
        } else if (ea.pagesUrl) { // #OneNote pages
          child.href =  "microsoft://" + ea.pagesUrl.replace("https://graph.microsoft.com/v1.0/","")                                                       
        } else if (ea.self && ea.self.startsWith("https://graph.microsoft.com/v1.0")) { 
          
          child.href =  "microsoft://" + ea.self.replace("https://graph.microsoft.com/v1.0/","") 
          child.type = "file"
          if (ea.self.match(/\/onenote\/pages\//)) {
            child.href += "/content?includeIDs=true"
          }
          
        } 
        return child
      }))
      
    }
    
    
    if (json.parentReference) {
      result.parent =  "microsoft://me/drive/items/" + json.parentReference.id + "/"
    }
    
    var addContentsFromType = async (contextPath) => {
      var entityType = await this.getMetaDataType(contextPath)  
      if (entityType) {
        var navigationProperties = entityType.querySelectorAll("NavigationProperty")  
         result.contents.push(...navigationProperties.map(ea => ({
          name: ea.getAttribute("Name"),
          type: "link",
          // href:  "microsoft://" + ea.getAttribute("Name")                                                                 
        })))        
        
        var metadata = await this.getMetaData()
        var functionsBindings = metadata.querySelectorAll(`Parameter[Name="bindparameter"][Type="microsoft.graph.${entityType.getAttribute("Name")}"]`)

        if (functionsBindings) {
          result.contents.push(...functionsBindings.map(ea => {
            var functionDef = ea.parentElement
            var parameters = functionDef.querySelectorAll(`Parameter:not([Name="bindparameter"])`)
            
            var child = {
              name: `${functionDef.getAttribute("Name")}(${parameters.map(para => para.getAttribute("Name")).join(", ")})`,
              type: "link",
              // href:  "microsoft://" + ea.getAttribute("Name")                                                                 
            };
            return child
          }))        
        }
      }
    }
    
    
    
    if (json['@odata.context']) {
      var contextPath = new URL(json["@odata.context"]).hash.replace(/^#/,"")
      await addContentsFromType(contextPath)
      
    } else {
      await addContentsFromType(this.path) // maybe the path itselve is already a type?
    }
    
    
    
    if (result.contents.find(ea => ea.name == "children")) {
      var children = await this.apiJSON("GET", this.path + "/children")
      if (children && children.value) {
        
        result.contents.push(...children.value.map(ea => {
            var child = ({
              name: ea.name,
              type: "link",
              //href: "microsoft://me/drive/items/" + ea.id 
            })
            
            child.href = "microsoft://" + this.path.replace(/[\/:]*$/,"") + (this.path.match(/\:/)  ?  "/" : ":/") + ea.name + ":"

            if (ea.folder) {
              child.type = "directory"
            } else if (ea.file) {
              child.type = "file"
              if (ea.file.mimeType.match("text/") || ea.file.mimeType.match("image/")) {
                // guess... I want to see the content
                child.href += "/content"
              }
            }
            return child
          }))
      }      
    }
    
    
    return new Response(JSON.stringify(result, undefined, 2))
  }

}



PolymorphicIdentifier.register(MicrosoftScheme)