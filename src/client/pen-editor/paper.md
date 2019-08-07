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

---

Erkenntnis:

Einige Nodes werden an verschiedenen Stellen für unterschiedliche Sachen verwendet, z.B. `ObjectProperty` wird in `ObjectExpression`s zur declaration verwendet, aber auch zum destructuring von Argumenten oder bei Zuweisungen -> hier passt bespielsweise die Bezeichnung `value` für den Argumentnamen nicht mehr (wobei er für den Propertynamen des übergebenen Objektes steht, ... hm). Nichtsdestotrotz: an mehreren Stellen verwendet, sodass bei der Interaktion nicht nur der Knotentyp beachtet werden muss sondern auch dessen structureller Kontext.

