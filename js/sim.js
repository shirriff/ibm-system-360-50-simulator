var data = undefined;
var div = undefined;
var div2 = undefined;

$(document).ready(function() {
  can = $("#can")[0];
  ctx = can.getContext('2d');
  div = $("#div")[0];
  div2 = $("#div2")[0];
  div.innerHTML = '---loading---';

  // Load data and then start up
  $.getJSON("data.json", function(indata) {
    data = indata;
    div.innerHTML = '';

    // Actions
    $("#step").click(function(e) {
      stopAnimate();
      step();
    });
    $("#control").click(function(e) {
      if ($("#control").text() == 'Stop') {
        stopAnimate();
      } else {
        startAnimate();
      }
    });

    init();
  }).fail(function() { alert('fail');});
});

function init() {
  addr = 0x0240; // IPL
  $("#LS0").html("00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff");
  $("#LS1").html("00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff");
  $("#LS2").html("00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff");
  $("#LS3").html("00 11 22 <span class='hilite'>33</span> 44 55 66 77 88 99 aa bb cc dd ee ff");
  state = getInitialState();
  displayState(state);
  step();
}

function stopAnimate() {
  running = 0;
  $("#control").text('Run');
}

function startAnimate() {
  $("#control").text('Stop');
  running = 1;
  then = 0;
  animate();
}

// Positing dst xoff pixels right of src
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
  if (elapsed > 500) {
    then = now;
    step();
  }
}

function step() {
    var addr = state['ROAR'];
    var entry = data[addr];
    cycle(state, entry);
    displayState(state);

    var hexaddr = addr.toString(16).padStart(4, '0').toLowerCase();
    var result = decode(hexaddr.toString(16), data[hexaddr]);
    div2.innerHTML = result.join('\n');
}

function getInitialState() {
  var state = {'FN': 3, 'J': 3, 'lSAR': 3, 'PSW': 3, 'L': 3, 'R': 3, 'MD': 3, 'F': 3, 'Q': 3,
  'M': 3, 'H': 3, 'T': 3,
  'A': 3, 'IA': 3, 'D': 3, 'XG': 3, 'Y': 3, 'U': 3, 'V': 3, 'W': 3,
  'G1': 3, 'G2': 3, 'LB': 3, 'MB': 3, 'ROAR': 0x240};
  state['LS'] = new Array(64).fill(0x42);
  }
  state['MS'] = new Array(8192).fill(0); // Words
  state['S'] = new Array(8).fill(0); // Words
  return state;
}

// Format d as a hex nybble
function fmtN(d) {
  return d.toString(16);
}

// Format d as 1 hex byte
function fmt1(d) {
  return d.toString(16).padStart(2, '0');
}

// Format d as 2 hex bytes
function fmt2(d) {
  return d.toString(16).padStart(4, '0');
}

// Format d as 4 hex bytes
function fmt4(d) {
  return d.toString(16).padStart(8, '0');
}

// Fmt d as PSW
function fmtPsw(d) {
  var smask = (d >> 32) & 0xff;
  var key = (d >> 28) & 0xf;
  var amwp = (d >> 24) & 0xf;
  var ilc = (d >> 6) & 0x3;
  var cc = (d >> 4) & 0x3;
  var pmask = d & 0xf;
  var psw = smask.toString(16).padStart(2, '0') + ' ' +
      key.toString(16) + ' ' +
      amwp.toString(16) + ' ' +
      ilc.toString(16) + ' ' +
      cc.toString(16) + ' ' +
      pmask.toString(16);
  console.log("PSW: " + psw);
  return psw;
}

formatters = {
  'FN': fmtN,
 'J': fmtN,
 'lSAR': fmt1,
 'PSW': fmtPsw,
 'L': fmt4,
 'R': fmt4,
 'MD': fmtN,
 'F': fmtN,
 'Q': fmtN,
 'M': fmt4,
 'H': fmt4,
 'T': fmt4,
 'A': fmt4,
 'IA': fmt4,
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
};

function displayState(state) {
  var keys = Object.keys(state);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key == 'MS') {
      // Main storage
    } else if (key == 'LS') {
      // Local storage
      for (var ls = 0; ls < 4; ls++) {
        var line = state['LS'].slice(ls * 16, (ls + 1) * 16).map(x => x.toString(16).padStart(8, '0')).join(' ');
        $("#LS" + ls).html(line);
        console.log("#LS" + ls + " " + line);
      }
    } else if (key == 'S') {
      var line = state['S'].join(' ');
      $("#S").html(line);
      console.log("#S" + " " + line);
    } else {
      $("#" + key).html(formatters[key](state[key]));
      console.log("#" + key + " " + state[key]);
    }
  }
}

// Run one cycle of the specified phase
// phase is clock phase 0 or 1 (arbitrary clock, not real IBM clock).
// entry is the ROS entry being executed
// state is the processor state
function cycle(state, phase, entry) {
   
}
