# OpenAlex


```javascript

fetch("https://api.openalex.org/works/mag:1909822857").then(r => r.text())

https://openalex.org/works/W2741809807

https://openalex.org/eokW2741809807





fetch("https://api.openalex.org/works/W2741809807").then(r => r.json())

fetch("https://api.openalex.org/works/mag:2135259631").then(r => r.json())

fetch("https://api.openalex.org/works/mag:2036425115").then(r => r.json())

```

##  Search Authors

- <https://docs.openalex.org/api-entities/authors/search-authors>


```javascript
fetch("https://api.openalex.org/authors?filter=display_name.search:Jens Lincke").then(r => r.json())
fetch("https://api.openalex.org/works?filter=author.id:A2055148755").then(r => r.json())

```