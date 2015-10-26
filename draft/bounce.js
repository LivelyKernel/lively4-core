
$('<button onclick="eval(ace.edit(\'editor\').getValue())">EVAL</button>').appendTo('body')

var title = $('h1').css({ position: 'absolute', left: 1000 })


function bounce() {
    title.css({top: 100})
}

bounce();