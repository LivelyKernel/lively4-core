'use strict';

var indentationCount = 4;
var ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = 2;
var TEXT_NODE = 3;
var CDATA_SECTION_NODE = 4;
var ENTITY_REFERENCE_NODE = 5;
var ENTITY_NODE = 6;
var PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE = 8;
var DOCUMENT_NODE = 9;
var DOCUMENT_TYPE_NODE = 10;
var DOCUMENT_FRAGMENT_NODE = 11;
var NOTATION_NODE = 12;

export function serializeToHTML(startNode, depth=0, lineBreak=false) {
    var htmlString = "";
    if (startNode instanceof jQuery) {
        jQuery.each(startNode, function(k, v) {
            htmlString += serializeToHTML(v);
        });
        return htmlString;
    }
    console.log(startNode.nodeType);
    switch(startNode.nodeType) {
        case TEXT_NODE:
            htmlString += processTextNode(startNode, depth);
            break;
        case COMMENT_NODE:
            htmlString += processCommentNode(startNode, depth);
            break;
        case ELEMENT_NODE:
            htmlString += processElementNode(startNode, depth, lineBreak);
            break;
        default: console.warn("[serializer] ignored unknown node type: " + startNode.nodeType);
    }

    return htmlString;
}

function calcIndentation(depth) {
    var indentString = "";
    for (var i = depth * indentationCount; i > 0; i--) {
        indentString += " ";
    }
    return indentString;
}

function processTextNode(node, depth) {
    var htmlString = "";

    if (node.textContent == '\n') {
        htmlString += '\n';
    } else {
        let indent = calcIndentation(depth);
        htmlString += node.textContent.replace(/\n/g, "\n" + indent);
        // if (htmlString[htmlString.length-1] != "\n") {
        //     htmlString += "\n";
        // }
    }
    return htmlString;
}

function processCommentNode(node, depth) {
    var htmlString = "";
    let indent = calcIndentation(depth);

    htmlString += "<!-- ";
    htmlString += node.textContent.replace(/\n/g, "\n" + indent);
    htmlString += " -->";
    return htmlString;
}

function processElementNode(node, depth, lineBreak) {
    var htmlString = "";
    var attrString = "";
    var size = node.attributes.length;
    var indent = calcIndentation(depth);

    for (var i = 0; i < size; i++) {
        let attr = node.attributes.item(i);
        attrString += " " + attr.name + "=\"" + attr.value + "\""; 
    }        

    if (lineBreak) {
        htmlString += "\n";
    }
    htmlString += indent + "<" + node.tagName.toLowerCase() + attrString + ">";

    jQuery.each(node.childNodes, (i, child) => {
        htmlString += serializeToHTML(child, depth+1, htmlString[htmlString.length-1] != '\n');
    });

    if (node.childNodes.length > 0) {
        htmlString += "\n";
        htmlString += indent;
    }
    htmlString += "</" + node.tagName.toLowerCase() + ">";
    return htmlString;
}