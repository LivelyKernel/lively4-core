'use strict';

var indentationCount = 4;

export function serializeToHTML(startNode, depth=0) {
    var htmlString = "";
    if (startNode instanceof jQuery) {
        jQuery.each(startNode, function(k, v) {
            htmlString += serializeToHTML(v);
        });
        return htmlString;
    }

    var indent = ((d) => {
        let indent = "";
        for (var i = d; i > 0; i--) {
            indent += " ";
        }
        return indent;
    })(depth * indentationCount);

    var attrString = "";
    if (startNode.nodeType == startNode.TEXT_NODE
        || startNode.nodeType == startNode.COMMENT_NODE) {
        htmlString += indent + startNode.textContent.replace(/\n/g, "\n" + indent);
        htmlString += "\n";
    } else if (startNode.nodeType == startNode.ELEMENT_NODE) {    
        var size = startNode.attributes.length;
        for (var i = 0; i < size; i++) {
            let attr = startNode.attributes.item(i);
            attrString += " " + attr.name + "=\"" + attr.value + "\""; 
        }        

        htmlString += indent + "<" + startNode.tagName.toLowerCase() + attrString + ">";
        htmlString += "\n";
        jQuery.each(startNode.childNodes, (i, child) => {
            htmlString += serializeToHTML(child, depth+1);
        });
        /*$(startNode).children().each((i, child) => {
            serializeToHTML(child, depth+1);
        });*/
        htmlString += indent + "</" + startNode.tagName.toLowerCase() + ">";
        htmlString += "\n";
    }
    else {
        console.warn("[serializer] ignored unknown nodeType = " + startNode.nodeType);
    }

    return htmlString;
}