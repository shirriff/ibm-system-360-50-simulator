// Share utility functions

function createState(): {[key: string]: any} {
  // Initialize arbitrarily
  var state = {'FN': 0, 'J': 0, 'LSAR': 0,
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
  };
  state['LS'] = new Array(64);
  for (var i = 0; i < 64; i++) {
    state['LS'][i] = 0;
  }
  state['MS'] = new Array(8192).fill(0); // Words
  state['S'] = new Array(8).fill(0); // Words
  return state;
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

