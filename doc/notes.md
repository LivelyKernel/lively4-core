# Notes

This is a piece of note taking paper waiting to be scribbled on... 

## Ideas

- What about a section with "cool stuff" to do in Lively4, as Dan whished it for previous versions?
- ...


## Cool Stuff

- Play with bouncing balls
- Look into developers journal and give the world a spin
- Edit and HTML source code and see its rendering update
- Edit the rendered HTML elements directly and see the source code update
- Make a change to the core system, see its effects live, and push those changes to everybody using the sync tool



## Oh, how I learned to hate developing with service workers...

It is not so much a pain in the ass as it used to a year ago. I realized now
how difficult it is do live program a system that is designed not to fail. 
It is first hard to kill it and then it is not clear if the behavior you see
is from the thing you just developed or from a fallback mechanism...

And the biggest pain was to intercept a request and just add an extra header.
It was so difficult because everything was readonly, so I actually had to take 
the request completly appart, then wait for the promise of the body to resolve
and then with that fire up a new request. 


# Welcome to the [Lively4](https://github.com/LivelyKernel/Lively4) wiki!

* [Journal](Journal)
* [SWD16 Lively 4 Seminar at the HPI](SWD16)
* [Lively4 Architecture](Lively4_Architecture)
* [SWD15 Lively 4 Seminar at the HPI](SWD15)
* [WebDev16 Lively 4 Seminar at the HPI](WebDev16)
* [Service Worker](ServiceWorker)
* [ServiceWorker Transform Pipeline Idea](ServiceWorkerTransformPipeline)
* [Lively4 Code Guidelines](Lively-4-Coding-Guidelines)


# Supported Browsers
We consider Lively4 a test bed for new browser technology. As such, we currently only run on latest versions of Chrome. We expect Lively4 immediately to run smoothly on other browsers as soon as they implement [ServiceWorkers](http://caniuse.com/#search=service%20worker) and [other Web technologies](http://caniuse.com/#search=web%20component).

# Some Whiteboards from our first Idea-Generating Session

Theses are some whiteboards developed at the HPI C.E/8. In principle we would be able to do this in a digital way... but the hardware is not there yet and we like to have this real estate and tangibility at the moment. We know it makes collaboration in distributed teams very difficult, but that is way we are writing this up now.

## Lively 4 Idea Map
![150727_ideamap](https://cloud.githubusercontent.com/assets/1466247/8933093/537f1808-3541-11e5-9007-19005621ff25.jpg)
 
Our research and development goals of Lively center around building tools and languages for a development system (green). We tried to gather some requirements and conflicting design design decisions:

- Should it be a personal or a collaborative environment?
- Should it be a Smalltalk-like IDE or more a scripting environment?

We also have two new target platforms: Microsoft's SurfacePro with its pen and its OfflineFirst and the SurfaceHub with local multi-user collaboration. But it could be that local collaboration is not feasible and necessary since usually there is only one person with a pen writing at the same time a whiteboard. 

Bert asked to put iPad as a dedicated target platform on that list, but since [Safari seems to become the new Internet Explorer](http://arstechnica.com/information-technology/2015/06/op-ed-safari-is-the-new-internet-explorer/) we might think twice about it....     

The major design goal of a minimal core system is opposed to the wish of having fully functional and self-sufficient environment.  

One design goal is to completely get rid of the (node.js) server again and rely solely on private and publicly available cloud storage. Serving files directly from a GitHub repository sounds is one such idea. We could leverage a JavaScript library that provides a nice API for this https://github.com/michael/github. We do that not because we don't like having the full control and power of local node.js installation, but we think that we want to be able to run lively on all websites that can be convinced to load some JavaScript library. A little bit like Robert's Lively2Lively demo, but with not just installing a proxy for remote control, but for booting a full fledged Morphic into any DIV tag... and that taking over the entire side from within itself. 

## Lively Core 

What should be the core our our system? What should be the core ideas and features? 

![150727_LivelyCore.jpg](https://cloud.githubusercontent.com/assets/1466247/8932965/9e95fc5e-3540-11e5-8dfa-d938f1280bc5.jpg)

This diagram should make it clear the many core features of Lively Kernel, such as being able to interactively edit (or create something new) and change it afterwards is something we would consider a core feature from the user's perspective but not from an engineering point of view. 

We think that the core of lively should only be the system that allows us to dynamically load (and update) modules written in various languages. Those modules are then transformed into JavaScript and provide some objects and methods as an API to talk to each other. Examples for such languages can be our own experiments such as an extended JavaScript with constraints support, or Smalltalk, or TileScripting. 


## Lively4 HTML Format
![150727_lively4htmlformat](https://cloud.githubusercontent.com/assets/1466247/8933107/61023a1e-3541-11e5-900f-0e49acea7fcb.jpg)

## Lively4 Spike 
![150727_lively4spike](https://cloud.githubusercontent.com/assets/1466247/8933119/71b15cdc-3541-11e5-8462-077088c5f447.jpg)




