function funcA() {
    var x;
    function funcB() {
        var y;
        function funcC() {
            if(42) {
                let z;
                function funcD() {
                    y = x;
                    function funcE() {
                        x = z;
                        x = z;
                    }
                }
            }
        }
    }
}
