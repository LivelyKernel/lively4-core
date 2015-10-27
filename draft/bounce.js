
var title = $('h1');


function bounce() {
    var t = window.performance.now()
    var y = 100 + 50 * -Math.abs(Math.sin(t/1000))
    title.css({top: y})
    requestAnimationFrame(bounce)
}


bounce();
