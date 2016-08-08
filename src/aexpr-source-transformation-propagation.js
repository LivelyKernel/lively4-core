export function aexpr(...args) {
    console.log('aexpr', ...args);
    return { onChange(cb) { console.log('onChange', cb); } }
}
export function getMember(obj, prop) {
    console.log('getMember', obj, prop);
    return obj[prop];
}
export function setMember(obj, prop, operator, val) {
    console.log('setMember', obj, prop, operator, val);
    return obj[prop] = val;
}
export function getAndCallMember(obj, prop, args) {
    console.log('getAndCallMember', obj, prop, ...args);
    return obj[prop](...args);
}

export default aexpr;
