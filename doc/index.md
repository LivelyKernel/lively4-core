# Lively Documentation

![](_navigation.html)

Lively4 is a self-supporting collaborative development environment. It runs in the browser on the client side and uses DOM elements and JavaScript as its building blocks. We use web-components and babels client side JavaScript source code transformation. A [lively4-server](https://lively-kernel.org/lively4/lively4-server) allows users to [clone](tools/sync.md) github projects and work collaboratively on them. It is also possible to load Lively4 through our [chrome extension](https://github.com/LivelyKernel/lively4-chrome-loader) on any third party page.

Lively4 uses standard [JavaScript](workflows/javascript.md), [HTML](workflows/html.js), and [CSS](workflows/css.md) as a base to bootstrap an collaborative Wiki-like development environment using [Markdown](workflows/markdown.md) and [scripts](workflows/scripts.md) and building its [tools](tools/) as [Web-components](workflows/web-copmponents.md). 


![](figures/workflows.drawio)


<script>
// import Files from "src/client/files.js"
// var md = lively.query(this, "lively-markdown");
// Files.generateMarkdownFileListing(md.shadowRoot)
</script>

## Links

- [Index of all files, tags, etc](files/)
- [**Journal**](journal/)
- [Issues](issues.md)
 
## Paper

- Jens Lincke, Stefan Ramson, Patrick Rein, Robert Hirschfeld, Marcel Taeumel, Tim Felgentreff. 2017. Designing a Live Development Experience for Web Components. PX 17.2. [presentation](PX/) [pdf](https://www.hpi.uni-potsdam.de/hirschfeld/publications/media/LinckeReinRamsonHirschfeldTaeumelFelgentreff_2017_DesigningALiveDevelopmentExperienceForWebComponents_AcmDL.pdf) [notes](PX/notes/)