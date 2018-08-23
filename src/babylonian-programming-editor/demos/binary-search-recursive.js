function /*example:*//*example:*/binarySearch/*{"id":"2297_b626_dead","name":{"mode":"input","value":"Not Found"},"color":"hsl(90, 30%, 70%)","values":{"key":{"mode":"input","value":"\"g\""},"array":{"mode":"select","value":"752c_f98e_8b28"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"66a7_e4da_af8d","name":{"mode":"input","value":"Found"},"color":"hsl(270, 30%, 70%)","values":{"key":{"mode":"input","value":"\"e\""},"array":{"mode":"select","value":"752c_f98e_8b28"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(key, array) {
  function /*slider:*/search/*{}*/(/*probe:*/low/*{}*/, /*probe:*/high/*{}*/) {
    if(low > high) {
      /*probe:*/return/*{}*/ -1;
    }
    
    var mid = Math.floor((low + high) / 2)
    var /*probe:*/value/*{}*/ = array[mid];
  
    if(value < key)
      /*probe:*/return/*{}*/ search(mid + 1, high);
    else if (value > key)
      /*probe:*/return/*{}*/ search(low, mid - 1);
    else
      /*probe:*/return/*{}*/ mid;
    }
  /*probe:*/return/*{}*/ search(0, array.length - 1);
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"752c_f98e_8b28","name":"\"a\" to \"f\"","code":"return ['a', 'b', 'c', 'd', 'e', 'f'];"}]} */