// This is the top-level code for the simulator. 
// It manages the overall running and control, as well as the information sidebar.

const FRAME_RATE = 200; // milliseconds
var running: boolean = false;
var skipping: boolean;
var state: {[key: string]: any} = {};
var then: number; // Time value
var memactive: boolean = false;
var speed: number;
var seenInstructions: {[key: string]: number};
var lsHilitePos: number = -1; // Highlights the selected LSAR word.
var lsHiliteColor: string = ""; // Specifies the color for the LSAR highlight (to indicate read vs write).
var coreHiliteAddr: number = -1; // Highlights the selected core word.
var coreHiliteColor: string = ""; // Specifies the color for the core highlight (to indicate read vs write).

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
          resolve(0);
    }).fail(reject);
  });

  // Fetch the ALD data, store in aldText.
  let aldPromise = new Promise((resolve, reject) => {
      $.getJSON("aldText.json", function (indata) {
          aldText = indata;
          resolve(0);
    }).fail(reject);
  });

  // Fetch the console images
  let consolePromise = loadConsole();

  // Continue when everything is loaded
  Promise.all([dataPromise, aldPromise, consolePromise]).then(() => {
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
    // Memory info
    $("#coreinfoopen").on("click", function (e) {
      if ($("#coreviewer").is(":visible")) {
        $("#coreinfoopen").text("expand");
        $("#coreviewer").hide();
      } else {
        $("#coreinfoopen").text("unfold_less");
        $("#coreviewer").show();
        updateCoreInfo();
      }
    });
    $("#coreaddr").on("change", function (e) {
        updateCoreInfo();
    });
    count = 0;
    speed = FRAME_RATE; // ms
    skipping = false;
    seenInstructions = {};
    state = {};
    resetStateCode(state);
    displayState(state);
    initZoom();
    initConsole();
    resize();
    stopAnimate();
}

function updateCoreInfo(): void {
  if (!$("#coreviewer").is(":visible")) {
    return;
  }
  const saddr: string = String($("#coreaddr").val());
  let addr: number = parseInt(saddr, 16) & ~3; // Word-aligned
  const lines: string[] = []
  let line: string = "";
  for (let row = 0; row < 8; row++) {
    line = '<span style="font-weight: 600">' + fmt3(addr) + '</span> ';
    for (let col = 0; col < 4; col++) {
      let style = "";
      if (addr == coreHiliteAddr) {
        style = ' style="background:' + coreHiliteColor + '"'
      }
      line += '<span' + style + '>' + fmt4(state['MS'][addr]) + '</span> ';
      addr += 4; // 4 bytes
    }
    line += '<br/>';
    lines.push(line);
  }
  $("#coredata").html(lines.join('\n'));
  coreHiliteAddr = -1; // Clear the highlight on the next cycle
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

function waitAnimate(): void {
    running = false;
    systemLight = false;
    manualLight = false;
    waitLight = true;
    skipping = false;
    $("#control").text('Run');
    $("#divinstr").text("Halted");
    draw();
}

function startAnimate(): void {
    if (waitLight) {
      resetStateCode(state); // Program done, so restart from beginning
    }
    $("#control").text('Stop');
    powerOff = false;
    running = true;
    systemLight = true;
    manualLight = false;
    waitLight = false;
    then = 0;
    animate(0);
}

function animate(time: DOMHighResTimeStamp): void{
    if (!running) {
        return;
    }
    requestAnimationFrame(animate);
    var now = time;
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
                    speed = FRAME_RATE;
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
    var msg1 = cycle(state, data[saddr]);
    var msg2 = doio(state, data[saddr]);
    draw();
    displayMicroOp(saddr);
    displayState(state);
    updateCoreInfo();
    if ($("#coreviewer").is(":visible")) {
      // Display an update instead of the memory itself.
      $("#divmsg").html(msg1 || msg2 || '');
    }
    if ([0x148, 0x149, 0x14a, 0x14c, 0x14e, 0x184, 0x185, 0x187, 0x188, 0x189, 0x19b].includes(state['ROAR'])) {
        // Lots of entries to instruction decoding.
        var iar = state['IAR'];
        $("#divinstr").html(disasm([getHW(state, iar), getHW(state, iar + 2), getHW(state, iar + 4)]));
        $;
    }
    if (memactive) {
        mem();
    }
    if (state['AMWP'] & 2) {
      // Wait bit set
      waitAnimate();
    }
}

// Displays the formatted micro-instruction
function displayMicroOp(saddr: string): void {
    const microHtml = getMicroOpData(saddr);
    $("#microcodeModalBody").html(microHtml[1]);
    $("#microinfo").show();
    $("#microcode").html(microHtml[0]);
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
    initState(state);
    const addr = initCode(state['MS']); // Load memory with instructions, get address for branch
    state['SAR'] = addr;
    state['R'] = addr;
    state['S'] = [0, 0, 0, 0, 0, 0, 0, 0]; // S3 = address bit 30 (alignment?)
    state['ROAR'] = 0x102; // QT120: branch to address
    return state;
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
    'IAR': fmt4,
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
    'SAR': fmt3,
    'BS': fmtN,
    'WFN': fmtN,
    'CR': fmtN,
    'S': fmtN,
    'SDR': fmt4,
    'ES': fmtN,
};

const tooltips: {[key: string]: string} = {
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
    'IAR': 'Instruction address register',
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
    'ES': 'Edit stats',
};

// Labels for the local storage assignments
const LSlabels: string[] = [
    "Channel 1 - command addr", "Channel 1 - data addr", "Channel 1 - unit addr count", "Channel 1 - data buffer A",
    "Channel 2 - command addr", "Channel 2 - data addr", "Channel 2 - unit addr count", "Channel 2 - data buffer A",
    "Channel 3 - command addr", "Channel 3 - data addr", "Channel 3 - unit addr count", "Channel 3 - data buffer A",
    "MPX channel - command addr", "MPX channel - data addr", "MPX channel - count", "MPX channel - unit addr",
    "Working storage 0", "Working storage 1", "Working storage 2", "Working storage 3",
    "Working storage 4", "Working storage 5", "Working storage 6", "PSW backup (bits 0-15)",
    "Working storage 8", "Working storage 9", "Working storage 10", "Working storage 11",
    "Working storage 12", "Working storage 13", "Instruction buffer", "Working storage 15",
    "Floating-point register 0 - high order", "Floating-point register 0 - low order", "Floating-point register 2 - high order", "Floating-point register 2 - low order",
    "Floating-point register 4 - high order", "Floating-point register 4 - low order", "Floating-point register 6 - high order", "Floating-point register 6 - low order",
    "Spare", "Spare", "Spare", "Spare",
    "R register break-in buffer", "MPX channel L-register buffer", "MPX channel interrupt buffer", "MPX channel working storage",
    "General register 0", "General register 1", "General register 2", "General register 3", 
    "General register 4", "General register 5", "General register 6", "General register 7", 
    "General register 8", "General register 9", "General register 10", "General register 11", 
    "General register 12", "General register 13", "General register 14", "General register 15" 
];

function displayState(state) {
    displayMicroOp(fmt2(state['ROAR']));
    var keys = Object.keys(state);
    keys.push('PSW'); // PSW isn't stored as an explicit key in state, but a collection of stuff.
    keys = keys.sort();
    var misc: string[] = [];
    var raw: string[] = [];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key == 'PSW') {
            // Display PSW only as tooltip. The PSW state is stored in several state variables, so it needs to be assembled.
            const psw = 'smask:' + state['SYSMASK'].toString(16).padStart(2, '0') +
                ', key:' + state['KEY'].toString(16) +
                ', amwp:' + state['AMWP'].toString(2).padStart(4, '0') +
                ', ilc:' + state['ILC'].toString(16) +
                ', cc:' + state['CC'].toString(2).padStart(2, '0') +
                ', pmask:' + state['PROGMASK'].toString(16) +
                ', ia:' + fmt3(state['IAR']);
            misc.push('<span class="hastip" data-toggle="tooltip" title="' + psw + '">' + key + '</span>');
            raw.push(key + ':' + psw);
            continue;
        }
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
                let style = "";
                if (col + row * COLS == lsHilitePos) {
                  style = ' style="background:' + lsHiliteColor + '"'
                }
                lineEntries.push('<span class="hastip" data-toggle="tooltip" title="' + LSlabels[idx]+ '"' + style + '>' + fmt4(state['LS'][idx]) + '</span>');
                idx++;
              }
              lines.push(lineEntries.join(' '));
            }
            $("#LS").html(lines.join('</br>'));
        } else if (key in formatters) {
            misc.push('<span class="hastip" data-toggle="tooltip" title="' + tooltips[key] + '">' + key + ':&nbsp' + formatters[key](state[key]) + '</span>');
            raw.push(key+':' + formatters[key](state[key]));
        }
        else {
            // console.log("No formatter for " + key);
        }
    }
    $("#registers").html(misc.join(', '));
    log(raw.join(', '))
}
