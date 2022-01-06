// This is the top-level code for the simulator. 
// It manages the overall running and control, as well as the information sidebar.

var running: boolean = false;
var skipping: boolean;
var state: {[key: string]: any} = {};
var then: number; // Time value
var memactive: boolean = false;
var speed: number;
var seenInstructions: {[key: string]: number};
var lsHilitePos: number = -1; // Highlights the selected LSAR word.
var lsHiliteColor: string = ""; // Specifies the color for the LSAR highlight (to indicate read vs write).

// Override alert so simulator will stop if an error is hit.
// https://stackoverflow.com/questions/1729501/javascript-overriding-alert
let alerts = 0;
(function (proxied) {
    window.alert = function () {
        running = false; // Stop the simulator
        console.log('stopping');
        return proxied.apply(this, arguments);
    };
})(window.alert);
// Catch exceptions
window.onerror = function err(errMsg, url, lineNumber) {
    if (alerts++ < 3) {
        alert(errMsg + ' at ' + url + ' ' + lineNumber);
    }
};

let data: {} = undefined; // The microcode data
let aldText: {} = undefined; // Mapping from a microcode ALD sheet name (e.g. "QV220") to a textual description.

// Load images and microcode data. This is the main entry point.
function loadStuff() {
  // Fetch the microcode data, store in data.
  let dataPromise = new Promise((resolve, reject) => {
      $.getJSON("data.json", function (indata) {
          data = indata;
          console.log("loaded microcode data");
          resolve(0);
    }).fail(reject);
  });

  // Fetch the ALD data, store in aldText.
  let aldPromise = new Promise((resolve, reject) => {
      $.getJSON("aldText.json", function (indata) {
          aldText = indata;
          console.log("loaded ALD data");
          resolve(0);
    }).fail(reject);
  });

  // Fetch the console images
  let consolePromise = loadConsole();

  // Continue when everything is loaded
  Promise.all([dataPromise, aldPromise, consolePromise]).then(() => {
    console.log("loading complete");
    initialize();
  });
  // }).catch(x => alert('Initialization failed ' + x));
}

// This is the main initialization routine, after the microcode data and images are loaded.
// It sets up the handlers and the canvas and draws everything.
function initialize() {
    // Actions
    $("#mem").on("click", function (e) {
        mem();
    });
    $("#step").on("click", function (e) {
        stopAnimate();
        step();
    });
    $("#skip").on("click", function (e) {
        stopAnimate();
        skip();
    });
    $("#control").on("click", function (e) {
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
    // Close tooltip for click outside
    $(document).on("click", function(e) {
        $("#topinfotext")[0].removeAttribute('data-show');
    });
    // Close tooltip
    $("#topclose").on("click", function (e) {
        $("#topinfotext")[0].setAttribute('data-show', '');
    });
    // Microcode info tooltip
    $("#microinfo").on("click", function (e) {
        microinfo();
    });
    count = 0;
    speed = 500; // ms
    skipping = false;
    seenInstructions = {};
    state = createState();
    if (0) {
      resetStateIPL(state);
    } else {
      resetStateCode(state);
    }
    displayState(state);
    initZoom();
    initConsole();
    resize();
    stopAnimate();
}

function microinfo() {
  stopAnimate();
  ($("#microcodeModal") as any).modal('show');
}

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

function stopAnimate(): void {
    running = false;
    systemLight = false;
    manualLight = true;
    waitLight = false;
    skipping = false;
    $("#control").text('Run');
    draw();
}
function startAnimate(): void {
    $("#control").text('Stop');
    powerOff = false;
    running = true;
    systemLight = true;
    manualLight = false;
    waitLight = false;
    then = 0;
    animate();
}

function animate(): void{
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
                    skipping = false;
                    speed = 500;
                    stopAnimate();
                    return;
                }
            }
        }
    }
}

function getROARaddr(): string {
  return fmt2(state['ROAR']);
}

// Return the addr in the addr UI field as a string. Also reformats field.
// This can replace getROARaddr to get the address from #addr
function getAddrFromUIField(): string {
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
function step(): void {
    var saddr: string = getROARaddr(); // string ROAR address
    var iaddr: number = parseInt(saddr, 16); // integer ROAR address
    state['ROAR'] = iaddr;
    count += 1;
    $("#count").text(count);
    seenInstructions[iaddr] = 1;
    const microcode1 : [string[], string[]] = decode(saddr, data[saddr]);
    var msg1 = cycle(state, data[saddr]);
    var msg2 = doio(state, data[saddr]);
    draw();
    // Update address
    saddr = fmtAddress(state['ROAR']);
    $("#addr").val(saddr);
    function fmt(uc : string[]) : string {
        return '<pre style="margin-bottom:0">' + uc.join('\n') + '</pre>';
    }
    $("#microcodeModalBody").html(microcode1[1].join('<br/>'));
    $("#microinfo").show();
    // Get the text description for the current ALD sheet
    let desc = "";
    const sheet = data[saddr]['sheet'];
      if (sheet) {
      const text = aldText[sheet];
      if (text) {
        desc = text.join('<br/>');
      }
    }
    $("#microcode").html(fmt(microcode1[0]) + desc);
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
    skipping = true;
    startAnimate();
}

// Initialize to state after memory reset loop for IPL, entering 0243
function resetStateIPL(state) {
    state['S'] = [0, 0, 0, 1, 0, 0, 0, 0]; // For IPL
    state['MD'] = 3; // For IPL
    state['H'] = 0;
    state['ROAR'] = 0x0243;
    state['SAR'] = 0x10000004; // Fake bump addr, used by 243
}

// Initialize to start running code.
// Want to jump into instruction fetch, rather than lots of reset code.
function resetStateCode(state) {
    const addr = initCode(state['MS']); // Load memory with instructions, get address for branch
    state['SAR'] = addr;
    state['R'] = addr;
    state['S'] = [0, 0, 0, 0, 0, 0, 0, 0]; // S3 = address bit 30 (alignment?)
    state['ROAR'] = 0x102; // QT120: branch to address
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
const formatters = {
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

const tooltips = {
    'FN': 'Function',
    'J': " J register; local store addressing",
    'LSAR': 'Local store address register',
    'L': 'L register',
    'R': 'R register',
    'MD': 'Multiply/divide counter',
    'F': 'F bits',
    'Q': 'Q bits',
    'M': 'M byte counter',
    'H': 'H register',
    'T': 'T register',
    'A': 'A register',
    'IAR': 'Instruction address register',
    'D': 'D register',
    'XG': 'Adder XG input',
    'Y': 'Adder Y input',
    'U': 'Mover U input',
    'V': 'Mover V input',
    'W': 'Mover output',
    'G1': 'Length counter',
    'G2': 'Length counter',
    'LB': 'L register byte counter',
    'MB': 'M register byte counter',
    'ROAR': 'Read-only storage address register',
    'SCANCTRL': 'Sequence counter',
    'PSS': 'Progessive scan stat',
    'SP': 'Storage protect',
    'WL': 'Mover output (left)',
    'WR': 'Mover output (right)',
    'IBFULL': 'IB full trigger',
    'SCFS': 'Fault scan fail stat',
    'SCPS': 'Fault scan pass stat',
    'SAR': 'Storage address register',
    'BS': 'Byte stats',
    'WFN': 'Mover function',
    'CR': 'Condition register',
    'SDR': 'Storage data register',
};
function displayState(state) {
    var keys = Object.keys(state);
    keys = keys.sort();
    var misc: string[] = [];
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
            const lines: string[] = [];
            let idx = 0;
            const COLS = 16; // Number of columns for the LSAR display
            for (let row = 0; row < 64 / COLS; row++) {
              const lineEntries: string[] = [];
              for (let col = 0; col < COLS; col++) {
                if (col + row * COLS == lsHilitePos) {
                  lineEntries.push('<span style="background:' + lsHiliteColor + '">' + fmt4(state['LS'][idx]) + '</span>');
                } else {
                  lineEntries.push(fmt4(state['LS'][idx]));
                }
                idx++;
              }
              lines.push(lineEntries.join(' '));
            }
            $("#LS").html(lines.join('</br>'));
        }
        else if (key in formatters) {
            misc.push('<span class="hastip" data-toggle="tooltip" title="' + tooltips[key] + '">' + key + ':&nbsp' + formatters[key](state[key]) + '</span>');
        }
        else {
            // console.log("No formatter for " + key);
        }
    }
    $("#registers").html(misc.join(', '));
}

// Calling loadStuff starts loading the images. This is the entry point.
loadStuff();
