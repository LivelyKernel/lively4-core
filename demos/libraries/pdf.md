# PDF.js

<script>
import pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.js"

var canvas = <canvas></canvas>
var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
// var url = 'http://localhost:9005/Dropbox/Thesis/Literature/2020-29/LittJacksonMillisQuaye_2020_EndUserSoftwareCustomizationByDirectManipulationOfTabularData.pdf';

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.worker.js';

var pdfDoc

// Asynchronous download of PDF
var loadingTask = pdfjsLib.getDocument(url);
loadingTask.promise.then(function(pdf) {
  console.log('PDF loaded');
  
  // Fetch the first page
  var pageNumber = 1;
  pdf.getPage(pageNumber).then(function(page) {
    console.log('Page loaded');
      pdfDoc = pdf
    var scale = 1.5;
    var viewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
      console.log('Page rendered');
    });
  });
}, function (reason) {
  // PDF loading error
  console.error(reason);
});

// pdfDoc.getOutline()
// pdfDoc.getMetadata()
// pdfDoc.getPage(1).then(p => p.getAnnotations())

canvas



</script>