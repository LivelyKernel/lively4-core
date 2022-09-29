
var Foo = {
  bar() {
    return 3
  }
}

export function test1() {

    return Foo?.bar()  
}

    
export function test2() {

    return Foo?.foo?.() 
  
}

