define(["./time"], function loop(Time) {
    var Loop = Object.subclass("Loop", {
        initialize: function(func) {
            this.func = func;
            this.time = new Time();
        },
        start: function() {
            this.update();
        },
        update: function() {
            var dt = this.time.update();
            this.func(dt);

            requestAnimationFrame(this.update.bind(this));
        }
    });

    return Loop;
});
