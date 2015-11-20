
$('#inject').click(function()  {
    scriptManager.addScript($('h1'),
function alertText() {
    alert(this.innerText);
});
});

var $currentSelector = null;
var currentElement = null;
var unsavedChanges = false;

$('#object-selector').on('input', function() {
    $currentSelector = $($(this).val());
    currentElement = null;
    updateObjectEditor();
});

$('#object-selector-list').change(function() {
    var idx = $('option:selected', this).index();
    currentElement = $currentSelector[idx];
});

$('#object-inspect').click(function() {
    if (currentElement) {
        var objectEditor = document.createElement('lively-object-editor');
        var win = document.createElement('lively-window');
        objectEditor.target = currentElement;
        win.title = currentElement.tagName;
        $(win).append(objectEditor);
        $('body').append(win);
        win.centerInWindow();
    }
});

function updateObjectEditor() {
    // update selector list
    $('#object-selector-list').html('');
    $currentSelector.each(function(k, v) {
        $('#object-selector-list').append('<option>' + v + '</option>');
    });
}
