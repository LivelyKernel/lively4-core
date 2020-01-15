# Polymorphic Identifiers

[code](edit://src/client/poid.js) | [protocolls](src/client/protocols/)

In Lively4 we can use custom URL protocols for easier referencing and navigation and for abstracting cloud storage and services into a unified protocol for reading, writing and navigating of resources. We don't have to support each service in each tool we build, but just making them work with web requests. 

## Implementation

We adapt the `fetch` behavior and hook into other web-requests via the service worker. Custom protocols are then dispatched to `schemas` which can then implement `GET`, `PUT`, and `OPTIONS` etc. 


## Schemas and their uses
<script>
import poid from 'src/client/poid.js'
(<ul>{...Object.keys(poid.schemas).map(ea => {
  var ref = "search://" + ea + ":"
  return <li>
    <a 
      href={ref}
      click={function(evt) {evt.preventDefault(); lively.openBrowser(ref)}}
    >{ea}</a>
  </li>
})}</ul>)
</script>


## Inspiration

- [Weiher and Hirschfeld 2013. Polymorphic Identifiers: Uniform Resource Access in Objective-Smalltalk](http://www.hirschfeld.org/writings/media/WeiherHirschfeld_2013_PolymorphicIdentifiersUniformResourceAccessInObjectiveSmalltalk_AcmDL.pdf)