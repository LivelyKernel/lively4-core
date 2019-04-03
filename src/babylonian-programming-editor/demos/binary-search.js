function search(key, array) {
    var low = 0; 
    var high = array.length - 1; 
    
    while (low <= high) {
        
        var mid = Math.floor((low + high) / 2);
        var value = array[mid];

        if (value < key)
            low = mid + 1; 
        else if (value > key)
            high = mid - 1;
        else
            return mid;
   }
   return -1;
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"0cbe_3943_b2e3","name":"\"a\" to \"f\"","code":"return ['a', 'b', 'c', 'd', 'e', 'f'];"}]} */