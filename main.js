'use strict'

import * as predict from './predict.js'

const video = document.getElementById('camera');
const cameraOverlay = document.getElementById('cameraOverlay');
const cameraSection = document.getElementById('cameraSection');
const loading = document.getElementById('loading');
const instructions = document.getElementById('instructions');

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

function sortDevices(a, b) {
  return ('' + a.label).localeCompare(b.label);
}

// https://webrtc.github.io/samples/src/content/devices/input-output/
// https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
const audioInputs = [];
const audioOutputs = [];
const videoDevices = [];

async function getDevices() {
  // https://stackoverflow.com/a/60300833
  // await navigator.mediaDevices.getUserMedia({audio: true, video: true}).catch(userMediaError);
  await navigator.mediaDevices.getUserMedia({video: true}).catch(userMediaError);
  let deviceInfos = await navigator.mediaDevices.enumerateDevices().catch(userMediaError);
  
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind === 'audioinput') {
      // option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputs.push({label: deviceInfo.label, id: deviceInfo.deviceId});
    } else if (deviceInfo.kind === 'audiooutput') {
      // option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputs.push({label: deviceInfo.label, id: deviceInfo.deviceId});
    } else if (deviceInfo.kind === 'videoinput') {
      // option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoDevices.push({label: deviceInfo.label, id: deviceInfo.deviceId});
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  audioInputs.sort(sortDevices);
  audioOutputs.sort(sortDevices);
  videoDevices.sort(sortDevices);
  // instructions.innerHTML += `<hr>Camera devices found: ${JSON.stringify(videoDevices, ["label"])}`;
  console.log('Video devices sorted', JSON.stringify(videoDevices));
}

export function userMediaError(error) {
  if (error){
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }
  loading.innerHTML = 'Camera is blocked by your browser 🔒 😢 😭';
}

async function start(){
  if (getUserMediaSupported()) {
    loading.innerHTML = 'Requesting camera access 📷 🥺 🙏';
    await getDevices();
    const constraints = {
      video: videoDevices[0].id
      ? {deviceId: {exact: videoDevices[0].id}}
      : {facingMode: {min: "user", ideal: "environment"}}
    };
    
    loading.innerHTML = 'Loading SSD model 🚚 🏎️ 🚀';
    await predict.loadModel();
    
    loading.innerHTML = 'Starting video stream 🎬 🎥 🎞️';
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      instructions.classList.remove('removed');
      loading.classList.add('removed');
      video.srcObject = stream;
      // video.addEventListener('loadeddata', predictFrame);
      video.onloadeddata = predict.predictFrame;
      })
    .catch(userMediaError);
  } else {
    userMediaError(null);
  }
}

start();
