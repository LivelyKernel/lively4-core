# Service Worker

Since, our ServiceWorker should be capable of performing various tasks, that may depended on each other depending on the request it becomes interesting how we plumb the pipeline together.

![Service Worker Transformation Pipeline Architecture Draft](https://cloud.githubusercontent.com/assets/1466247/10488907/32158f8e-729b-11e5-8932-6516b364bb55.jpg)

## Problem / Motivation

We want use web request as means to ask for virtual resources that may involve some client side computation.

There are many use case of Web requests where our Service Worker might me more or less heavily involved:

a) The client (browser side) makes a GET request to a normal url, for example a markdown file "hello.md". And besides the URL a mime-type is additionally specified, e.g. "text/markdown". Without the Service Worker the Web server would answer that request appropriately, either by serving that file or returning an error if needed.

b) What happens if the client asks for that file a second time? Have we cached it? Should we use the version in the cache?

c) What happens if the client asks for "hello.md" but with a different mime-type "text/html"? Intelligent Web-servers may be clever enough to convert the markdown source of "hello.md" to HTML source and serve the new content instead. And since we have full control over these things in the Service Worker, too, we can make such a conversion there ourselves. 

d) In our Lively4 context this can go even further. We want to support our developers in writing their code in various languages, dialects, language extensions, code transformations etc. When we have full control over the server we could handle all this transformations there. But since we try to avoid having and using a dedicated server for such purposes, we plan to to this all on the client side using our service worker. The problem is how can we combine all these little transformation steps and in a very simple manner without explicitly configuring every this for each file type or url pattern. 

# Approach

We came up with two ideas: one simple and doable and one very sexy but complex....

## Idea 1: An ordered list of transformation steps

When there is one ordered global list of transformations, we can ask every one to transform the input into some output and hand over to the next one in the pipeline. This simple approach can be very limiting but may be good enough for our purposes.

### Example

Pipeline:
- Eval
- Check Cache
- Get
- Update Cache
- Markdown -> HTML converter
- Babelsberg Constraint compiler
- Babel ES6 -> ES5 compiler
- ...
- JS -> Debuggable JS Transform (Robert and Markos "LivelyContext")
- Error Handler

When an element in the pipeline does not know what to do with the input, e.g. the Markdown converter can not do anything with JavaScript files, the transform step just ignores it.

# Idea 2: Search for a combination of transformation steps that produces for a given input an output

We thought that it might be very nice to present the service worker with a set of transformation steps and it would figure out how to plumb them together itself. The way this could be done would be the following: Every transformation step can do two things it can first answer what kind of output it could produce given some kind of input. The a graph search with backtracking could find a pipeline configuration that would produce the needed output. If nothing could be found an error would be returned. A transformation step would be able to use the URL and options like the mime-type of the content it accepts as input, and would return a result (and maybe additional resources it would need in doing so?). 

We don't know how complex such a thing can get, so we think a good enough version might be idea 1 for now.

# Related Work

Since we are automating compilation and transformation steps this is all very much related to the various tools and approaches in that area. The idea that we to transform "resources" automatically and specify the rules to do so in a declarative fashion is inspired by makefiles. If one would have to solve the same problem in a Unix, one could write a Makefile, e.g. to create an HTML file for every Markdown file as needed. 


