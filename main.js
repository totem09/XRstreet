document.oncontextmenu = function (e) { return false };

window.onkeydown = function (evt) {
  if (evt.keyCode == 123) return false;
};

document.onkeydown = function (e) {
  if (e.ctrlKey &&
    (e.keyCode === 67 ||
      e.keyCode === 86 ||
      e.keyCode === 85 ||
      e.keyCode === 117)) {
    return false;
  } else {
    return true;
  }
};


const _settings = {
  threshold: 0.8,
  NNVersion: 29,

  shoeRightPath: 'assets/sneaker.glb',
  isModelLightMapped: false,
  occluderPath: 'assets/occluder.glb',

  scale: 0.95,
  translation: [0, -0.02, 0],

  debugCube: false,
  debugDisplayLandmarks: false,
  displayShoe: true
};

const _three = {
  loadingManager: null
}

const _states = {
  notLoaded: -1,
  loading: 0,
  running: 1,
  busy: 2
};

let _state = _states.notLoaded;
let _isSelfieCam = false;


function setFullScreen(cv) {
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
}


function main() {
  _state = _states.loading;

  const handTrackerCanvas = document.getElementById('handTrackerCanvas');
  const VTOCanvas = document.getElementById('ARCanvas');

  setFullScreen(handTrackerCanvas);
  setFullScreen(VTOCanvas);

  HandTrackerThreeHelper.init({
    poseLandmarksLabels: [
      'ankleBack', 'ankleOut', 'ankleIn', 'ankleFront',
      'heelBackOut', 'heelBackIn',
      'pinkyToeBaseTop', 'middleToeBaseTop', 'bigToeBaseTop'
    ],
    enableFlipObject: true,
    cameraZoom: 1,
    freeZRot: false,
    threshold: _settings.threshold,
    scanSettings: {
      multiDetectionSearchSlotsRate: 0.6,
      multiDetectionMaxOverlap: 0.4,
      multiDetectionOverlapScaleXY: [0.5, 1],
      multiDetectionEqualizeSearchSlotScale: true,
      multiDetectionForceSearchOnOtherSide: true,
      multiDetectionForceChirality: 1,
      disableIsRightHandNNEval: true,
      overlapFactors: [1.0, 1.0, 1.0],
      translationScalingFactors: [0.3, 0.3, 1],
      nScaleLevels: 4, // in the higher scale level, the size of the detection window is the smallest video dimension
      scale0Factor: 0.5
    },
    VTOCanvas: VTOCanvas,
    handTrackerCanvas: handTrackerCanvas,
    debugDisplayLandmarks: _settings.debugDisplayLandmarks,
    NNsPaths: ['neuralNets/NN_FOOT_' + _settings.NNVersion.toString() + '.json'],
    maxHandsDetected: 2,
    stabilizationSettings: {
      qualityFactorRange: [0.5, 0.8],
      NNSwitchMask: {
        isRightHand: false,
        isFlipped: false
      }
    },
    landmarksStabilizerSpec: {
      minCutOff: 0.01,
      beta: 3
    }
  }).then(function (three) {
    handTrackerCanvas.style.zIndex = 3;
    start(three);
  }).catch(function (err) {
    console.log('INFO in main.js: an error happens ', err);
  });
}

function start(three) {
  three.loadingManager.onLoad = function () {
    console.log('INFO in main.js: Everything is loaded');
    _state = _states.running;
  }

  three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  three.renderer.outputEncoding = THREE.sRGBEncoding;

  if (!_settings.isModelLightMapped) {
    const pointLight = new THREE.PointLight(0xfae6dc, 0.7);
    const ambientLight = new THREE.AmbientLight(0xcebefa, 0.2);
    three.scene.add(pointLight, ambientLight);
  }

  if (_settings.debugCube) {
    const s = 1;
    const cubeGeom = new THREE.BoxGeometry(s, s, s);
    const cubeMesh = new THREE.Mesh(cubeGeom, new THREE.MeshNormalMaterial());
    HandTrackerThreeHelper.add_threeObject(cubeMesh);
  }

  function transform(threeObject) {
    threeObject.scale.multiplyScalar(_settings.scale);
    threeObject.position.add(new THREE.Vector3().fromArray(_settings.translation));
  }

  if (_settings.displayShoe) {
    new THREE.GLTFLoader().load(_settings.shoeRightPath, function (gltf) {
      const shoe = gltf.scene;
      transform(shoe);
      HandTrackerThreeHelper.add_threeObject(shoe);
    });
  }

  new THREE.GLTFLoader().load(_settings.occluderPath, function (gltf) {
    const occluder = gltf.scene.children[0];
    transform(occluder);
    HandTrackerThreeHelper.add_threeOccluder(occluder);
  });
}



window.addEventListener('load', main);