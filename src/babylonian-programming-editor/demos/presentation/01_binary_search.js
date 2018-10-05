export function /*example:*//*example:*//*example:*/binarySearch/*{"id":"d391_f7c8_acf2","name":{"mode":"input","value":"Numbers"},"color":"hsl(120, 30%, 70%)","values":{"array":{"mode":"select","value":"5ac8_1e2e_3cf6"},"keyOrCallback":{"mode":"input","value":"3"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"05c0_0e37_92c9","name":{"mode":"input","value":"Numbers not found"},"color":"hsl(320, 30%, 70%)","values":{"array":{"mode":"select","value":"5ac8_1e2e_3cf6"},"keyOrCallback":{"mode":"input","value":"7"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"e0bf_37dd_ad5b","name":{"mode":"input","value":""},"color":"hsl(0, 30%, 70%)","values":{"array":{"mode":"select","value":"65f3_056f_f33b"},"keyOrCallback":{"mode":"select","value":"d1b4_9e76_d490"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(array, keyOrCallback) {
    let low = 0; 
    let high = array.length - 1; 
    
    /*slider:*/while/*{}*/ (/*probe:*/low/*{}*/ <= /*probe:*/high/*{}*/) {
        
        let mid = Math.floor((low + high) / 2);
        let /*probe:*/value/*{}*/ = array[mid];

        let compareResult;
        if(typeof keyOrCallback === 'function') {
          compareResult = keyOrCallback(value);
        } else {
          compareResult = value - keyOrCallback;
        }
      
        if (/*probe:*/compareResult/*{}*/ < 0)
            low = mid + 1; 
        else if (compareResult > 0)
            high = mid - 1;
        else
            /*probe:*/return/*{}*/ mid;
   }
   /*probe:*/return/*{}*/ -1;
}
/* Context: {"context":{"prescript":"import Person from './02_person.js'","postscript":""},"customInstances":[{"id":"5ac8_1e2e_3cf6","name":"Numbers array","code":"return [1, 3, 4, 5, 6, 9];"},{"id":"d1b4_9e76_d490","name":"Person Callback","code":"const tim = new Person(\"Tim\");\nreturn (otherPerson) => otherPerson.compareNameTo(tim);"},{"id":"65f3_056f_f33b","name":"Person Array","code":"return [\n  new Person(\"Caroline\"),\n  new Person(\"David\"),\n  new Person(\"Sarah\"),\n  new Person(\"Tim\"),\n  new Person(\"Tom\")\n];"}]} */