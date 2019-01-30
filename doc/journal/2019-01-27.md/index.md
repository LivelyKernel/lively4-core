## 2019-01-27 lots of #drawio

<lively-drawio src="./testdrawio.xml"></lively-drawio>

the source code in drawio is encoded, but <https://jgraph.github.io/drawio-tools/tools/convert.html> shows how to decode it...

It goes like this

```javascript

var encoded = "1VVNb9swDP01Pg7wV7r12LgfQ9EB63LYsZAtxlYrm4ZM18l+/aRItuPYATogwNAcHOqRlKj3aNqLknL3oFhd/EAO0gt9vvOiWy8M46+Bfhpgb4EovrZArgS3UDACG/EHHOg7tBUcmkkgIUoS9RTMsKogownGlMJuGrZFOT21ZjnMgE3G5Bz9LTgVFv228kf8O4i8cCevfOdIWfaWK2wrd5wXRtvDz7pL1m/l4puCceyOoOjOixKFSNYqdwlIw2zPms27P+MdylZQ0UcSQpvwzmQLfcWHumjfU6FLrI2Ztan+W3eFINjULDNYp8XXWEGl1KtAm6m5O/CntAfmFbki30ER7I4gV+EDYAmk9jrEea8cWa6XYrfsRmHins/iSJQhj7lmyIedR0a04UhZJiieEXSTEaqzLLWltAHR2lxQ6JZ6YinIn9gIEljpkBSJsNQB0jjWQ8ckKE3e7dgz4x43UuQml/CEb2xJigqS4T3wL8N56E9JD4I569EC6ZfgfPMa3WfPj2n565HXLxyeX9bhl08sxIz1BW3OC3F9IkT4n4VYzYQAfcF9itxUXQHwxhzrmTqvJJmZoI3cGFslQE9GB+vTB89MRk0YTQluSOEb9NpUWJlptBVSnkDMKZRpgkEtSFcKzuW5Uabs/LqgfvFUv3DhRQqC1VzA+N8F1Mvx03HwHX2do7u"

import pako from "https://jgraph.github.io/drawio-tools/tools/deflate/pako.min.js"
var data = atob(encoded)

function stringToBytes(str) {
    var arr = new Array(str.length);
    for (var i = 0; i < str.length; i++){
        arr[i] = str.charCodeAt(i);
    }
    return arr;
};

function bytesToString(arr) {
    var str = '';
    for (var i = 0; i < arr.length; i++){
        str += String.fromCharCode(arr[i]);
    }
    return str;
};
var source = decodeURIComponent(bytesToString(pako.inflateRaw(data)))

```

```xml
<mxGraphModel dx="471" dy="349" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="500" background="#ffffff" math="0" shadow="0">
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="2" value="" style="shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;" parent="1" vertex="1">
      <mxGeometry x="60" y="40" width="420" height="260" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="Actor" style="shape=umlActor;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;verticalAlign=top;html=1;outlineConnect=0;" parent="1" vertex="1">
      <mxGeometry x="200" y="110" width="30" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="Sj3FcQJbmRJdp_deQ_B2-4" value="Actor" style="shape=umlActor;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;verticalAlign=top;html=1;outlineConnect=0;" vertex="1" parent="1">
      <mxGeometry x="290" y="120" width="30" height="60" as="geometry"/></mxCell>
    <mxCell id="Sj3FcQJbmRJdp_deQ_B2-5" value="everybody needs a &lt;b&gt;friend&lt;/b&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
      <mxGeometry x="240" y="210" width="115" height="40" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

By reversing this process we should be able to generate or even edit the diagrams.... :-)
