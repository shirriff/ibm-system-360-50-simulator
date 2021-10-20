// Share utility functions

function createState() {
  // Initialize arbitrarily
  var state = {'FN': 3, 'J': 3, 'LSAR': 3,
    'SYSMASK': 0, 'KEY': 0, 'AMWP': 0, 'IRUPT': 0, 'ILC': 0, 'CC': 0, 'PROGMASK': 0, 'IAR': 0, // PSW
    'L': 0xffffffff, 'R': 0xffffffff, 'MD': 3, 'F': 3, 'Q': 1,
    'M': 0xffffffff, 'H': 0xffffffff, 'T': 3,
    'A': 3, 'D': 3, 'XG': 3, 'Y': 3, 'U': 3, 'V': 3, 'W': 3,
    'G1': 3, 'G2': 3, 'LB': 3, 'MB': 3, 'SP': 5,
    'WFN': 2, // Set up at QK801:0988 during IPL
    'SAR': 0xffffff, 'SDR': 0xffffffff,
    'ROAR': 0xffff, 'BS': [0, 0, 0, 0],
    'LSGNS': 0, 'RSGNS': 0, 'CR': 0,
    'KEYS': {},
    'CAR': 0,
    'CSTAT': 0,
  };
  state['LS'] = new Array(64);
  for (var i = 0; i < 64; i++) {
    state['LS'][i] = 0x01010101 * i;
  }
  state['MS'] = new Array(8192).fill(0); // Words
  state['S'] = new Array(8).fill(0); // Words
  return state;
}

// Convert string to hex roar address string
function fmtAddress(d) {
  return d.toString(16).padStart(4, '0').toLowerCase();
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
function fmt1(d : number) {
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

