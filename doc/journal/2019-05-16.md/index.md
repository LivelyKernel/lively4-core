## 2019-05-16

## Lively on #Firefox

- [X] refactor event.path to event.composedPath()



## Flex Layout on #Firefox?

<style>

  #A, #B, #C {
      width: 200px;

  }

  #A {
    height: 200px;
    background-color: gray;
    
    
      display: flex;  
      flex-direction: column;
  }

  #B {
    min-height: 20px;
    background-color: blue;
    
    flex: 1;
  }

  #C {
    height: 20px;
    background-color: red;
    
    flex: 1;
  }
</style>

<div id="A">
  <div id="B">Hello</div>
  <div id="C">World</div>
</div>

This seems to work, so flex is not the issue?

---