# Project 5 -- COP: ContextJS 2.0
Jakob Reschke,  Marianne Thieffry

## Background: ContextJS 
- Context-oriented Programming for JavaScript 
- Developed and used as part of Lively Kernel

## Idea:
- From context-dependent method invocations to objects are in a context

## Goal: 
- Make context activation explicit 
  - To allow arbitrary partial behavior like triggers, connections, constraint, events
  - Various activation mechanisms 
– Optimize for performance

## Realization
# Step 1: Standalone library
Extract ContextJS from Lively/Babelsberg/... to a standalone library.

Starting point: Lively3 COP tests are green (except tests for inlining which is currently out of scope and not in production). Extracted core/cop subtree into the [new repository](https://github.com/LivelyKernel/ContextJS).

https://github.com/LivelyKernel/ContextJS