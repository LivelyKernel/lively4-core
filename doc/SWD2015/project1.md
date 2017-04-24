# Project 1: Thin Morphic on HTML5

In order to simplify the morphic representation and interface our group decided to define that every HTML element should be a morph.

In earlier morphic implementations (see Lively Kernel) one needed to maintain 3 seperate representations of a morph:
- a DOM node that contained the rendered version of the morph
- a JS object that defined the methods and properties of the morph
- a JSON version of the morph that was used to persist the JS object

Thin morphic works with only one representation of a morph, the HTML DOM node as the single point of truth.
Apart from being a lot easier to maintain, this also mean that every website is morphic-ready and morphic-tools work by default.

We then used the WebComponents specification to enable the creation of complex morphs, called Components, as well as the persistence and reuse of those created Components.
This means that other WebComponents can be easily used in Lively4 and that the system will also benefit from the further development of the WebComponent standard.

To interactively change and explore a website one can use the Halo Tool that we implemented in Lively4.

Slides of our final presentation:
[Thin morphic presentation](https://docs.google.com/presentation/d/1MNJw2dMAbtUHAUA1ad6frf2pE-XKQGG9kSSY4kV-hEQ/edit?usp=sharing)

# Components

## Using Components

When Components are used in a webpage, they will be added to the DOM as Custom HTML Elements (e.g. `<lively-window>`).
This keeps the DOM clean and self-descriptive.

### With the ComponentBin

The easiest way to load and use a component is by loading it from the ComponentBin (which is a component by itself). You can have this in your page:

```html
<lively-window>
    <lively-component-bin></lively-component-bin>
</lively-window>
```

When loading the page, this will open a ComponentBin inside a lively-window. But once you close it, it's gone. 
A better way is to have the shortcuts module in your page. This can be achieved by the following:

```javascript
System.import(lively4url + "/src/client/shortcuts.js").then(m => {
    m.registerShortcuts();
});
```

The shortcut for opening a ComponentBin is `Crtl+Shift+Alt+p`. 

Furthermore, the `component-loader` module offers a `openComponentBin()` function (the shortcut just calls it for you).

### By writing code

The `component-loader` module offers an interface for creating and opening components. The following code creates a terminal component and opens it in different ways.

```javascript
var component = componentLoader.createComponent('lively-terminal');

// open in window
componentLoader.openInWindow(component).then((itsWindow) => {
    // the component is completely loaded here,
    // also you can do something with the window, in which the component was opened
    itsWindow.style.left = "100px";
});

// open in body
componentLoader.openInBody(component).then(() => {
    // the component is completely loaded here
});

let container = document.querySelector('#some-container');

// open in arbitrary element,
// if the third parameter is set, it will be added before container's first child,
// else after it's last child
componentLoader.openIn(container, component, true).then(() => {
    // the component is completely loaded here
});

```

When a component is attached to the DOM and completely loaded (which means itself and all it's children are loaded), it fires the `created` event. You can listen for it by doing:

```javascript
component.addEventListener("created", (evt) => { });
```

## Creating new Components

### Interactively from DOM Elements
See the screencast below to learn how to use the Halo and other tools to interactively create complex DOM structures. 

Once you have built something that should become a component, click on the Export-Halo.
This will present you with some prompts to gather information about your Component.
You only have to fill out the name and leave the rest blank for now (the name has to be unique, otherwise the existing Component will be overwritten). 

Afterwards, two editors will open, one containing a json file, the other one containing the HTML Template. 
Basically, it is sufficient to save the html-file. If you also save the json, your component will appear in the ComponentBin.

Before saving, check that the path points to your server location (and not to lively4-NOTHING).
Also, templates that should be loaded automatically when the Component is used, have to be put into the `templates/` folder (and not in any subfolder), since the component-loader just looks into that folder. 

If you are interested in the template structure, check out the presentation that is linked at the beginning of this page.

### By importing 3rd party WebComponents

Since we are using the WebComponents standard, it is easy to import existing WebComponents. 

1. Save the Component's html-file in the `templates/` folder. 
2. Create an appropriate json-file, if you want your Component to appear in the ComponentBin.
3. Go into the Component's code and find an appropriate place to fire a `created` event. This is neccessary to allow appropriate component loading.

If you don't know where to fire the `created` event, probably the end of the `createdCallback` is a good default. 
Just add

```javascript
this.dispatchEvent(new Event("created"));
```

If you don't fire this event, Components that have the 3rd party component as a Sub-Component don't know when it has finished loading and therefore will never fire its own `created` event.

# Halo

The halo tool can be used to interactively change and compose morphs.
It can be invoked using `Ctrl + Click` or `Cmd + Click` and repeated clicking cycles through all elements that are underneath.

![Halo-Tool](http://i.imgur.com/k3VmqHH.png)

The individual tools are mostly self-explanatory.

The unpack tool extracts the content of the shadow root of an element and inserts it as a child of this element.

## Extend Halo

Adding new functionality to the Halo Tool involves the following 4 steps:

1. Add an icon to src/client/media/

2. Add an x-halo.html template in templates/halos/ that references this icon

	```html
	<template id="x-halo">
		<style>
			:host {
				background-image: url(http://livelykernel.github.io/lively4-core/src/client/media/myIcon.svg);
			}
		</style>
		<script>
			...
		</script>
	</template>
	<!-- Registration code -->
	```

3. Load the x-halo.html in the lively-halos.html

	```html
	<link rel="import" href="../templates/halos/x-halo.html" />
	```

4. Add the x-halo tag to the html in lively-halos.html

	```html
	<!-- You can add new rows or extend rows, it's all flexbox layouted. -->
	<div class="row" id="row3">
		<export-halo class="halo"></export-halo>
		<unpack-halo class="halo"></unpack-halo>
		<x-halo class="halo"></x-halo>
		<resize-halo class="halo"></resize-halo>
	</div>
	```

# Running lively in arbitrary web pages using the Lively4 Loader Chrome Extension

We provide a browser extension for Chrome that allows loading specific components from a specific source. The source code for this extension [is available on github](https://github.com/LivelyKernel/lively4-chrome-loader).

To install the extension

1. Get the sources from github by running `git clone https://github.com/LivelyKernel/lively4-chrome-loader.git` from the commandline

2. Load the code as an unpacked extension ([instructions from Chrome](https://developer.chrome.com/extensions/getstarted#unpacked))

A lively icon will appear in the top right corner of your browser. Click it, configure the source you want to load lively from (e.g. http://lively-kernel.org/lively4-core/) and a lively component to load (e.g. lively-halos) and hit "load component". The component will be added to the DOM and its shadow DOM will be created. Components it depends on will automatically be loaded, too.

Detailed documentation on the Chrome extension can be found on the [lively-chrome-loader github page](https://github.com/LivelyKernel/lively4-chrome-loader).

# Todos

- Every time an element is exported, there is a new parent element added to it, which should not be happening in the ideal case (see the slides for more details)
- To encapsulate a Component in a shadow root, all the style rules that affect it need to be collected during the export. This is done kind of naively currently and should be improved. Also what about dynamically attached style classes?

# Screencasts
Feel free to watch our demos of [Thin Morphic](https://youtu.be/yIOPBzkf888) and the [Lively4 Loader](https://youtu.be/Dj4flvrAUg4) Chrome Extension.

# Demo Pages
A small demo setup to try out lively can be found on out [morphic-demo page](https://github.com/LivelyKernel/lively4-core/blob/gh-pages/draft/morphic-demo.html).

# Original Project Description
Background: Lively Kernel implements Morphic as object hierarchy that is rendered (HTML)

Instead, make DOM-nodes the Morphic hierarchy:
* Halo
* Inspection (State)
* Scripts (Behavior)
* Attribute Connections (Events / Behavior)

Goal: Interactive editing of HTML pages