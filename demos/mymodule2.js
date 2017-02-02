
var foo;

function blub(bla) {
  return bla + 42;
}


export function hello(arg) {
  return `This is another Module! ${blub(arg)}`;
}