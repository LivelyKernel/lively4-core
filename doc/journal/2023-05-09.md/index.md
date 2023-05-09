## 2023-05-09 #Issue #Preferences #Caching
*Author: @JensLincke*


Known Issues:

- babel plugin development and transpilation caches conflict
  - Idea: tool support with cache invalidation needed here
- Preferences are stored in the world, but are needed before loading it....
  - Idea: use local storage an load them directly
  - Idea: give workers a copy of the preferences if they need them