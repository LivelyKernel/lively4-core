## 2023-07-05 #Big SystemJS Upgrade First Working State
*Author: @JensLincke*


Yeah, I can boot with the new #SystemJS module system and edit this file!

There are lots of dangling #TODOs, but we can work on them! And more importantly, we we can work on them from within the system again! 

## Next Steps 

- [x] activating eslint again in <edit://src/components/widgets/lively-code-mirror.js>

- [x] enable checkDeepevalFlag <edit://src/client/lively.js>

- [x] make systemjs work in workers...

- [x] cleanup a bit

- [x] make source maps work again
  
  - 'inline' works, should be make them extern again? What are the pros and cons again? #TODO

- [x] check for @onsets's private use cases
  
  - [x] pthree should work

- [ ] make all tests green again
  
  - [x] findDependentModules
  - [x] findDependentModules recursive
  - [ ] Connections

- [ ] make a commit... (or maybe we should make a branch here to test it further?)

- [ ] optional: don't throw and catch errors when resolving

- [ ] make all tests green again
  
  - [x] findDependentModules
  - [ ] findDependentModules recursive
  - [ ] Connections

- [ ] make a commit... (or maybe we should make a branch here to test it further?)

- [ ] optional: don't throw and catch errors when resolving
