let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let set: number = 0;
var canvasWidth = 0, canvasHeight = 0;
let rollerPos = [1, 1, 6, 1]; // Positions of the four rollers
let consoleImg: InstanceType<typeof Image> = undefined; // The image of the console
let powerOnImg: InstanceType<typeof Image> = undefined; // The image of the power-on button illuminated
let imatrix = null; // Inverted transformation matrix.

let lampTest: boolean = false;
let powerOff: boolean = false;

// Operator control light statuses
let systemLight: boolean = false;
let manualLight: boolean = false;
let waitLight: boolean = false;
let testLight: boolean = false;
let loadLight: boolean = false;

// Handle a window resize: adjust the canvas size and then redraw
// The idea is to fit the canvas to the screen vertically, while make the sidebar scrollable.
// There's probably a better way to do this...
function resize() : void {
  // I'm not clever enough to do everything with media queries, so I'm hardcoding it.
  if ($(window).width() > 768) {
    resizeDesktop();
  } else {
    resizeMobile();
  }
  // canvas width is the number of logical pixels, clientWidth is the number of pixels occupied by the canvas.
  canvasWidth = $("#canvas").width();
  canvasHeight = $("#canvas").height();
  canvas.style.width =  canvasWidth + "px"; // Physical size
  canvas.style.height = canvasHeight + "px";
  canvas.width = canvasWidth * SCALE; // Number of logical pixels in canvas
  canvas.height = canvasHeight * SCALE;

  // Scale to fit the image: Initialize cameraOffset, cameraZoom
  cameraOffset = { x: canvasWidth / 2, y: canvasHeight / 2 }
  cameraZoom = Math.min(canvasWidth / consoleImg.width, canvasHeight / consoleImg.height);
  lastZoom = cameraZoom;
  MIN_ZOOM = cameraZoom; // Don't zoom too small

  draw();
}

// Adjust the layout for a desktop display
// The idea is to fit the canvas to the available space, with the sidebar equal space but scrollable.
function resizeDesktop() : void {
  // Determine available vertical space
  const h = window.innerHeight - $("#nav").height();
  $("body").css("overflow-y", "hidden");
  $("#sidebar").css("overflow-y", "scroll");
  $("#sidebar").height(h);
  $("#canvas").height(h)
}

// Adjust the layout for a mobile device
// The idea is to have the canvas on top and the sidebar below, scrolling together.
// The canvas is sized to fit the available space if reasonable.
function resizeMobile() : void {
  // Determine available vertical space
  $("body").css("overflow-y", "scroll");
  $("#sidebar").css("overflow-y", "visible");
  let h = window.innerHeight - $("#nav").height();
  let w = window.innerWidth;
  let h1 = consoleImg.height / consoleImg.width * w; // Height if image fills width of window
  if (h1 <= h * .8) {
    // Image fits
    $("#canvas").height(h1)
  } else {
    // Shrink image so it fits.
    // Won't look good on a landscape phone.
    $("#canvas").height(h * .8)
  }
}

// Avoid zoom/pan from zooming the image out of the screen.
// If one of the edges of the image will go past the center, pull it back.
function validateCamera() : void {
  // Want to make sure that the edge of the image doesn't go past the center (as an arbitrary limit)
  // (canvasCoord + (cameraOffset - center)) * zoom + center = screen pixel
  const minXoffset = canvasWidth / 2 - consoleImg.width / 2;
  const maxXoffset = canvasWidth / 2 + consoleImg.width / 2;
  const minYoffset = canvasHeight / 2 - consoleImg.height / 2;
  const maxYoffset = canvasHeight / 2 + consoleImg.height / 2;
  if (cameraOffset.x > maxXoffset) {
    cameraOffset.x = maxXoffset;
  } else if (cameraOffset.x < minXoffset) {
    cameraOffset.x = minXoffset;
  }
  if (cameraOffset.y > maxYoffset) {
    cameraOffset.y = maxYoffset;
  } else if (cameraOffset.y < minYoffset) {
    cameraOffset.y = minYoffset;
  }
}

// Assume canvas.style.width, canvas.style.height are set to the desired physical dimensions.
// Coordinates: 
//   cameraOffset is set to the x,y offset values in screen coordinates. So (clientWidth/2, clientHeight/2) for centered drawing origin. (0, 0) for origin in the upper left.
// cameraZoom is set to the zoom factor.
function draw() : void {
  validateCamera();

  // Clear
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // First, set up the transform based on the camera position
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
  // canvas width is the number of logical pixels, clientWidth is the number of pixels occupied by the canvas.
  ctx.scale(SCALE, SCALE);
  ctx.translate( canvasWidth / 2, canvasHeight / 2);
  ctx.scale(cameraZoom, cameraZoom) // Zoom around center of canvas
  ctx.translate( cameraOffset.x - canvasWidth / 2, cameraOffset.y - canvasHeight / 2);

  // window is centered on 0, 0.
  // Coordinate system: drawing origin = screen center + (camera - screen center) * zoom
  // So drawing coordinate at center of screen is constant regardless of zoom
  var matrix = ctx.getTransform();
  imatrix = matrix.invertSelf(); // Remember inverted transformation matrix.

  consoleDraw();
}

/**
 * Draws the display.
 * This function does the actual drawing; draw() sets up the transform.
 */
function consoleDraw() : void {
  ctx.save();
  // Coordinate system centered on (0,0) so shift image to be centered
  ctx.drawImage(consoleImg, -consoleImg.width / 2, -consoleImg.height / 2);

  // Lights and rollers coordinates need to be scaled to account for double-resolution canvas.
  // (For historical reasons, these numbers are half of the console image pixel values.)
  ctx.translate(-consoleImg.width / 2, -consoleImg.height / 2);
  ctx.scale(SCALE, SCALE);

  // Draw rollers in their current positions. Each roller is drawn in two parts
  for (let r = 0; r < 4; r++) {
    ctx.drawImage(rollerImgs[2 * r][rollerPos[r] - 1], 393, interp(723, 1008, 4, r), 454, 24);
    ctx.drawImage(rollerImgs[2 * r + 1][rollerPos[r] - 1], 868, interp(723, 1008, 4, r), 454, 24);
  }

  consoleDrawLights();
  drawLoadDials();
  ctx.restore();
}

/**
 *  Draws the various console lights.
 *  See SY22-2832-4_360-50Maint.pdf Appendix B for details.
 */
function consoleDrawLights() : void {
  // Initialize all lights to on or off based on the lampTest switch.
  if (powerOff) {
    lampTest = false;
  }
  for (const [name, [x, y, color]] of Object.entries(lights)) {
    drawLight(x, y, lampTest, color);
  }

  if (lampTest || !powerOff) {
    ctx.drawImage(powerOnImg, 2220 / SCALE, 3160 / SCALE, powerOnImg.width / SCALE, powerOnImg.height / SCALE);
  }

  if (lampTest || powerOff) return;

  let bits: boolean[] = new Array(36).fill(false);
  switch (rollerPos[0]) {
    case 1:
      // TODO: Common channel roller
      break;
    case 2:
      // TODO: Common channel roller
      break;
    case 3:
      // TODO: Common channel roller
      break;
    case 4:
      // TODO: Common channel roller
      break;
    case 5:
      // TODO: Common channel roller
      break;
    case 6:
      // TODO: Common channel roller
      break;
    case 7:
      // Unused
      break;
    case 8:
      // Unused
      break;
  }
  drawRollerLights(0, bits);

  bits.fill(false);
  switch (rollerPos[1]) {
    case 1:
      extractBits(0, 32, bits, 0, true /* parity */); // I/O B register (TODO)
      break;
    case 2:
      extractBits(0, 32, bits, 0, true /* parity */); // I/O C register (TODO)
      break;
    case 3:
      // TODO: Channel
      break;
    case 4:
      // TODO: Channel
      break;
    case 5:
      // TODO: Channel
      break;
    case 6:
      // TODO: Channel
      break;
    case 7:
      // TODO: Channel
      break;
    case 8:
      // Unused
      break;
  }
  drawRollerLights(1, bits);

  bits.fill(false);
  switch (rollerPos[2]) {
    case 1:
      extractBits(state['L'], 32, bits, 0, true /* parity */); // L register
      break;
    case 2:
      extractBits(state['R'], 32, bits, 0, true /* parity */); // R register
      break;
    case 3:
      extractBits(state['M'], 32, bits, 0, true /* parity */); // M register
      break;
    case 4:
      extractBits(state['H'], 32, bits, 0, true /* parity */); // H register
      break;
    case 5:
      extractBits(state['SAR'], 24, bits, 0, true /* parity */); // SAR register (24 bits)
      extractBits(state['BS'], 4, bits, 28, false /* parity */); // Byte Stats
      // TODO extractBits(state['BSS'], 4, bits, 32, false /* parity */); // Byte Store Stats
      break;
    case 6:
      // ROS
      for (let i = 0; i < 34; i++) {
        bits[i] = (state['ROS'][56 + i] == '1'); // Parity and ROS 57-89
      }
      break;
    case 7:
      // Unused
      break;
    case 8:
      extractBits(state['PREV2ROAR'], 13, bits, 5, false /* parity */); // Previous ROAR. Not sure how to manage previous / current / next ROAR.
      break;
  }
  drawRollerLights(2, bits);

  bits.fill(false);
  switch (rollerPos[3]) {
    case 1:
      // ROS
      for (let i = 0; i < 18; i++) {
        bits[i] = (state['ROS'][i] == '1'); // Parity and ROS 1-30. There's a gap between bits 18 and 19 for some reason.
      }
      for (let i = 19; i < 32; i++) {
        bits[i] = (state['ROS'][i - 1] == '1');
      }
      break;
    case 2:
      // ROS
      for (let i = 0; i < 25; i++) {
        bits[i] = (state['ROS'][31 + i] == '1'); // Parity and ROS 32-55. 
      }
      // CPU mover function
      extractBits(0 /* CPU mover */, 4, bits, 26, false /* parity */); // Unclear what 3-bit CPU mover function is, since it looks like 4 bits.
      extractBits(0 /* I/O mover function (TODO) */, 4, bits, 30, false /* parity */);

      break;
      extractBits(state["ROS"], 32, bits, 0, true /* parity */); // ROS 32-55
      break;
    case 3:
      bits[0] = false; // ONE SYL OP (half-word instruction)
      bits[1] = false; // Refetch
      extractBits(state['ROAR'], 13, bits, 5, false /* parity */); // next ROS addr
      extractBits(0 /* external interrupt register */, 6, bits, 36, false /* parity */);
      const PSW4 = (state['ILC'] << 6) | (state['CR'] << 4) | state['PROGMASK'];
      extractBits(PSW4, 8, bits, 42, false /* parity */); // PSW 32-39
      break;
    case 4:
      bits[0] = false; // I/O mode
      extractBits(0 /* IO register */, 2, bits, 1, true /* parity */);
      bits[4] = false; // Timer interrupt
      bits[5] = false; // Console interrupt
      extractBits(state['LB'], 2, bits, 6, true /* parity */); // L Byte counter
      extractBits(state['MB'], 2, bits, 9, true /* parity */); // M Byte counter
      extractBits(state['F'], 4, bits, 12, true /* parity */); // F reg
      bits[17] = state['Q'];
      extractBits(0, 2, bits, 18, false /* parity */); // Edit stats during edit instruction (TODO)
      for (let i = 0; i < 8; i++) {
        bits[20 + i] = (state['S'][i] == "1"); // General purpose stats 
      }
      bits[28] = (state['LSGNS'] == 1); // On for positive
      bits[29] = (state['RSGNS'] == 1); // On for positive
      bits[30] = (state['CSTAT'] == 1); // carry stat; 
      bits[31] = false; // Retry threshold latch
      bits[32] = false; // Storage Ring R1;
      bits[33] = false; // Storage Ring R2;
      bits[34] = false; // Storage Ring R3;
      bits[35] = false; // Storage Ring W1;
      break;
    case 5:
      extractBits(state['LSAR'], 6, bits, 1, false /* parity */); // LSAR
      extractBits(0 /* LSFN TODO */, 2, bits, 7, false /* parity */); // LSFN
      extractBits(state['J'], 4, bits, 9, true /* parity */); // J register
      extractBits(state['MB'], 4, bits, 14, true /* parity */); // J register
      bits[20] = (state['G1NEG'] == 0);
      extractBits(state['G1'], 4, bits, 21, true /* parity */); // J register
      bits[26] = (state['G2NEG'] == 0);
      extractBits(state['G2'], 4, bits, 27, true /* parity */); // J register
      break;
    case 6:
      // Adder, counters, mover, etc. These indicate faults with those components maybe? Leave them as 0.
      break;
    case 7:
      extractBits(state['ROAR'], 13, bits, 5, false /* parity */); // next ROS addr. May be an off-by-one, unclear what "next" means.
      break;
    case 8:
      extractBits(state['PREVROAR'], 13, bits, 5, false /* parity */); // Same as roller 3.
      break;
  }
  drawRollerLights(3, bits);

  // Handle the operator control lights.
  for (let i = 0; i < 5; i++) {
    const [x, y, color] = lights['ipl-' + i];
    const value = [systemLight, manualLight, waitLight, testLight, loadLight][i];
    drawLight(x, y, value, color);
  }
}

const dialPos = [5, 6, 8]; // Positions of the three dials

// Draw the labels on the three Load Unit dials
function drawLoadDials() : void {
  ctx.fillStyle = "#998b82";
  ctx.font = "9px arial";
  for (let dial = 0; dial < 3; dial++) {
    const [x0, y0] = [[2288, 3429], [2491, 3429], [2697, 3429]][dial];
    const dialSize = [8, 16, 16][dial]; // First dial has 8 positions
    for (let n = 0; n < dialSize; n++) {
      const char = "0123456789ABCDEF"[n];
      const ang = (-4.8 - 360 / 16 * (dialPos[dial] - n)) * Math.PI / 180;
      ctx.save();
      ctx.translate(x0 / 2, y0 / 2);
      ctx.scale(.93, 1);
      ctx.rotate(ang);
      ctx.fillText(char, 0, -75 / 2);
      ctx.restore();
    }
  }
}

function updateLoadDial(dial: number) : void {
  if (dial == 0) {
    dialPos[dial] = (dialPos[dial] + 1) % 8; // First dial is only 0 through 7
  } else {
    dialPos[dial] = (dialPos[dial] + 1) % 16;
  }
  draw(); // Redraw everything
}

/**
 * Extracts bits from value, putting them into the array bits.
 * This is the key function to convert a value into the bits displayed on the lights.
 * nBits = number of bits to extract
 * offset = offset into bits for leftmost bit
 * useParity = true to store parity for each byte. E.g. nBits=32 -> 36 bits stored.
 * Note that System/360 numbers bits with 1 on the left and 32 on the right,
 * but that's not the case here.
 */
function extractBits(value: number, nBits: number, bits: boolean[], offset: number, useParity: boolean) : void {
  if (value == undefined) {
    throw("bad value " + value);
  }

  // Extract bit i (i==0 for leftmost bit)
  function bitValue(i: number): boolean {
    return !!(value & (1 << (nBits - i - 1)));
  }
  // Compute odd parity of 8 bits starting at the given index
  function byteParity(start: number): boolean {
    let parity = true; // Odd parity
    for (let j = start; j < start + 8; j++) { // Loop over byte to compute parity
      parity = parity != bitValue(j);
    }
    return parity
  }
  for (let i = 0; i < nBits; i++) {
    if (useParity && (i % 8) == 0) { // Insert parity bit
      bits[offset++] = byteParity(i);
    }
    bits[offset++] = bitValue(i);
  }
}

/**
 * Draws the lights for the appropriate roller.
 * The bits array contains the 36 light values.
 */
function drawRollerLights(row: number, bits: boolean[]) {
  for (let pos = 0; pos < 36; pos++) {
    const [x, y, color] = lights["roller-" + row + "-" + pos];
    drawLight(x, y, bits[pos]);
  }
}

function drawLight(x: number, y: number, on: boolean, color?: string) {
  const onColor = color ? color : white;
  ctx.fillStyle = on ? onColor : black;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
  ctx.fill();
}

const regions: [number, number, number, number, string][] = [
  [214, 525, 228, 556, "switch-dcoff"],
  [334, 541, 374, 581, "dial-voltage"],
  [511, 282, 538, 310, "dial-6tc"],
  [631, 284, 660, 317, "dial-12ros2"],
  [764, 286, 795, 310, "dial-56xy1"],
  [507, 375, 533, 401, "dial-6var"],
  [642, 397, 669, 437, "dial-margin"],
  [764, 372, 788, 404, "dial-60z1"],
  [509, 477, 536, 499, "dial-6m2"],
  [766, 472, 793, 499, "dial-56xy2"],
  [509, 570, 538, 601, "dial-6m1"],
  [633, 576, 664, 603, "dial-12ros1"],
  [768, 572, 797, 599, "dial-60z2"],

  [899, 277, 955, 324, "dial-storagetest"],
  [1012, 288, 1032, 328, "sw-storagetest-write"],
  [1061, 284, 1083, 335, "sw-storagetest-stop-on-check"],
  [1105, 284, 1130, 333, "sw-storagetest-invert"],
  [1154, 282, 1176, 333, "sw-storagetest-isolate"],

  [1287, 235, 1360, 295, "epo"],

  [902, 468, 939, 503, "dial-56xy3"],
  [1125, 470, 1170, 503, "dial-56xy4"],
  [895, 565, 935, 599, "dial-60z3"],
  [1010, 499, 1048, 539, "dial-storage-margin"],
  [1125, 574, 1172, 607, "dial-60z4"],

  [154, 740, 205, 774, "button-channel-enter"],
  [261, 734, 276, 778, "sw-channel-op"],
  [194, 836, 234, 869, "dial-channel-display"],


  [403, 730, 1467, 760, "roller-1"],
  [403, 822, 1467, 860, "roller-2"],
  [403, 913, 1467, 950, "roller-3"],
  [403, 1009, 1467, 1046, "roller-4"],

  [476, 1403, 520, 1450, "dial-storage-select"],

  [407, 1267, 411, 1318, "toggle"],

  [132, 1575, 141, 1630, "toggle-iar-address-compare"],
  [177, 1575, 189, 1630, "toggle-iar-repeat-insn"],
  [229, 1575, 238, 1630, "toggle-ros-address-compare"],
  [275, 1575, 284, 1630, "toggle-ros-repeat-insn"],
  [322, 1575, 332, 1630, "toggle-blank"],
  [370, 1575, 379, 1630, "toggle-sar-compare"],
  [418, 1575, 428, 1630, "toggle-disable-interval-timer"],
  [455, 1575, 476, 1630, "toggle-lamp-test"],
  [514, 1575, 524, 1630, "toggle-force-indicator"],
  [561, 1575, 571, 1630, "toggle-flt-mode"],

  [669, 1578, 713, 1622, "dial-flt-control"],
  [856, 1578, 901, 1618, "dial-check-control"],
  [669, 1707, 709, 1743, "dial-rate"],
  [667, 1808, 713, 1846, "button-start"],
  [794, 1678, 842, 1713, "button-system-reset"],
  [856, 1678, 901, 1713, "button-psw-restart"],
  [915, 1678, 963, 1713, "button-check-reset"],
  [794, 1741, 842, 1775, "button-set-io"],
  [856, 1741, 901, 1775, "button-store"],
  [915, 1741, 963, 1775, "button-display"],
  [794, 1808, 842, 1844, "button-stop"],
  // [856,1808,901,1844,"button-white"],
  [915, 1808, 963, 1844, "button-log-out"],

  [1099, 1583, 1156, 1630, "button-power-on"],
  [1303, 1585, 1363, 1623, "button-power-off"],
  [1110, 1672, 1190, 1768, "dial-load-0"],
  [1204, 1672, 1297, 1768, "dial-load-1"],
  [1312, 1672, 1392, 1768, "dial-load-2"],
  [1108, 1809, 1163, 1842, "button-interrupt"],
  [1312, 1811, 1369, 1847, "button-load"],
];

const red = "#b6120a";
const yellow = "#d1c722";
const green = "#138978";
const white = "#d3c7a1";
const black = "#2d2415";
const lights: { [name: string]: [number, number, string?] } = {
  "thermal-cpu": [214, 302, red],
  "thermal-stor": [238, 302, red],
  "thermal-pdu": [262, 302],
  "open-cb": [358, 302, yellow],
  "power-check": [405, 302, red],
  "dc-off": [217, 599, red],
"6tc": [524, 253, red],
"12ros2": [654, 253, red],
"56xy1": [784, 253, red],
"6var": [524, 349, red],
"60z1": [784, 349, red],
"6m2": [524, 444, red],
"56xy2": [784, 444, red],
"6m1": [524, 539, red],
"12ros1": [654, 539, red],
"60z2": [784, 539, red],
"56xy3": [923, 444, red],
"aux-power-check": [1041, 444, red],
"56xy4": [1159, 444, red],
"60z3": [923, 541, red],
"60z4": [1159, 541, red],
};

let rollerImgs = []; // Array of Array of images
/**
 * Loads all the roller images: 8 positions for 8 half-rollers.
 * The images are stored in rollerImgs.
 * Returns a Promise, resolved when the images are loaded.
 */
async function initRollers() : Promise<void> {
  let promises = [];
  for (let roller = 1; roller <= 8; roller++) {
    let imgs = [];
    for (let pos = 1; pos <= 8; pos++) {
      let promise = new Promise((resolve, reject) => {
        let img = new Image();
        imgs.push(img);
        img.onload = resolve;
        img.onerror = reject;
        img.src = "imgs/roller-" + roller + "-" + pos + ".jpg";
      });
      promises.push(promise);
    }
    rollerImgs.push(imgs);
  }
  return Promise.all(promises).then(x => {console.log("initRollers complete");});
}

// Linearly interpolates between x0 and x1. Assume n points in total and we select point i.
// That is, for i=0, output x0; for i=N, output x1.
function interp(x0: number, x1: number, n: number, i: number) {
  return (x1 - x0) / (n - 1) * i + x0;
}

/**
 * Configures the lights and switch positions.
 * Returns a Promise, resolved when everything is loaded.
 */
async function loadConsole() : Promise<void> {
  let consolePromise = new Promise((resolve, reject) => {
    consoleImg = new Image;
    consoleImg.onload = resolve;
    consoleImg.onerror = reject;
    consoleImg.src = "imgs/console.jpg";
  });

  let powerOnPromise = new Promise((resolve, reject) => {
    powerOnImg = new Image;
    powerOnImg.onload = resolve;
    powerOnImg.onerror = reject;
    powerOnImg.src = "imgs/power-on.jpg";
  });

  let rollerPromise = initRollers();

  await rollerPromise;
  await consolePromise;
  await powerOnPromise;
}

// Initialize the console variables and handlers.
function initConsole() : void {
  canvas = <HTMLCanvasElement> document.getElementById("canvas")
  ctx = canvas.getContext('2d')

  // Linearly interpolates between x0 and x1. Assume n points in total and we select point i.
  // That is, for i=0, output x0; for i=N, output x1.
  function interp(x0: number, x1: number, n: number, i: number): number {
    return (x1 - x0) / (n - 1) * i + x0;
  }

  // Roller lights
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 36; col++) {
      let xpos = col < 18 ? col : col + 1; // Account for the gap between the two groups
      let x = interp(427, 1289, 37, xpos);
      let y = interp(780, 1067, 4, row);
      lights["roller-" + row + "-" + col] = [x, y];
    }
  }

  // Lights below, FLT, etc.
  for (let col = 0; col <= 36; col++) {
    if (col == 18) continue;
    let x = interp(427, 1289, 37, col);
    let y = 1181;
    let color;
    if (col == 1 || col == 3 || col == 17 || col == 24 || col == 26 || col == 28 || col == 30 || col == 34 || col == 36) {
      color = red;
    } else {
      color = white;
    }
    lights["flt" + col] = [x, y, color];
  }
  lights["master-chk"] = [1358, 1179, red];

  // SDR lights
  for (let col = 0; col <= 36; col++) {
    if (col == 18) continue;
    let x = interp(427, 1285, 37, col);
    let y = 1230;
    lights["sdr" + col] = [x, y];
  }

  // SDR switches
  for (let col = -1; col <= 36; col++) {
    if (col == 9 || col == 18 || col == 19 || col == 28 || col == 37) continue;
    let x = interp(427, 1285, 37, col);
    let y = 1292;
    regions.push([x - 5, y - 25, x + 5, y + 25, "switch-sdr-" + col]);
  }

  // Instruction address register lights
  for (let col = 9; col <= 36; col++) {
    if (col == 18) continue;
    if (col == 37 || col == 38 || col == 39) continue;
    let x = interp(427, 1285, 37, col);
    let y = 1359
    lights["iar-" + col] = [x, y];
  }

  // IAR switches
  for (let col = 10; col <= 36; col++) {
    if (col == 18 || col == 19 || col == 28 || col == 37) continue;
    let x = interp(427, 1285, 37, col);
    let y = 1424;
    regions.push([x - 5, y - 25, x + 5, y + 25, "switch-iar-" + col]);
  }

  // IPL lights
  for (let col = 0; col <= 4; col++) {
    let x = interp(1203, 1301, 5, col);
    let y = 1830;
    const color = [white, white, red, red, white][col];
    lights["ipl-" + col] = [x, y, color];
  }

  /**
   * Updates pointer when over a clickable region.
   */
  $("#canvas").on("mousemove", function(e) {
    const result = testLocation(e);
    if (result) {
      $("#label").html(result);
      $('#canvas').css('cursor', 'pointer');
    } else {
      $("#label").html("");
      $('#canvas').css('cursor', 'default');
    }
  });
  $(window).resize(resize); // resize handle
  // Block canvas touches from dragging the whole page.
  $("#canvas").bind("touchstart", function(e) {
    if (cameraZoom != MIN_ZOOM) { // Allow dragging at first, so users don't get stuck.
      handleTouch(e, onPointerDown);
      e.preventDefault();
    }
  });
  $("#canvas").bind("touchend", function(e) {
    e.touches = e.changedTouches; // Make a fake mouse event out of this
    if (e.changedTouches.length > 0) {
      // @ts-ignore
      e.clientX = e.changedTouches[0].clientX;
      // @ts-ignore
      e.clientY = e.changedTouches[0].clientY;
    }
    handleTouch(e, onPointerUp);
  });
}

/**
 * Returns the unscaled [x, y] coordinates for the event.
 * Uses global imatrix, the inverted transformation matrix.
 */
function coords(e: JQuery.Event) : [number, number] {
  const rect = $("#canvas")[0].getBoundingClientRect();
  const xscaled = (e.clientX - rect.left) * SCALE;
  const yscaled = (e.clientY - rect.top) * SCALE;
  const x = xscaled * imatrix.a + yscaled * imatrix.c + imatrix.e;
  const y = xscaled * imatrix.b + yscaled * imatrix.d + imatrix.f;
  // Convert from coordinates with 0 in screen center to coordinates relative to the image
  return [Math.round((x + consoleImg.width / 2) / SCALE), Math.round((y + consoleImg.height / 2) / SCALE)];
}

/**
 * Tests if the event e is inside a region.
 * Returns the region or undefined.
 */
function testLocation(e: JQuery.Event): (string | undefined) {
  // Need to translate mouse position from scaled coordinates to original coordinates
  const [x, y] = coords(e);
  for (let i = 0; i < regions.length; i++) {
    if (x > regions[i][0] && y > regions[i][1] && x < regions[i][2] && y < regions[i][3]) {
      return <string>regions[i][4];
    }
  }
  return undefined;
}

// Called on click without drag
// Need to distinguish dragging the image from clicking on it.
function clicked(e: JQuery.Event) : void {
  const result = testLocation(e);
  if (result) {
    const parts = result.split("-");
    if (parts[0] == "roller") {
      updateRoller(parseInt(parts[1], 10));
    } else if (parts[0] == "dial" && parts[1] == "load") {
      updateLoadDial(parseInt(parts[2], 10));
    } else if (result == "button-load") {
      ipl();
      displayState(state);
      consoleDraw();
    } else if (result == "button-system-reset") {
      // Reset to run some code. Not the true reset action, but for demo.
      resetStateCode(state);
      displayState(state);
      consoleDraw();
    } else if (result == "button-start") {
      startAnimate();
    } else if (result == "button-power-on") {
      if (powerOff) {
        resetStateCode(state);
        displayState(state);
        consoleDraw();
        powerOff = false;
      }
      consoleDraw();
    } else if (result == "epo" || result == "button-power-off") {
      stopAnimate();
      powerOff = true;
      consoleDraw();
    } else if (result == "button-stop") {
      stopAnimate();
    } else if (result == "toggle-lamp-test") {
      lampTest = !lampTest;
      consoleDraw();
    }
  }
  if (lampTest && result != "toggle-lamp-test") {
    lampTest = false; // Clear lamp test if anything clicked. (real behavior is spring-loaded).
    consoleDraw();
  }
}

// Initial Program Load
function ipl() {
  stopAnimate();
  // Should select program based on dialPos values.
  // Should turn off manual light, turn on load light. If load is successful, turn off load light and start CPU. (Principles of Operation p118)
  // We'll just reset and start up for now.
  resetStateIPL(state);
  startAnimate();
}

function updateRoller(n: number) : void {
  rollerPos[n - 1] = (rollerPos[n - 1] % 8) + 1; // increment value 1-8, wrapping 8 to 1.
  draw();
}

function drawLoadingMessage() {
  canvas = <HTMLCanvasElement> document.getElementById("canvas")
  ctx = canvas.getContext('2d')
  ctx.fillStyle = "#666";
  ctx.font = 'bold 24px serif';
  ctx.fillText("Loading...", 100, 100);
}
