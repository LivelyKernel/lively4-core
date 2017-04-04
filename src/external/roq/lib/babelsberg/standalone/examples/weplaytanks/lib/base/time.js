define(function time() {
    var Time = Object.subclass("Time", {
        initialize: function() {
            this.lastFrame = window.performance.now();

            // TODO: minimal framerate constraint
        },
        // returns time since last call
        update: function() {
            var time = window.performance.now(),
                dt = (time - this.lastFrame) / 1000;
            this.lastFrame = time;
            return dt;
        }
    });

    return Time;
});
