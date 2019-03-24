var data = undefined;
var div = undefined;
var divop1 = undefined;

$(document).ready(function() {
  can = $("#can")[0];
  ctx = can.getContext('2d');
  div = $("#div")[0];
  divop1 = $("#divop1")[0];
  divop2 = $("#divop2")[0];
  div.innerHTML = '---loading---';
  memactive = false;

  // Load data and then start up
  $.getJSON("data.json", function(indata) {
    data = indata;
    div.innerHTML = '';

    // Actions
    $("#mem").click(function(e) {
      mem();
    });
    $("#step").click(function(e) {
      stopAnimate();
      step();
    });
    $("#skip").click(function(e) {
      stopAnimate();
      skip();
    });
    $("#control").click(function(e) {
      if ($("#control").text() == 'Stop') {
        stopAnimate();
      } else {
        startAnimate();
      }
    });
    $("#addr").keypress(function(e) {
      if (e.which == 13) {
        step();
      }
    });

    init();
  }).fail(function() { alert('fail');});
});

function mem() {
  memactive = true;
  var result = [];

  var line = [];
  for (var i = 0; i < 256; i += 4) {
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
  seenInstructions = {};
  state = getInitialState();
  displayOp(getAddrFromField(), divop1);
  displayState(state);
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
  var count = skipping ? 50 : 1;
  for (var i = 0; i < count; i++) {
    step();
    if (skipping && !(state['ROAR'] in seenInstructions)) {
      skipping = 0;
      speed = 500;
      console.log('done skipping');
      stopAnimate();
      return;
    }
  }
}

// Return the addr in the addr UI field as a string. Also reformats field.
function getAddrFromField() {
  var iaddr = parseInt($("#addr").val(), 16);
  var saddr = iaddr.toString(16).padStart(4, '0').toLowerCase();
  $("#addr").val(saddr);
  return saddr;
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
  saddr = state['ROAR'].toString(16).padStart(4, '0').toLowerCase();
  $("#addr").val(saddr);
  displayOp(saddr, divop1);
  displayState(state);
  $("#divmsg").html(msg1 || msg2 || '');
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
}

function getInitialState() {
  var state = {'FN': 3, 'J': 3, 'lSAR': 3, 'PSW': 3, 'L': 0xffffffff, 'R': 0xffffffff, 'MD': 3, 'F': 3, 'Q': 3,
  'M': 0xffffffff, 'H': 0xffffffff, 'T': 3,
  'A': 3, 'IA': 3, 'D': 3, 'XG': 3, 'Y': 3, 'U': 3, 'V': 3, 'W': 3,
  'G1': 3, 'G2': 3, 'LB': 3, 'MB': 3, 'SP': 5,
  'WFN': 2, // Set up at QK801:0988 during IPL
  };
  state['LS'] = new Array(64).fill(0x42);
  state['MS'] = new Array(8192).fill(0); // Words
  state['S'] = new Array(8).fill(0); // Words
  state['ROAR'] = parseInt(getAddrFromField(), 16);
  return state;
}

// Format d as a bit
function fmtB(d) {
  return d.toString(2);
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
 'ROAR': fmt2,
 'LSAR': fmt1,
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
};

function displayState(state) {
  var keys = Object.keys(state);
  keys.sort();
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (state[key] == undefined) {
      alert('Undefined state ' + key);
    }
    if (key == 'MS') {
      // Main storage
    } else if (key == 'LS') {
      // Local storage
      for (var ls = 0; ls < 4; ls++) {
        var line = state['LS'].slice(ls * 16, (ls + 1) * 16).map(fmt4).join(' ');
        $("#LS" + ls).html(line);
        console.log("#LS" + ls + " " + line);
      }
    } else if (key == 'S') {
      var line = state['S'].join(' ');
      $("#S").html(line);
      console.log("#S" + " " + line);
    } else if (key in formatters) {
      $("#" + key).html(formatters[key](state[key]));
    } else {
      console.log("No formatter for " + key);
    }
  }
}
