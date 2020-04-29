# Developing

## Basic Lively4 development workflow

- Go to <https://lively-kernel.org/lively4/lively4-core/start.html>
- Browse and edit [markdown](markdown.md) files, JavaScript [modules](modules.md) and HTML templates
- Open [Sync Tool](../tools/sync.md) and login with your [Github](../../src/client/github.js) credentials
- Press sync to update your instance and commit changes

## Repositories

Lively4 can [clone](../tools/sync.md) Git repositories from [GitHub](https://github.com).

## Issues

For Issue management, we use GitHub. We have API support through [github.js](browse://src/client/github.js) with and example use case in our [issues](../issues.md) page. 

## Debugging

- (A) We use the Chrome debugger and console. 
- (B) We experimented with implemented our own debugger by hooking into the Debugger API and using a second page to debug the first page. See [SWD2016/Project 3: Fabio Niephaus, Sebastian Koall. Abstraction-aware Debugging](https://lively-kernel.org/lively4/lively4-seminars/SWD2016/project3.md/index.md). #experimental


## Libraries 

- Problematic: npm --> problematic, because it does not work with github.io
- Problematic: ../some-relative-repository (on lively-kernel.org) --> problematic, ... see above
- **Default: static copies of (potentially minified) libraries**
- Alternative: github repositories subtrees, statically available, but still updateable
  - FEATURE: allows for local adaptation, without giving up, updateabiltiy 
  - #TODO -> provide tool support from inside lively4 to add, update, remove such dependencies
- Do you have a favorite module/library/package/dependency management system that works clientside only?
