(() => {
  var x = { y: 17 };
  
  aexpr(() => x.y).onChange(console.log);

  x.y = 0
})()
