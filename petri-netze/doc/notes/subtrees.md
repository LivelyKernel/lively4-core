# Subtrees

```
# #TODO refactor this into lively4-server
git subtree add -P src/external/lively4-search https://github.com/LivelyKernel/lively4-search.git master
```

All subtrees currently in use:

- Active Expressions
  - src/external/aexpr/?
  - https://github.com/active-expressions/??.git
  - master
- AExpr source transformation propagation
  - src/external/aexpr/?
  - https://github.com/active-expressions/??.git
  - master
- Active Expressions
  - src/external/aexpr/?
  - https://github.com/active-expressions/??.git
  - master
- Active Expressions
  - src/external/aexpr/?
  - https://github.com/active-expressions/??.git
  - master
- Active Expressions
  - src/external/aexpr/?
  - https://github.com/active-expressions/??.git
  - master
- Reactive Object Queries
  - reactive-object-queries
  - src/external/roq
  - https://github.com/active-expressions/reactive-object-queries.git
  - master
- Triggers
  - aexpr-trigger
  - src/external/aexpr/trigger
  - https://github.com/active-expressions/aexpr-trigger.git
  - master
- Ticking Strategy
  - aexpr-ticking
  - src/external/aexpr/aexpr-ticking
  - https://github.com/active-expressions/aexpr-ticking.git
  - master

## Update Subtrees

```bash
# #TODO make subtrees part of package conf...? And move scripts into tools such as lively-sync and the lively4-server...
git subtree pull -P src/external/lively.graphics https://github.com/LivelyKernel/lively.graphics.git master
git subtree pull -P src/external/lively.lang https://github.com/LivelyKernel/lively.lang.git master
git subtree pull -P src/external/active-expressions https://github.com/LivelyKernel/active-expressions.git master
git subtree pull -P src/external/lively4-serviceworker https://github.com/LivelyKernel/lively4-serviceworker master
git subtree pull -P src/external/plugin-babel https://github.com/systemjs/plugin-babel.git master
```

## Push Subtrees

```bash
# git subtree push -P src/external/lively.graphics https://github.com/LivelyKernel/lively.graphics.git master
# git subtree push -P src/external/lively.lang https://github.com/LivelyKernel/lively.lang.git master
git subtree push -P src/external/active-expressions https://github.com/LivelyKernel/active-expressions.git master
```

