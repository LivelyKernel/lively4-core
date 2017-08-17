# Two Scripts Issue Test Page

There are a lot things to do with scripts inside markdown.... At the moment we convert all scripts
to lively-scripts, so that they are not stripped out by the jQuery html parser we are using at the moment. But this is an implementation detail. The good thing is, the scripts work now and they can contain whitespace. But they all become lively-scripts and print their result. This is I guess not always intended. 

<script>
console.log("I was here")

"script 0"
</script>

<lively-script>

"lively-script 1:" + (3 + 4)

</lively-script>


<lively-script>
var a = 3 + 4

// here there can be whitespace 

"lively-script 2:" + a
</lively-script>


<lively-script><script>
var a = 3 + 4

console.log("I was here, too!")

"lively-script > Script 3:" + a
</script></lively-script>


<script>
<button>hello</button>
</script>
