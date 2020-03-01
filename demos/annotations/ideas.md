
# Idea: Remember a reference to the target text per Annotation

And we could further allow to store annotations with different targets in one file. So instead
of storing just annotations line by line:

```javascript
{"from": 0, "to": 4, "name": "b"}
{"from": 10, "to": 15, "name": "i"}
```


```javascript
{"type": "Text", "id": "t5", "github": "adsf234" }
{"type": "Annotation", "target": "t5", "from": 0, "to": 4, "name": "b"}
{"type": "Annotation", "target": "t5", "from": 10, "to": 15, "name": "i"}
```

The annotations do not have to completely reference the text themselves but we can go through an indirection. By adding "Text" into the annotations list, that provide the targets for the annotations. Those text can than have to own means of coming up with an actual text. Maybe reference a github commit or contain a copy of the full text themselves? We need enough data to update old annotations for new versions of a Text. 

```javascript
{"type": "Text", "id": "t5", "github": "adsf234"}
{"type": "Annotation", "target": "t5", "from": 0, "to": 4, "name": "b"}
{"type": "Text", "id": "t6", "content": "Hello New World!" }
{"type": "Annotation", "target": "t6", "from": 12, "to": 17, "name": "i"}
```











