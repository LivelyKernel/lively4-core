// import aexprTicking, {
//   check as checkTicking,
//   clearDefaultActiveExpressions,
//   TickingActiveExpression
// } from "aexpr-ticking";

// const UI_AEXPRS = new Set();

// `this` is an ActiveExpression 
export function toDOMNode(builder = x=>x, timeout = 0) {
  let initialNode = builder(this.getCurrentValue());

  this.onChange(val => {
    lively.notify("change aexpr result", val)
    const newNode = builder(val);
    initialNode.replaceWith(newNode);
    initialNode = newNode;
  });

  const checkMe = () => {
    this.checkAndNotify();
    // TODO: use something better to check, when this node is attached or removed from DOM!
    if(document.body.contains(initialNode)) {
      requestAnimationFrame(checkMe);
    }
  };
  requestAnimationFrame(checkMe);

  //UI_AEXPRS.add(this);
  
  return initialNode;
  //check(UI_AEXPRS)
}

export function __unload__() {
  lively.notify("unload module", null, undefined, null, "red");
}