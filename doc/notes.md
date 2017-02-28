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







