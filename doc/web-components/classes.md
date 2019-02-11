# #Class and #Superclass in JavaScript


```javascript
class Foo {
  
  m() {
    return 4 
  }
}



class Bar extends Foo {
  
  m() {
    return super.m() + 1 
  }
}


new Bar().m() // 5
```

Changing the superclass at runtime


```javascript
class Foo2 {
  
  m() {
    return 8
  }
}

Bar.__proto__ = Foo2
Bar.prototype.__proto__ = Foo2.prototype

new Bar().m() 
```



