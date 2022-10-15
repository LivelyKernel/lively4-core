
```JavaScript
lively.loadJavaScriptThroughDOM('ts', 'https://cdnjs.cloudflare.com/ajax/libs/typescript/4.8.4/typescript.js');
```

# update all lib definition files:
<

script>
const folder = 'https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/';
(async function load() {
const fileNames = ['lib.d.ts',
'lib.dom.d.ts',
'lib.dom.iterable.d.ts',
'lib.es2015.collection.d.ts',
'lib.es2015.core.d.ts',
'lib.es2015.d.ts',
'lib.es2015.generator.d.ts',
'lib.es2015.iterable.d.ts',
'lib.es2015.promise.d.ts',
'lib.es2015.proxy.d.ts',
'lib.es2015.reflect.d.ts',
'lib.es2015.symbol.d.ts',
'lib.es2015.symbol.wellknown.d.ts',
'lib.es2016.array.include.d.ts',
'lib.es2016.d.ts',
'lib.es2016.full.d.ts',
'lib.es2017.d.ts',
'lib.es2017.full.d.ts',
'lib.es2017.intl.d.ts',
'lib.es2017.object.d.ts',
'lib.es2017.sharedmemory.d.ts',
'lib.es2017.string.d.ts',
'lib.es2017.typedarrays.d.ts',
'lib.es2018.asyncgenerator.d.ts',
'lib.es2018.asynciterable.d.ts',
'lib.es2018.d.ts',
'lib.es2018.full.d.ts',
'lib.es2018.intl.d.ts',
'lib.es2018.promise.d.ts',
'lib.es2018.regexp.d.ts',
'lib.es2019.array.d.ts',
'lib.es2019.d.ts',
'lib.es2019.full.d.ts',
'lib.es2019.object.d.ts',
'lib.es2019.string.d.ts',
'lib.es2019.symbol.d.ts',
'lib.es2020.bigint.d.ts',
'lib.es2020.d.ts',
'lib.es2020.date.d.ts',
'lib.es2020.full.d.ts',
'lib.es2020.intl.d.ts',
'lib.es2020.number.d.ts',
'lib.es2020.promise.d.ts',
'lib.es2020.sharedmemory.d.ts',
'lib.es2020.string.d.ts',
'lib.es2020.symbol.wellknown.d.ts',
'lib.es2021.d.ts',
'lib.es2021.full.d.ts',
'lib.es2021.intl.d.ts',
'lib.es2021.promise.d.ts',
'lib.es2021.string.d.ts',
'lib.es2021.weakref.d.ts',
'lib.es2022.array.d.ts',
'lib.es2022.d.ts',
'lib.es2022.error.d.ts',
'lib.es2022.full.d.ts',
'lib.es2022.intl.d.ts',
'lib.es2022.object.d.ts',
'lib.es2022.sharedmemory.d.ts',
'lib.es2022.string.d.ts',
'lib.es5.d.ts',
'lib.es6.d.ts',
'lib.esnext.d.ts',
'lib.esnext.full.d.ts',
'lib.esnext.intl.d.ts',
'lib.esnext.promise.d.ts',
'lib.esnext.string.d.ts',
'lib.esnext.weakref.d.ts',
'lib.scripthost.d.ts',
'lib.webworker.d.ts',
'lib.webworker.importscripts.d.ts',
'lib.webworker.iterable.d.ts',
'protocol.d.ts',
'tsserverlibrary.d.ts',
'typescript.d.ts',
'typescriptServices.d.ts']

  for (let fileName of fileNames) {
    const text = await (folder + fileName).fetchText()
    const targetFolder = 'https://lively-kernel.org/lively4/aexpr/src/external/typescript/lib/'
    await lively.files.saveFile(targetFolder + fileName, text)
  }
})()
</script>

