# Referencing

Keywords: #Wikipedia #Wiki [hashtags](hashtags.md)

Using a markup language at our core, Lively4 can annotate text with links to other resources. Theses can be absolute URLs or relative path. We try to resolve relative path as they are used in achnor, image, or other tags relative to the resource you are currently browsing. We use `lively.html.fixLinks` to achieve the and further replace the default following a link behavior with new behavior that uses the current container and stays on the same Web-page. 


We further allow custom URLs we call #PolymorphicIdentifiers that can be used instead of a normal URL, but can provide an arbitrary service, e.g. reading/writing into other resources (e.g. access to cloud storage and Web-appliaction APIs) and browsing/opening other tools. 

## Examples

- <browse://doc/tools/> 
- <edit://src/components/tools/lively-container.js> 
- <search://#Poid> 
- <wikipedia://en/Tractor>  



