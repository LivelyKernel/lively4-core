# Two Scripts Issue Test Page


<script>
console.log("I was here")
"script 0"
</script>

<lively-script>
"lively-script 1:" + (3 + 4)
</lively-script>

<lively-script>
var a = 3 + 4
// here there cannot be whitespace 
"lively-script 2:" + a
</lively-script>


<lively-script><script>
var a = 3 + 4

console.log("I was here, too!")

"lively-script > Script 3:" + a
</script></lively-script>
<script>
var a = 3 + 4

console.log("I was here, too! Again!")

"Script 4:" + a
</script>