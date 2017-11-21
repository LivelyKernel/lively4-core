# Demos

Lively4--as a self-supportive development environment--is first and foremost its own showcase. We use the tools in Lively mainly to develop and evolve itself. 

## Components

<style>
lively-script {
  display: inline-block
}
</style>

<script>
var b = document.createElement("button")
b.innerHTML = "PDF Viewer"
b.onclick = () => {
  lively.openComponentInWindow("lively-pdf")
} 
b
</script>
<script>
var b = document.createElement("button")
b.innerHTML = "Lively4 Services"
b.onclick = () => {
  lively.openComponentInWindow("lively-services")
} 
b
</script>
