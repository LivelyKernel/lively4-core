# OpenCV.js Test

<script>
import cv from 'https://lively-kernel.org/lively4/aexpr/src/external/opencv/opencv-4.5.0.js'
import {run} from './opencv-test.js';
</script>

<video id='videoInput' width='320' height='240' autoplay style='position: relative; display: inline-block;'></video>

<div id='log'>starting</div>;

<canvas id='canvasInput' width='320' height='240'></canvas>
<canvas id="outputCanvas" width='320' height='240' style='border: red 1px solid;'></canvas>
<canvas id="outputRect" width='320' height='240' style='border: red 1px solid;'></canvas>

<canvas id="output" width='320' height='240' style='border: red 1px solid;'></canvas>

![hello](https://lively-kernel.org/lively4/aexpr/demos/stefan/webxr/schierke.png){id=turtok}
<canvas id="turtokOut" width='320' height='240' style='border: red 1px solid;'></canvas>

<script>
async function run() {
  const get = id => lively.query(this, '#' + id)

  let video = get("videoInput"); // video is the id of video tag
  let canvasInput = get("canvasInput"); // canvasInput is the id of <canvas>
  let outputCanvas = get('outputCanvas')
  let matchesDebugRenderingOutputCanvas = get('output')

  let videoAccess;
  videoAccess = navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
    video.srcObject = stream;
    video.play();
  })
    .catch(function(err) {
    console.log("An error occurred! " + err);
  });

  const turtok = get('turtok');
  const turtokOut = get('turtokOut');

  await cv['onRuntimeInitialized'];
  await videoAccess.then(() => lively.sleep(1000))

  const log = get('log')

  {
    // prep dataset
    let referenceImage = cv.imread(turtok);
    let refAnno = new cv.Mat();
    cv.cvtColor(referenceImage, refAnno, cv.COLOR_RGBA2GRAY, 0);

    let referenceKeypoints;
    let referenceDescriptors;
    let requestId;

    const orb = new cv.ORB();
    referenceKeypoints = new cv.KeyPointVector();
    referenceDescriptors = new cv.Mat();
    orb.detect(refAnno, referenceKeypoints);
    orb.compute(refAnno, referenceKeypoints, referenceDescriptors);
    // log.innerText = referenceKeypoints.size()

    // refAnno
    const color = new cv.Scalar(255, 255, 0, 255);
    cv.drawKeypoints(refAnno, referenceKeypoints, refAnno, color);
    for (let i = 0; i < referenceKeypoints.size(); ++i) {
      const kp = referenceKeypoints.get(i);
      const center = new cv.Point(kp.pt.x, kp.pt.y);
      cv.circle(refAnno, center, 5, new cv.Scalar(0, 255, 0, 255), 1, cv.LINE_AA);
    }
    cv.imshow(turtokOut, refAnno);

    // loop the vid capture
    const cap = new cv.VideoCapture(video);
    const processVideo = () => {
      const newOrb = orb.clone()

      const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
      const gray = new cv.Mat();
      const matcher = new cv.BFMatcher(cv.NORM_HAMMING, true);

      cap.read(src);
      cv.imshow(canvasInput, src);

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      // Detect ORB features
      const keypoints = new cv.KeyPointVector();
      const descriptors = new cv.Mat();
      newOrb.detect(gray, keypoints);
      newOrb.compute(gray, keypoints, descriptors);

      log.innerText = `frame start`
      
      const matches = new cv.DMatchVector();
      matcher.match(referenceDescriptors, descriptors, matches);
      
      // Draw matches
      const output = src.clone();
      cv.drawMatches(referenceImage, referenceKeypoints, gray, keypoints, matches, output, new cv.Scalar(0, 255, 0, 255), new cv.Scalar(255, 0, 0, 255));

    // Filter matches
    let goodMatches = [];
    for (let i = 0; i < matches.size(); i++) {
      if (matches.get(i).distance < 50) { // You can adjust the threshold
        goodMatches.push(matches.get(i));
      }
    }

      log.innerText += `, ${goodMatches.length} good`

      // Draw keypoints
      const color = new cv.Scalar(0, 255, 0, 255);
      cv.drawKeypoints(src, keypoints, src, color);
      for (let i = 0; i < keypoints.size(); ++i) {
        const kp = keypoints.get(i);
        const center = new cv.Point(kp.pt.x, kp.pt.y);
        cv.circle(gray, center, 5, new cv.Scalar(0, 255, 0, 255), 1, cv.LINE_AA);
      }

      // Draw matches
      const output2 = src.clone();
      if (goodMatches.length > 10) { // Minimum number of good matches to consider the reference image found
        // Extract location of good matches
        const srcPoints = [];
        const dstPoints = [];
        for (let i = 0; i < goodMatches.length; i++) {
          srcPoints.push(referenceKeypoints.get(goodMatches[i].queryIdx).pt);
          dstPoints.push(keypoints.get(goodMatches[i].trainIdx).pt);
        }

        // Convert points to Mat
        const srcMat = cv.matFromArray(srcPoints.length, 1, cv.CV_32FC2, srcPoints);
        const dstMat = cv.matFromArray(dstPoints.length, 1, cv.CV_32FC2, dstPoints);

        // Find homography
        const mask = new cv.Mat();
        const H = cv.findHomography(srcMat, dstMat, cv.RANSAC, 5, mask);

        // Use homography to check for object presence
        log.innerText += `, homography ${H.empty ? 'empty' : 'yeah!'}`
        if (!H.empty()) {
          const hMask = new cv.Mat();
          cv.findHomography(srcMat, dstMat, cv.RANSAC, 5, hMask);

          // Count inliers
          let inliers = 0;
          for (let i = 0; i < hMask.rows; i++) {
            if (hMask.data[i] === 1) {
              inliers++;
            }
          }

          // If enough inliers, consider the object found
          log.innerText += `, ${inliers} good`
          if (inliers > 10) {

        const rectColor = new cv.Scalar(0, 255, 0, 255); // Green rectangle
        const rectPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          referenceImage.cols, 0,
          referenceImage.cols, referenceImage.rows,
          0, referenceImage.rows
        ]);
            
            const perspectivePoints = new cv.Mat();
        cv.perspectiveTransform(rectPoints, perspectivePoints, H);

        // Draw rectangle around the detected object
        const pointsData = perspectivePoints.data32F;
        cv.line(output, new cv.Point(pointsData[0], pointsData[1]), new cv.Point(pointsData[2], pointsData[3]), rectColor, 2);
        cv.line(output, new cv.Point(pointsData[2], pointsData[3]), new cv.Point(pointsData[4], pointsData[5]), rectColor, 2);
        cv.line(output, new cv.Point(pointsData[4], pointsData[5]), new cv.Point(pointsData[6], pointsData[7]), rectColor, 2);
        cv.line(output, new cv.Point(pointsData[6], pointsData[7]), new cv.Point(pointsData[0], pointsData[1]), rectColor, 2);

        rectPoints.delete();
        perspectivePoints.delete();
          }

          hMask.delete();
        }

        srcMat.delete();
        dstMat.delete();
        H.delete();
        mask.delete();
      }

      const outputRect = get('outputRect');
      cv.imshow(outputRect, output2);
      
      cv.imshow(outputCanvas, gray);
      cv.imshow(matchesDebugRenderingOutputCanvas, output);

      src.delete()
      gray.delete()
      matches.delete();
      output.delete();
      keypoints.delete()
      descriptors.delete()
      newOrb.delete()

      if(!lively.allParents(lively.query(this, '*'), [], true).includes(document.body)) {
        lively.warn('BREAK')
        referenceImage.delete();
        referenceKeypoints.delete();
        referenceDescriptors.delete();
        matcher.delete()
        orb.delete()
        cap.delete()
      } else {
        requestAnimationFrame(processVideo);
      }
    }

    processVideo();
  }
}

run.call(this)
</script>

