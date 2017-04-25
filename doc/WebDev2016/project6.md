# Project 6	-- AExpr: Active Expressions

Timo Djürken, Philipp Pajak


## Background: Using imperative JavaScript to 
- Derive declarative constraint descriptions (OCP)
- Derive groups of objects

## Example: 

```JS
select(Morph, m => m.color === ‘green’)
```

## Goal: 
- Extract active expressions into reusable library 
- Extend library to track DOM changes 
- Example Application: Visual debug information for object groups