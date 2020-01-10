# #Presentation

Markdown based simple presentation framework. Use `---` to separate slides and add some config to the head of the document. 

```markdown
<!-- markdown-config presentation=true -->

<style data-src="../../demos/tools-and-workflows/style.css"></style>

<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, {
    pageNumbers: true,
    logo: "https://lively-kernel.org/lively4/lively4-jens/media/lively4_logo_smooth_100.png"
})
</script>
```


## Examples

- [demo](../../demos/presentation/index.md) #Example
- [lively4](../presentation/index.md) #Draft
- [Designing a Live Development Experience for Web Components. PX.17](../PX17/index.md)
- [BP2019RH1 - Introduction](https://lively-kernel.org/lively4/BP2019RH1/demos/tools-and-workflowss/2019-11-06_project_begin.md#)