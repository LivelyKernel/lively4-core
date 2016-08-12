// calls to aexpr that are already bounded should not be rewritten
(function() {
    function aexpr() {}
    aexpr();
})();