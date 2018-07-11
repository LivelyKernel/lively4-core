function /*example:*//*example:*/binarySearch/*{"id":"e398_2309_1a4a","name":{"mode":"input","value":"Not Found"},"color":"hsl(90, 30%, 70%)","values":{"key":{"mode":"input","value":"\"g\""},"array":{"mode":"select","value":"0cbe_3943_b2e3"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"ad57_f8da_4f2a","name":{"mode":"input","value":"Found"},"color":"hsl(180, 30%, 70%)","values":{"key":{"mode":"input","value":"\"e\""},"array":{"mode":"select","value":"0cbe_3943_b2e3"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(key, array) {
    var low = 0; 
    var high = array.length - 1; 
    
    /*slider:*/while/*{}*/ (/*probe:*/low/*{}*/ <= high) {
        
        var /*probe:*/mid/*{}*/ = Math.floor((low + high)/2);
        var /*probe:*/value/*{}*/ = array[mid];

        if (value < key)
            /*probe:*/low/*{}*/ = mid + 1; 
        else if (value > key)
            high = mid - 1;
        else
            /*probe:*/return/*{}*/ mid;
   }
   /*probe:*/return/*{}*/ -1;
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"0cbe_3943_b2e3","name":"\"a\" to \"f\"","code":"return ['a', 'b', 'c', 'd', 'e', 'f'];"}]} */