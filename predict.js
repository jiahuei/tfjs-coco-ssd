'use strict'

const instructions = document.getElementById('instructions');
const loading = document.getElementById('loading');
const cameraOverlay = document.getElementById('cameraOverlay');
const cameraSection = document.getElementById('cameraSection');
const video = document.getElementById('camera');

let model = null;
let backend = null;

export async function loadModel(){
  if (model === null){
    model = await cocoSsd.load();
  }
  backend = tf.getBackend();
  console.log("Model", model);
  console.log("TF backend", backend);
  return model
}

let count = 1;
let t0 = performance.now();

function computeFPS(){
  count ++;
  if (count % 5 == 0) {
    let timeTaken = (performance.now() - t0) / 1000
    t0 = performance.now();
    let fps = (5 / timeTaken).toFixed(2);
    let text = instructions.innerHTML.split('<hr>')[0]
    instructions.innerHTML = text + `<hr>Backend: ${backend}&emsp;FPS: ${fps}`;
  }
}

export function predictFrame() {
  model.detect(video).then(predictions => {
    computeFPS();
    renderPredictions(predictions);
    requestAnimationFrame(predictFrame);
  })
}

let children = [];

function renderPredictions(predictions) {
  // Remove any highlighting we did previous frame.
  for (let i = 0; i < children.length; i++) {
    cameraOverlay.removeChild(children[i]);
  }
  children.splice(0);


  let {
    videoWidth: videoWidth, videoHeight: videoHeight,
    offsetWidth: videoOffsetWidth, offsetHeight: videoOffsetHeight
  } = video;
  let resize_ratio = videoOffsetWidth / videoWidth;

  // Now lets loop through predictions and draw them to the live view if
  // they have a high confidence score.
  for (let n = 0; n < predictions.length; n++) {
    // If we are over 66% sure we are sure we classified it right, draw it!
    if (predictions[n].score > 0.66) {
      const p = document.createElement('p');
      p.innerText = predictions[n].class  + ' - with ' 
          + Math.round(parseFloat(predictions[n].score) * 100) 
          + '% confidence.';
      p.style = 
        `margin-left: ${predictions[n].bbox[0] * resize_ratio}px; ` +
        `margin-top: ${predictions[n].bbox[1] * resize_ratio - 10}px; ` +
        `width: ${predictions[n].bbox[2] * resize_ratio - 10}px; ` +
        `top: 0; left: 0;`;

      const highlighter = document.createElement('div');
      highlighter.setAttribute('class', 'highlighter');
      highlighter.style = 
          `left: ${predictions[n].bbox[0] * resize_ratio}px; ` +
          `top: ${predictions[n].bbox[1] * resize_ratio}px; ` +
          `width: ${predictions[n].bbox[2] * resize_ratio}px; ` +
          `height: ${predictions[n].bbox[3] * resize_ratio}px; `;

      cameraOverlay.appendChild(highlighter);
      cameraOverlay.appendChild(p);
      children.push(highlighter);
      children.push(p);
    }
  }
}
