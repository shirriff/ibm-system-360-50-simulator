let set = 0;
var canvasWidth = 0, canvasHeight = 0;
var imgWidth = 0, imgHeight = 0;
// Resize isn't really working
function resize() {
  canvasHeight = window.innerHeight - $("#nav").height();
  canvasWidth = window.innerWidth - $("#sidebar").width();
  canvas.style.width = canvasWidth + "px";
  canvas.style.height = canvasHeight + "px";
  console.log(canvasHeight, canvasWidth, canvas.style.width, canvas.style.height);
  draw();
}


let imatrix = null; // Inverted transformation matrix.

/**
 * Draws the display.
 * This is called after the zoom windowhas been configured correctly.
 */
function drawInt() {
  // Clear
  console.log('drawInt');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  // window is centered on 0, 0. Translate to center image.
  ctx.translate(-imgWidth / 2, -imgHeight / 2);
  var matrix = ctx.getTransform();
  imatrix = matrix.invertSelf(); // Remember inverted transformation matrix.
  ctx.drawImage(img, 0, 0);
  // Draw rollers in their current positions. Each roller is drawn in two parts
  for (let r = 0; r < 4; r++) {
    ctx.drawImage(rollerImgs[2 * r][rollerPos[r] - 1], 393, interp(723, 1008, 4, r), 454, 24);
    ctx.drawImage(rollerImgs[2 * r + 1][rollerPos[r] - 1], 868, interp(723, 1008, 4, r), 454, 24);
  }
  ctx.fillStyle = "yellow";
}

/**
 * Returns the unscaled [x, y] coordinates for the event.
 * Uses global imatrix, the inverted transformation matrix.
 */
function coords(e) {
  const rect = $("#canvas")[0].getBoundingClientRect();
  const xscaled = e.clientX - rect.left;
  const yscaled = e.clientY - rect.top;
  const x = xscaled * imatrix.a + yscaled * imatrix.c + imatrix.e;
  const y = xscaled * imatrix.b + yscaled * imatrix.d + imatrix.f;
  return [Math.round(x), Math.round(y)];
}

const regions: [number, number, number, number, string][] = [
  [214,525,228,556, "switch-dcoff"],
  [334,541,374,581, "dial-voltage"],
  [511,282,538,310,"dial-6tc"],
  [631,284,660,317,"dial-12ros2"],
  [764,286,795,310,"dial-56xy1"],
  [507,375,533,401,"dial-6var"],
  [642,397,669,437,"dial-margin"],
  [764,372,788,404,"dial-60z1"],
  [509,477,536,499,"dial-6m2"],
  [766,472,793,499,"dial-56xy2"],
  [509,570,538,601, "dial-6ma"],
  [633,576,664,603, "dial-12ros1"],
  [768,572,797,599, "dial-60z2"],

  [899,277,955,324, "dial-storagetest"],
  [1012,288,1032,328, "sw-storagetest-write"],
  [1061,284,1083,335, "sw-storagetest-stop-on-check"],
  [1105,284,1130,333, "sw-storagetest-invert"],
  [1154,282,1176,333, "sw-storagetest-isolate"],

  [1287,235,1360,295,"epo"],

  [902,468,939,503,"dial-56xy3"],
  [1125,470,1170,503,"dial-56xy4"],
  [895,565,935,599, "dial-60z3"],
  [1010,499,1048,539, "dial-storage-margin"],
  [1125,574,1172,607, "dial-60z4"],

  [154,740,205,774,"button-channel-enter"],
  [261,734,276,778,"sw-channel-op"],
  [194,836,234,869,"dial-channel-display"],


  [403, 730, 1467, 760, "roller-1"],
  [403, 822, 1467, 860, "roller-2"],
  [403, 913, 1467, 950, "roller-3"],
  [403, 1009, 1467, 1046, "roller-4"],

  [476,1403,520,1450,"dial-storage-select"],

  [407,1267,411,1318,"toggle"],

  [669,1578,713,1622,"dial-flt-control"],
  [856,1578,901,1618,"dial-check-control"],
  [669,1707,709,1743,"dial-rate"],
  [667,1808,713,1846,"button-start"],
  [794,1678,842,1713,"button-system-reset"],
  [856,1678,901,1713,"button-psw-restart"],
  [915,1678,963,1713,"button-check-reset"],
  [794,1741,842,1775,"button-set-io"],
  [856,1741,901,1775,"button-store"],
  [915,1741,963,1775,"button-display"],
  [794,1808,842,1844,"button-stop"],
  // [856,1808,901,1844,"button-white"],
  [915,1808,963,1844,"button-log-out"],

  [1099,1583,1156,1630,"button-power-on"],
  [1303,1585,1363,1623,"button-power-off"],
  [1110,1692,1156,1734,"dial-load-1"],
  [1212,1692,1258,1734,"dial-load-2"],
  [1307,1694,1356,1734,"dial-load-3"],
  [1108,1809,1163,1842,"button-interrupt"],
  [1312,1811,1369,1847,"button-load"],
];

const lights : { [name: string]: [number, number]} = {};

let rollerImgs = [];
/**
 * Loads all the roller images: 8 positions for 8 half-rollers.
 * The images are stored in rollerImgs.
 */
function initRollers() {
  for (let roller = 1; roller <= 8; roller++) {
    let imgs = [];
    for (let pos = 1; pos <= 8; pos++) {
      let img = new Image;
      img.src = "imgs/roller-" + roller + "-" + pos + ".jpg";
      imgs.push(img);
    }
    rollerImgs.push(imgs);
  }
}

// Linearly interpolates between x0 and x1. Assume n points in total and we select point i.
// That is, for i=0, output x0; for i=N, output x1.
function interp(x0: number, x1: number, n: number, i: number) {
  return (x1 - x0) / (n - 1) * i + x0;
}

/**
 * Configures the lights and switch positions.
 */
function initUI() {
  initRollers();
  ctx.fillStyle = "green";

  // Roller lights
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col <= 36; col++) {
      if (col == 18) continue;
      let x = (1282-427) / 36 * col + 427;
      let y = (1069 - 782) / 3 * row + 782;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      lights["roller-" + row + "-" + col] = [x, y];
    }
  }

  // Lights below
  ctx.fillStyle = "yellow";
  for (let i = 0; i < 2; i++) {
    for (let col = 0; col <= 39; col++) {
      if (col == 18) continue;
      if (col == 37 || col == 38 || (col == 39 && i == 1)) continue;
      let x = (1282-427) / 36 * col + 427;
      let y = [1181, 1230][i];
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      const name = ["lights", "sdr"][i];
      lights[name  + col] = [x, y];
    }
  }

  // Linearly interpolates between x0 and x1. Assume n points in total and we select point i.
  // That is, for i=0, output x0; for i=N, output x1.
  function interp(x0, x1, n, i) {
    return (x1 - x0) / (n - 1) * i + x0;
  }

  // SDR switches
  ctx.fillStyle = "red";
  for (let col = -1; col <= 36; col++) {
    if (col == 9 || col == 18 || col == 19 || col == 28 || col == 37) continue;
    let x = interp(427, 1282, 37, col);
    let y = 1293;
    regions.push([x - 5, y - 25, x + 5, y + 25, "switch-sdr-" + col]);
  }

  // Instruction address register lights
  ctx.fillStyle = "red";
  for (let col = 9; col <= 36; col++) {
    if (col == 18) continue;
    if (col == 37 || col == 38 || col == 39) continue;
    let x = interp(427, 1282, 37, col);
    let y = 1359
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    lights["iar-"  + col] = [x, y];
  }

  // IAR switches
  for (let col = 10; col <= 36; col++) {
    if (col == 18 || col == 19 || col == 28 || col == 37) continue;
    let x = interp(427, 1282, 37, col);
    let y = 1424;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    regions.push([x - 5, y - 25, x + 5, y + 25, "switch-iar-" + col]);
  }

  // IPL lights
  for (let col = 0; col <= 4; col++) {
    let x = interp(1197, 1294, 5, col);
    let y = 1819;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    lights["ipl-"  + col] = [x, y];
  }

  // Misc toggles
  for (let col = 0; col < 10; col++) {
    let x = interp(135, 567, 10, col);
    let y = 1598;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Tests if the event e is inside a region.
 * Returns the region or undefined.
 */
function testLocation(e) : (string | undefined) {
  // Need to translate mouse position from scaled coordinates to original coordinates
  const [x, y] = coords(e);
  for (let i = 0; i < regions.length; i++) {
    if (x > regions[i][0] && y > regions[i][1] && x < regions[i][2] && y < regions[i][3]) {
      return <string> regions[i][4];
    }
  }
  return undefined;
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

// Called on click without drag
// Need to distinguish dragging the image from clicking on it.
function clicked(e) {
  const result = testLocation(e);
  if (result) {
    const parts = result.split("-");
    if (parts[0] == "roller") {
      updateRoller(parseInt(parts[1], 10));
    }
  }
}

let rollerPos = [1, 1, 1, 1]; // Positions of the four rollers

function updateRoller(n: number) {
  rollerPos[n - 1] = (rollerPos[n - 1] % 8 ) + 1; // increment value 1-8, wrapping 8 to 1.
  draw();
}


let img = undefined; // The image of the console
$(document).ready(function() {
  img = new Image;
  img.addEventListener("load", function() {
    imgWidth = img.width;
    imgHeight = img.height;
    draw();
  });
  img.src = "imgs/console.jpg";
  initUI();
  initZoom();
});

var data = undefined;
var div = undefined;
var divop1 = undefined;
var running = 0;
var skipping;
var state = {};
var then;
var memactive;
var divop1, divop2;
var speed;
var seenInstructions;
// Override alert so simulator will stop if an error is hit.
// https://stackoverflow.com/questions/1729501/javascript-overriding-alert
(function (proxied) {
    window.alert = function () {
        running = 0; // Stop the simulator
        console.log('stopping');
        return proxied.apply(this, arguments);
    };
})(window.alert);
// Catch exceptions
window.onerror = function err(errMsg, url, lineNumber) {
    alert(errMsg + ' at ' + url + ' ' + lineNumber);
};
$(document).ready(function () {
    var can = $("#can")[0];
    var ctx = (<HTMLCanvasElement> can).getContext('2d');
    var div = $("#div")[0];
    divop1 = $("#divop1")[0];
    divop2 = $("#divop2")[0];
    div.innerHTML = '---loading---';
    memactive = false;
    // Load data and then start up
    $.getJSON("data.json", function (indata) {
        data = indata;
        div.innerHTML = '';
        // Actions
        $("#mem").click(function (e) {
            mem();
        });
        $("#step").click(function (e) {
            stopAnimate();
            step();
        });
        $("#skip").click(function (e) {
            stopAnimate();
            skip();
        });
        $("#control").click(function (e) {
            if ($("#control").text() == 'Stop') {
                stopAnimate();
            }
            else {
                startAnimate();
            }
        });
        $("#addr").keypress(function (e) {
            if (e.which == 13) {
                step();
            }
        });
        init();
    }).fail(function () { alert('fail'); });
});
function mem() {
    memactive = true;
    var result = [];
    var line = [];
    for (var i = 0; i < 1024 + 64; i += 4) {
        if (i == 64) {
            result.push('');
            i = 1024;
        }
        if (line.length == 0) {
            line.push(fmt4(i) + ': ');
        }
        line.push(fmt4(state['MS'][i]));
        if ((line.length % 8) == 1) {
            result.push(line.join(' '));
            line = [];
        }
    }
    $('#divmem').html(result.join('\n'));
}
function init() {
    count = 0;
    speed = 500; // ms
    skipping = 0;
    stopAnimate();
    seenInstructions = {};
    state = createState();
    resetState(state);
    displayOp(getAddrFromField(), divop1);
    displayState(state);
}
function stopAnimate() {
    running = 0;
    skipping = 0;
    $("#control").text('Run');
}
function startAnimate() {
    $("#control").text('Stop');
    running = 1;
    then = 0;
    animate();
}
// Positioning dst xoff pixels right of src
function posx(src, dst, xoff) {
    $(dst).css("top", $(src).css("top"));
    $(dst).css("left", $(src).css("left"));
    $(dst).css("left", "+=" + xoff);
}
function posy(src, dst, xoff) {
    $(dst).css("top", $(src).css("top"));
    $(dst).css("top", "+=" + xoff);
}
function animate() {
    if (!running) {
        return;
    }
    requestAnimationFrame(animate);
    var now = Date.now();
    var elapsed = now - then;
    if (elapsed < speed) {
        return;
    }
    // Do the frame(s)
    then = now;
    var count = skipping ? 100 : 1;
    for (var i = 0; i < count && running; i++) {
        step();
        if (skipping) {
            var breakpoint_s = $("#breakpoint").val();
            if (typeof breakpoint_s === "string") {
              var breakpoint = parseInt(breakpoint_s, 10);
              if ((breakpoint && state['ROAR'] == breakpoint) ||
                  (!breakpoint && !(state['ROAR'] in seenInstructions))) {
                  skipping = 0;
                  speed = 500;
                  stopAnimate();
                  return;
              }
            }
        }
    }
}
// Return the addr in the addr UI field as a string. Also reformats field.
function getAddrFromField() {
    const addr = $("#addr").val();
    if (typeof addr === "string") {
        var iaddr = parseInt(addr, 16);
        var saddr = fmtAddress(iaddr);
        $("#addr").val(saddr);
        return saddr;
    } else {
      return "";
    }
}
// Gets a halfword from memory
function getHW(state, addr) {
    if (addr & 1) {
        alert('getHW: alignment');
    }
    else if (addr & 2) {
        return state['MS'][addr & ~0x3] & 0xffff;
    }
    else {
        return state['MS'][addr] >>> 16;
    }
}
// Perform a single microinstruction step
function step() {
    var saddr = getAddrFromField();
    var iaddr = parseInt(saddr, 16);
    state['ROAR'] = iaddr;
    count += 1;
    $("#count").text(count);
    seenInstructions[iaddr] = 1;
    displayOp(saddr, divop2);
    var msg1 = cycle(state, data[saddr]);
    var msg2 = doio(state, data[saddr]);
    // Update address
    saddr = fmtAddress(state['ROAR']);
    $("#addr").val(saddr);
    displayOp(saddr, divop1);
    displayState(state);
    $("#divmsg").html(msg1 || msg2 || '');
    if ([0x148, 0x149, 0x14a, 0x14c, 0x14e, 0x184, 0x185, 0x187, 0x188, 0x189, 0x19b].includes(state['ROAR'])) {
        // Lots of entries to instruction decoding.
        var iar = state['IAR'];
        $("#divinstr").html(disasm([getHW(state, iar), getHW(state, iar + 2), getHW(state, iar + 4)]));
        $;
    }
    if (memactive) {
        mem();
    }
}
// Run at high speed until a new instruction is encountered
function skip() {
    speed = 0;
    skipping = 1;
    startAnimate();
}
// Display micro-operation with given address; put into div
function displayOp(saddr, div) {
    var result = decode(saddr, data[saddr]);
    result.pop();
    div.innerHTML = result.join('\n');
    if (div == divop2) {
        console.log(div.innerHTML);
    }
}
function resetState(state) {
    // Initialize to state after memory reset loop for IPL, entering 0243
    state['S'] = [0, 0, 0, 1, 0, 0, 0, 0]; // For IPL
    state['MD'] = 3; // For IPL
    state['H'] = 0;
    state['ROAR'] = parseInt(getAddrFromField(), 16);
    state['SAR'] = 0x10000004; // Fake bump addr, used by 243
}
// Fmt d as PSW
function fmtPsw(d) {
    var psw0 = d[0];
    var psw1 = d[1];
    var smask = (psw0 >>> 24) & 0xff;
    var key = (psw0 >>> 20) & 0xf;
    var amwp = (psw0 >>> 16) & 0xf;
    var ilc = (psw1 >>> 30) & 0x3;
    var cc = (psw1 >>> 28) & 0x3;
    var pmask = (psw1 >>> 24) & 0xf;
    var ia = psw1 & 0xffffff;
    var psw = '[smask:' + smask.toString(16).padStart(2, '0') +
        ' key:' + key.toString(16) +
        ' amwp:' + amwp.toString(16) +
        ' ilc:' + ilc.toString(16) +
        ' cc:' + cc.toString(16) +
        ' pmask:' + pmask.toString(16) +
        ' ia:' + ia.toString(16) + ']';
    return psw;
}
var formatters = {
    'FN': fmtN,
    'J': fmtN,
    'LSAR': fmt1,
    'L': fmt4,
    'R': fmt4,
    'MD': fmtN,
    'F': fmtN,
    'Q': fmtN,
    'M': fmt4,
    'H': fmt4,
    'T': fmt4,
    'A': fmt4,
    'IAR': fmt4,
    'D': fmt4,
    'XG': fmt4,
    'Y': fmt4,
    'U': fmt1,
    'V': fmt1,
    'W': fmt1,
    'G1': fmtN,
    'G2': fmtN,
    'LB': fmtN,
    'MB': fmtN,
    'ROAR': fmt2,
    'SCANCTRL': fmt1,
    'PSS': fmt1,
    'SP': fmtN,
    'WL': fmtN,
    'WR': fmtN,
    'IBFULL': fmtB,
    'SCFS': fmtB,
    'SCPS': fmtB,
    'SAR': fmt4,
    'BS': fmtN,
    'WFN': fmtN,
    'CR': fmtN,
    'SDR': fmt4,
};
function displayState(state) {
    var keys = Object.keys(state);
    keys = keys.sort();
    var misc = [];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (state[key] == undefined) {
            throw ('Undefined state ' + key);
        }
        if (typeof (state[key]) == 'number' && state[key] < 0) {
            throw ('Negative state ' + key);
        }
        if (key == 'MS') {
            // Main storage
        }
        else if (key == 'LS') {
            // Local storage
            for (var ls = 0; ls < 4; ls++) {
                var line = state['LS'].slice(ls * 16, (ls + 1) * 16).map(fmt4).join(' ');
                $("#LS" + ls).html(line);
            }
        }
        else if (key == 'S') {
            var line = state['S'].join(' ');
            $("#S").html(line);
        }
        else if (key in formatters) {
            if ($("#" + key).length) {
                $("#" + key).html(formatters[key](state[key]));
            }
            else {
                misc.push(key + ': ' + formatters[key](state[key]));
            }
        }
        else {
            // console.log("No formatter for " + key);
        }
    }
    $("#misc").html(misc.join(', '));
}
