// THIRD PARTY LIBRARIES USED:
// fastnoiselite library created by Auburn under MIT License
// Three.JS library created by MrDoob under MIT License
// - No collaborators worked on my submission
// - Each code segment submitted for the written response was written by me

// --->  IMPORTS
import FastNoiseLite from "/Third Party/FastNoiseLite.js";
let worldgen = new FastNoiseLite();

// --->  CONFIGURATION

// the total size of the world (width)
const worldSize = prompt("World Size (Max 1000): ");
// polygon debug
const wireframeEnabled = false;
// world height multiplier
const globalNMultiplier = 50;
// player's name
const playerName = Math.round(Math.random() * 50000) + 50000;
// player Speed
let moveSpeed = 10;
let sprintSpeed = 20;
// player reach (block placing)
let playerReach = 5;
// player height
const playerHeight = 4;
// distance to pregenerate chunks (from chunk center)
const chunkPregenDistance = 4;
// sea level
const seaLevel = 2;
// gravity constant
const gravityConstant = 9.81;
// debug debug mode
let debugMode = false;
// max player placed blocks
let maxPlayerBlocks = 100000;

// --->  WORLD GEN SETUP

let chunkPos = new THREE.Vector2(0, 0);

worldgen.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
worldgen.SetFrequency(0.0020);
worldgen.SetFractalType(FastNoiseLite.FractalType.FBm);
worldgen.SetFractalOctaves(5);
worldgen.SetFractalLacunarity(2.00);
worldgen.SetFractalWeightedStrength(-0.50);
worldgen.SetCellularDistanceFunction(FastNoiseLite.CellularDistanceFunction.EuclideanSq);
worldgen.SetCellularReturnType(FastNoiseLite.CellularReturnType.Distance2Mul);
worldgen.SetCellularJitter(1.00);

const chatBox = document.querySelector("#chatBox");
function sendChat(msg)
{
  chatBox.innerHTML += "<br/>" + msg;
}

function getNoise(x, z) {

  // if not player placed coords, generate a new position
  let n = worldgen.GetNoise(x, z);

  // modify N values
  n = Math.ceil(n * globalNMultiplier);

  return n;
}

// array of unnatural blocks, to return for collision testing
let playerCreatedBlocks = [];
function predictCollisionAt(x, y, z)
{
  if (playerCreatedBlocks.length > 0)
  {
    let vPos = new THREE.Vector3(x, y, z);
    for (let i = 0; i < playerCreatedBlocks.length; i++)
    {
      if (vPos.distanceTo(playerCreatedBlocks[i]) < 1)
      {
        return (vPos.y * globalNMultiplier) + playerHeight;
      }
    }
  }
  let noiseValHere = getNoise(x, z);
  if (noiseValHere < seaLevel) noiseValHere = seaLevel;
  return noiseValHere - 2;
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  10000
);

// --->  RENDERER SETUP
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x6fc8f7, 1);
document.body.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio);
window.addEventListener("resize", function(e) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
});

let composer = new THREE.EffectComposer(renderer);

let renderpass = new THREE.RenderPass(scene, camera);
composer.addPass(renderpass);

// --->  WORLD LIGHTING SETUP
const dirLight = new THREE.HemisphereLight(0xffffff, 1);
scene.add(dirLight);

// --->  INSTANCED BLOCK SETUP
let totalCubes = Math.pow(worldSize, 2);
const waterColor = new THREE.Color(0x373bf2);
const grassColor = new THREE.Color(0x4f9e64);
const sandColor = new THREE.Color("orange");

var cubeData = {
  geometry: new THREE.BoxGeometry(1, 2, 1),
  material: new THREE.MeshPhysicalMaterial({ color: grassColor, wireframe: wireframeEnabled })
};

let matrix = new THREE.Matrix4();

var cubePositions = [];

let cube = new THREE.InstancedMesh(cubeData.geometry, cubeData.material, totalCubes + maxPlayerBlocks);

function generateWorld(genPos)
{
  scene.remove(cube);
  matrix = new THREE.Matrix4();
  cubePositions = [];
  cube = new THREE.InstancedMesh(cubeData.geometry, cubeData.material, totalCubes + maxPlayerBlocks);
  let worldOffsetX = Math.round(genPos.x);
  let worldOffsetZ = Math.round(genPos.z);
  let i = 0;
  for (var x = -worldSize / 2; x < worldSize / 2; x++) {
    for (var z = -worldSize / 2; z < worldSize / 2; z++) {
      i++;
      let cubePos = new THREE.Vector3(x, getNoise(x + worldOffsetX, z + worldOffsetZ), z);
      cube.setColorAt(i, grassColor)

      if (cubePos.y < seaLevel)
      {
        cubePos = new THREE.Vector3(x, seaLevel, z);
        cube.setColorAt(i, waterColor)
      }
      else if (cubePos.y == seaLevel || cubePos.y == seaLevel+1)
      {
        cube.setColorAt(i, sandColor)
      }
      matrix.makeTranslation(cubePos.x + worldOffsetX, cubePos.y, cubePos.z + worldOffsetZ);
      cube.setMatrixAt(i, matrix);
      cubePositions.push(cubePos);
    }
  }
  for (let i = 0; i < playerCreatedBlocks.length; i++)
  {
    let cubePos = playerCreatedBlocks[i];
    cube.setColorAt(i, new THREE.Color(0xffffff * Math.random()))

    matrix.makeTranslation(cubePos.x, cubePos.y, cubePos.z);
    cube.setMatrixAt(i, matrix);
    cubePositions.push(cubePos);
  }
  scene.add(cube);
}

generateWorld(new THREE.Vector3(0, 0, 0));

camera.position.y = 30;
scene.fog = new THREE.FogExp2(0xcccccc, 0.005);

// ---> NETWORKING
// SocketIO library created by socket.io under MIT License
let players = [];
let playerWorldObjects = [];
function handlePlayerJoinEvent(name) {
  // index joined player's name
  players.push(name);

  // create world object for new player
  let playerObject = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff})
  );
  sendChat("Player " + id + " joined");
  playerObject.userData = name;
  playerWorldObjects.push(playerObject);
  scene.add(playerObject);
}

function handlePlayerMoveEvent(id, x, y, z) {
  // dont process own move
  console.log("Player " + id + " Moved");
  if (id === playerName) return;
  
  let playerObject;
  console.log(playerWorldObjects.length);
  for (let i = 0; i < playerWorldObjects.length; i++)
  {
    if (playerWorldObjects[i].userData === id)
    {
      playerObject = playerWorldObjects[i];
      break;
    }
  }
  if (playerObject === undefined)
  {
    console.log("Error handling Move Event with list: " + players);
    return;
  }
  playerObject.position.set(x, y, z);
}

function handleBlockPlaceEvent(x, y, z)
{
  let newBlockPos = new THREE.Vector3(x, y, z);
  matrix.makeTranslation(x, y, z);
  cube.setMatrixAt(cubePositions.length, matrix);
  cube.setColorAt(cubePositions.length, grassColor);
  cubePositions.push(newBlockPos);
  playerCreatedBlocks.push(newBlockPos);
  
  cube.instanceMatrix.needsUpdate = true;
}

// NETWORKING
const socket = io("[Server IP Address Goes Here]"); // Note: The server code is not part of this create task submission. This is only the client.

// --> send to server
// Client Connect To Server
socket.on("connect", () => {
  socket.emit("clientConnectionEvent", playerName);
  sendChat("Server Status: Connected");
});

socket.on("connect_error", () => {
  status.innerHTML = "Server: Failed to Connect, Playing Offline";
  status.style.color = "red";
});

// --> receive from server
// Player Join Event
socket.on("playerJoinEvent", name => {
  handlePlayerJoinEvent(name);
});
socket.on("blockPlacedEvent", (x, y, z) => {
  handleBlockPlaceEvent(x, y, z);
});
socket.on("loadJoinedPlayersEvent", newPlayers => {
  console.log("LOADING EXISTING PLAYERS " + newPlayers);
  for (let i = 0; i < newPlayers.length; i++)
  {
    let e = newPlayers[i];
    if (e != playerName) handlePlayerJoinEvent(e);
  }
});
// Player Move Event
socket.on("playerMoveEvent", (id, x, y, z) => {
  console.log("RAW ID : " + id);
  handlePlayerMoveEvent(id, x, y, z);
})

// error
socket.on("connect_error", err => {
  console.log(err.message);
})

// ---> DEBUG MODE
const toggleDebugMode = function()
{
  debugMode = !debugMode;
  let debugWarning = document.querySelector("#debugWarning");
  if (debugMode === false)
  {
    debugWarning.style.visibility = "hidden";
  }
  else
  {
    debugWarning.style.visibility = "visible";
  }
}

// --->  FIRST PERSON CONTROLS
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
let pauseMenu = document.querySelector("pauseMenu");
controls.movementSpeed = 150;
controls.lookSpeed = 100;

let xAxis = 0;
let zAxis = 0;
let jump = 0;
let mouseClick = 0;
let sprinting = false;

document.addEventListener('mousedown', function (e) {
  switch (e.button) {
    case 0:
      mouseClick = 1;
      break;
    case 2:
      mouseClick = 2;
      break;
  }
});

document.addEventListener('mouseup', function (e) {
  mouseClick = 0;
});

document.addEventListener('keydown', function (e) {
  switch (e.code) {
    case 'KeyW':
      zAxis = -1;
      break;
    case 'KeyA':
      xAxis = -1;
      break;
    case 'KeyS':
      zAxis = 1;
      break;
    case 'KeyD':
      xAxis = 1;
      break;
    case 'Space':
      jump = 1;
      break;
    case 'ShiftLeft':
      sprinting = true;
      break;
    case 'KeyF':
      toggleDebugMode();
      break;
    case 'KeyR':
      controls.getObject().position.set(0, 15, 0);
      break;
  }
});

document.addEventListener('keyup', function (e) {
  switch (e.code) {
    case 'KeyW':
      zAxis = 0;
      break;
    case 'KeyA':
      xAxis = 0;
      break;
    case 'KeyS':
      zAxis = 0;
      break;
    case 'KeyD':
      xAxis = 0;
      break;
    case 'Space':
      jump = 0;
      break;
    case 'ShiftLeft':
      sprinting = false;
      break;
  }
});

document.addEventListener('wheel', function(e) {
  playerReach += e.deltaY * -0.01;
});

document.body.addEventListener('click', function () {
  controls.lock();
});
scene.add(controls.getObject());

// --->  CROSSHAIR HIGHLIGHT SETUP
const cubeHighlightGeometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1));

const cubeHighlight = new THREE.LineSegments(cubeHighlightGeometry);
cubeHighlight.material.depthTest = false;
cubeHighlight.material.opacity = 0.25;
cubeHighlight.material.transparent = true;

scene.add(cubeHighlight);

// ---> CUSTOM BLOCK COLORS
const logColor = new THREE.Color("brown");

let playerColor = logColor;

// --->  RENDERER SETUP
const clock = new THREE.Clock();
var framenum = 0;
let groundBlock = new THREE.Vector3();
function render() {
  let delta = clock.getDelta();
  framenum++;

  // init update loop
  let newPos = camera.position;

  // figure out where to look

  // directional control
  
  /*
  newPos.x += (moveSpeed * delta * xAxis); // left & right (A | D)
  newPos.y += (moveSpeed * delta * jump * 2);
  newPos.z += (moveSpeed * delta * zAxis); // forward and back (W | S)
  */

  let playerMoveSpeed = moveSpeed;
  if (sprinting) playerMoveSpeed = sprintSpeed;

  controls.moveRight(playerMoveSpeed * delta * xAxis);
  controls.moveForward(-playerMoveSpeed * delta * zAxis);

  controls.getObject().position.y += (playerMoveSpeed * delta * jump * 2);

  //console.log(moveLeft + ", " + moveRight + ", " + moveForward + ", " + moveBack)

  // gravity
  if (newPos != groundBlock) {
    let groundY = predictCollisionAt(newPos.x, newPos.y, newPos.z);
    groundY = Math.ceil(groundY);

    groundBlock.x = newPos.x;
    groundBlock.y = groundY + 1;
    groundBlock.z = newPos.z;
  }

  if (newPos.y > groundBlock.y + playerHeight) {
    let diffY = Math.abs(newPos.y-groundBlock.y);
    newPos.y -= (gravityConstant*(diffY/4)) * delta;
  }

  // SEND COORDS TO SERVER
  if (Math.round(Math.random() * 10) === 1)
  {
    // random chance of update tick
    socket.emit("clientMoveEvent", playerName, newPos.x, newPos.y, newPos.z);
  }

  // Calculate CHUNK POSITION

  let newChunkPosX = Math.round(newPos.x / (worldSize/chunkPregenDistance));
  let newChunkPosY = Math.round(newPos.z / (worldSize/chunkPregenDistance));
  if (chunkPos.x != newChunkPosX || chunkPos.y != newChunkPosY)
  {
    generateWorld(newPos);
    
    cube.instanceMatrix.needsUpdate = true;
  }
  chunkPos.set(newChunkPosX, newChunkPosY);

  document.querySelector("#coords").innerHTML = (
    "Coords: (" + 
    Math.round(newPos.x) + ", " +
    Math.round(newPos.y) + ", " + 
    Math.round(newPos.z) + ")\n" + 
    "\nChunk Coords: (" + 
    Math.round(chunkPos.x) + ", " +
    Math.round(chunkPos.y) + ")"
  );
    
  // get camera directional vector
  let camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  // find the cube target position based on it camera dir vector
  camDir.multiplyScalar(playerReach);
  camDir.add(camera.position);
  const cubePos = new THREE.Vector3(Math.round(camDir.x), Math.round(camDir.y), Math.round(camDir.z));

  //posit
  cubeHighlight.position.set(cubePos.x, cubePos.y, cubePos.z);

  if (mouseClick === 1) {
    if (debugMode === true) {
      const arrow = new THREE.ArrowHelper(camera.getWorldDirection(), camera.getWorldPosition(), 100, Math.random() * 0xffffff);
      scene.add(arrow);
    }

    matrix.makeTranslation(cubePos.x, cubePos.y, cubePos.z);
    cube.setMatrixAt(cubePositions.length, matrix);
    cube.setColorAt(cubePositions.length, new THREE.Color(0xffffff * Math.random()));
    cubePositions.push(cubePos);
    playerCreatedBlocks.push(cubePos);
    
    cube.instanceMatrix.needsUpdate = true;

    socket.emit("clientBlockPlaceEvent", cubePos.x, cubePos.y, cubePos.z);
  }

  composer.render();

  requestAnimationFrame(render);
}

render();