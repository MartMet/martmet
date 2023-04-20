// Copyright 2020 The MediaPipe Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.




const mpHolistic = window;
const drawingUtils = window;
const LandmarkGrid = window.LandmarkGrid;
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
//const grid = new LandmarkGrid(landmarkContainer);

function insertGlobalScript(url) {
    var element = document.createElement('script');
    element.setAttribute('src', url);
    element.setAttribute('type', 'application/javascript');
    element.setAttribute('crossorigin', 'anonymous');
    document.head.appendChild(element);

    return new Promise((resolve) => {
        element.onload = () => {
            resolve();
        };
    });
}

let detectHandsExports;
export async function onInit(component) {
    
    const {
        getAssemblyExports
    } = await globalThis.getDotnetRuntime(0);
    detectHandsExports = await getAssemblyExports("DetectHandsJsComponent.dll");

    await insertGlobalScript('https://cdnjs.cloudflare.com/ajax/libs/google-closure-library/20230206.0.0/base.js')
    await insertGlobalScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
    await insertGlobalScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
    await insertGlobalScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js')
    await insertGlobalScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils_3d/control_utils_3d.js')
    await insertGlobalScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });
    //create grid later when import finished

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    pose.onResults(results => onResults(component, results));
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await pose.send({
                image: videoElement
            });
        },
        width: 1280,
        height: 720
    });
    camera.start();
    console.log("camera.started");
}
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
//const fpsControl = new controls.FPS();

const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};



function onResults(component, results) {

    // Hide the spinner.
    document.body.classList.add('loaded');

    //if (!results.poseLandmarks) {
    //    grid.updateLandmarks([]);
    //    return;
    //}

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    //canvasCtx.drawImage(results.segmentationMask, 0, 0,
    //    canvasElement.width, canvasElement.height);

    //// Only overwrite existing pixels.
    //canvasCtx.globalCompositeOperation = 'source-in';
    //canvasCtx.fillStyle = '#00FF00';
    //canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    //// Only overwrite missing pixels.
    //canvasCtx.globalCompositeOperation = 'destination-atop';
    //canvasCtx.drawImage(
    //    results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });
    canvasCtx.restore();

    //grid.updateLandmarks(results.poseWorldLandmarks);
    if (results) {
        const json = JSON.stringify({ results });
        detectHandsExports.
            DetectHandsJsComponent.DetectHands.Interop.OnResults(component, json);
    }

}