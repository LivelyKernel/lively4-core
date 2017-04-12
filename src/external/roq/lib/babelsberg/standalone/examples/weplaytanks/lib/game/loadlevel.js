define(["./../levels/levels"], function loadLevel(Levels) {
    function loadJSON(path, callback) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', path, true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4) {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                // Parse JSON string into object
                var actual_JSON = JSON.parse(xobj.responseText);
                callback(actual_JSON);
            }
        };
        xobj.send(null);
    };

    var nextIndex = 0,
        loadLevel = function(path, callback) {
            var index = nextIndex++;
            loadJSON("../../../standalone/examples/weplaytanks/assets/levels/" + path, function(json) {
                Levels[index] = json;
                callback(null, json);
             });
        };

    return loadLevel;
});