## 2018-10-25

Ok, journal works again... after fixing a bug in `lively.files.exists`!


## Tasks

- [X] don't render  index.md files  while in editing mode
- [X] allow relative paths... in workspaces!
- [ ] fix module paths in lively4-seminars
- [ ] booting lively and specially code mirror takes to long
- [ ] better error message for "module not found", ... undefined match is bad!

## script tags as modules

We support absolute path requirements in script tags, but this makes it hard to deploy code in external repositories such as `lively4-seminars`. 

Idea: hand in a working path for script tags, e.g. `foo/bar.md` for all `script` tags inside that Markdown file!

<script>

import foo from "./mymodule.js"

// import foo from "./demos/foo.js"

foo(3)

</script>

And again:

<script>

foo(3)

</script>
