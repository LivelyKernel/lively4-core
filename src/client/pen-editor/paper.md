# Pen-based Editor

Ambiguity:

having an expression 'expr' and pressing '+' might end up in three different structures:

A binary Expression
```
expr + hole
```

An Update Operator
```
expr++
```

An Assignment Expression
```
expr += hole
```

---

Strings

- '
- "
- ` -> TemplateString, how should it look?

---

Identifier, Number, String

you might have 2 states here:

1. the out node interaction
2. the inner literal manipulation
