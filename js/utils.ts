// Share utility functions

var log = function(x) {} // Logging function


const ramSize = 8192; // 8K of RAM

function initState(state: {[key: string]: any}): void {
  // Initialize state variables
  Object.assign(state, {'FN': 0, 'J': 0, 'LSAR': 0,
    'SYSMASK': 0, 'KEY': 0, 'AMWP': 0, 'IRUPT': 0, 'ILC': 0, 'CC': 0, 'PROGMASK': 0, 'IAR': 0, // PSW
    'L': 0, 'R': 0, 'MD': 0, 'F': 0, 'Q': 0,
    'M': 0, 'H': 0, 'T': 0,
    'A': 0, 'D': 0, 'XG': 0, 'Y': 0, 'U': 0, 'V': 0, 'W': 0,
    'G1': 0, 'G2': 0, 'LB': 0, 'MB': 0, 'SP': 0,
    'WFN': 2, // Set up at QK801:0988 during IPL
    'SAR': 0, 'SDR': 0,
    'ROAR': 0, 'PREVROAR': 0, 'PREV2ROAR': 0, 'BS': [0, 0, 0, 0],
    'LSGNS': 0, 'RSGNS': 0, 'CR': 0,
    'KEYS': {},
    'CAR': 0,
    'CSTAT': 0,
    'ROS': 0,
    'IAS': 0, // Invalid address stat
    'ES': [0, 0, 0], // Edit stats
  });
  state['LS'] = new Array(64);
  for (var i = 0; i < 64; i++) {
    state['LS'][i] = 0;
  }
  state['MS'] = new Array(8192).fill(0); // Words
  state['S'] = new Array(8).fill(0); // Words
}

// Convert string to hex roar address string
function fmtAddress(d: number): string {
  return d.toString(16).padStart(4, '0').toLowerCase();
}

// Format d as a bit
function fmtB(d: number): string {
  return d.toString(2);
}

// Format d as a hex nybble
function fmtN(d: number): string {
  return d.toString(16);
}

// Format d as 1 hex byte
function fmt1(d : number): string {
  return d.toString(16).padStart(2, '0');
}

// Format d as 2 hex bytes
function fmt2(d: number): string {
  return d.toString(16).padStart(4, '0');
}

// Format d as 3 hex bytes
function fmt3(d: number): string {
  return d.toString(16).padStart(6, '0');
}

// Format d as 4 hex bytes
function fmt4(d: number): string {
  return d.toString(16).padStart(8, '0');
}

// Gets a displayable representation of the micro-op
// Returns a graphical block representation of the micro-op, and a textual description of the micro-op.
function getMicroOpData(saddr: string): string[] {
    const microcode : [string[], string[]] = decode(saddr, data[saddr]);
     // Get the text description for the current ALD sheet
    let desc = "";
    const sheet = data[saddr]['sheet'];
      if (sheet) {
      const text = aldText[sheet];
      if (text) {
        desc = text.join('<br/>');
      }
    }
    // Hack to reformat the lines so they appear okay on Android
    function fmt(uc : string[]) : string {
        for (let i = 0; i < uc.length; i++) {
          if (uc[i].slice(-1) == '|') {
            uc[i] = '<div class="box">' + uc[i].substr(0, uc[i].length - 1) + '</div>|\n<br/>';
          } else {
            uc[i] = '<div class="box">' + uc[i] + '</div>\n<br/>';
          }
        }
        return '<div class="boxwrapper">' + uc.join('\n') + '</div>';
    }
    return [fmt(microcode[0]) + desc, microcode[1].join('<br/>')];
}
