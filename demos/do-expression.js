

function f() {return 3}

let x = do {
    let tmp = f();
    tmp * tmp + 1
  };

lively.notify('x ' + x)

