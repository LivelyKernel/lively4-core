# Elements as Model

## Motivation

- model-view duality as in (JavaScript/...) objects that are rendered as HTML is not very direct.

## Idea

- Elements in documents can be their own model:
  - a line of text can be serve as model and view
  - that is the same for list items, links, images, headers, etc
- This approach has its limitations when it comes to dynamic behavior and abstraction


## Example 1: markdown component

- The domain information/model of a "markdown component" is it's markdown source code, which is is different from it's rendered HTML

## Example 2: lively script

- a script should represent its source code, but its view is its dynamic execution (resulting in html in our case)


## Approach

- Web-components allow to separate model and view in one entity
