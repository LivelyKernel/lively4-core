import Stack from 'stack-es2015-modules';

export function arrayToStack(elements) {
    let s = new Stack();
    elements.forEach(element => s.push(element));
    return s;
}
