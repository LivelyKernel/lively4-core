if(typeof window !== 'undefined') {
    console.log("WINDOW WINDOW WINDOW WINDOW WINDOW WINDOW WINDOW WINDOW WINDOW WINDOW ");
    window.__interpretation_test_global__ = 42;
} else if(typeof self !== 'undefined') {
    console.log("WEBWORKER WEBWORKER WEBWORKER WEBWORKER WEBWORKER WEBWORKER WEBWORKER ");
    self.__interpretation_test_global__ = 42;
} else if(typeof global !== 'undefined') {
    console.log("GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL ");
    global.__interpretation_test_global__ = 42;
} else {
    throw new Error('unknown js environment. Neither window, self nor global is available!')
}

// export default function getInterpretationTestGlobal() {
//     return 2 + __interpretation_test_global__;
// }
