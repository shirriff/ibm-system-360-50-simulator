var data = undefined;
var div = undefined;
var div2 = undefined;

$(document).ready(function() {
  div = $("#div")[0];
  div2 = $("#div2")[0];
  div.innerHTML = '---loading---';
  $.getJSON("data.json", function(indata) {
    data = indata;

    div.innerHTML = '';
    $("#addr").keypress(function(e) {
      if (e.which == 13) {
        redraw($("#addr").val(), true);
      }
    });
    $("#diff2").keypress(function(e) {
      if (e.which == 13) {
        diff();
      }
    });
    search();

    redraw(window.location.hash.substr(1), false);
  }).fail(function() { alert('fail');});

  // Handle back button by going to the anchor (#foo) in the new URL
  $(window).on("popstate", function(e) {
    redraw(window.location.hash.substr(1), false);
  });

});

// Ad hoc search
function search() {
  var keys = Object.keys(data);
  keys.sort();
  for (var i = 0; i < keys.length; i++) {
    var addr = keys[i];
    var entry = data[addr];
    if (
        entry['TR'] == 8) {
      console.log("Found: " + addr);
    }
  }
}

function diff() {
  var addr1 = $("#addr").val().padStart(4, '0');
  var addr2 = $("#diff2").val().padStart(4, '0');
  $("#addr").val(addr1);
  $("#diff2").val(addr2);
  var entry1 = data[addr1];
  var entry2 = data[addr2];
  var keys1 = Object.keys(entry1);
  var keys2 = Object.keys(entry2);
  keys1.sort();
  var result = [];
  for (var i = 0; i < keys1.length; i++) {
    var key = keys1[i];
    if (entry1[key] != entry2[key]) {
      result.push(key + ': ' + entry1[key] + ' vs ' + entry2[key]);
    }
  }
  for (var i = 0; i < keys2.length; i++) {
    var key = keys2[i];
    if (!(key in entry1)) {
      result.push(key + ': ' + entry1[key] + ' vs ' + entry2[key]);
    }
  }
  div2.innerHTML = result.join('\n');
}

function redraw(addr, updateHistory) {
  if (addr == '') {
    return;
  }
  if (data == undefined) {
    alert("No data!");
  }
  var addr = addr.padStart(4, '0').toLowerCase();
  if (updateHistory) {
    history.pushState(null, null, '#' + addr);
  }
  $("#addr").val(addr);
  var entry = data[addr];
  if (!entry) {
    div.innerHTML = '--not found--';
    div2.innerHTML = '';
    return;
  }
  div.innerHTML = box(addr, entry).join('\n');
  div2.innerHTML = dump(entry).join('\n');
  dump(entry);
}

function bin(n, len) {
  return n.toString(2).padStart(len, 0);
}

// LHS of A expression
var labels = {
// Right input to adder Y
'RY': {0: '0',
1: 'R',
2: 'M',
3: 'M23', // +L becomes /L 61d?
4: 'H',
},

// True - complement control
'TC': {0: '-', 1: '+'},

// left input to adder [XG]
'LX': {0: '0',
1: 'L',
2: 'SGN',
3: 'E',
4: 'LRL', // QT220/0189
6: '4',
},

// Adder latch destination
'TR': {
0: 'T',
1: 'R',
2: 'R0',
3: 'M',
4: 'D',
5: 'L0',
6: 'R,A',
7: 'L',
8: 'HA→A', // under S
9: 'R,AN', // QT220/02bf
12: 'D→IAR', // under D
14: 'R13',
15: 'A', // QP100/614
20: 'H',
21: 'IA',
23: 'M,SP',
24: 'L,M',
25: 'MLJK', // QT220/0189
27: 'MD',
28: 'M,SP', // QT200/0193
30: 'L13', // QP206/0D95
31: 'J',
},

// Adder function
'AD': {
4: 'BCO',
5: 'BCVC',
},
/// Shift gate and adder latch control
'AL': {
4: '-SGN→',
10: 'SL1→Q',
13: 'SR1→Q',
16: 'SL4→F',
17: 'F→SL4→F',
20: 'SR4→F',
},

// B
// Mover input left side -> U
'LU': {
0: '',
1: 'MD,F', // 603
2: 'R3',
4: 'XTR',
5: 'PSW4',
6: 'LMB',
7: 'LLB', // 636
},

// Mover input right side -> V
'MV': {
0: '',
1: 'MLB',
2: 'MMB',
},

// Mover action 0-3 -> WL, -> WR
// Combined if same?
'UL': {
0: 'E', // E->WL in d29
1: 'U', // E->WR in 61b
2: 'V',
3: '?', // 636, 603
},
'UR': {
0: 'E',
1: 'U',
2: 'V', // or VR
3: '?', // 636, 603
},

// Mover output destination W ->
'WM': {
0: '',
1: 'W→MMB',
2: 'W67→MB', // W67->MB 61f
3: 'W67→LB', // QT120/0102
4: 'W27→PSW4',
5: 'W→PSW0',
6: 'WL→J',
8: 'W,E→A(BUMP)',
10: 'WR→G2',
11: 'W→G',
12: 'WM→MMB(E?)', // d29
14: 'WR→F',
15: 'WM→MD,F',
},

// D
// Counter function control
'UP': {
0: '0→',
1: '3→',
2: '-',
3: '+', // QT120/01CE
},

// Select L byte counter
'LB': {
0: '0',
1: '1', // QT220/0189
},
// Select M byte counter
'MB': {
0: '',
1: '1', // QT210/01A3
},
// Select MD counter
'MD': {
0: '',
},
// Length counter and carry insert ctrl
'DG': {
1: 'CSTAT→ADDER',
2: 'HOT1→ADDER',
5: 'G2-1',
},

// Local storage addressing
'WS': {
1: 'WS1→LSA', // QT220/01A3
2: 'WS2→LSA', // QP100/614
3: 'WS,E→LSA', // QP206/D94
4: 'FN,J→LSA',
6: 'FN,MD→LSA',
7: 'FN,MDΩ1→LSA',
// 4: 'FN,J→LSA', // QP206/D95
},

// Local storage function
'SF': {
0: 'R→LS', // QT210/1A3
2: 'LS→R→LS', 
4: 'L→LS', // QP206/D95
5: 'LS→R,L→LS',
6: 'LS→L→LS', // QP206/D94
7: '', // "08cd": ["---------- 08CD","A R→R         |","A     F→SL4→F |","D G2-1        |","L FN,MDΩ1→LSA |","L L→LS        |","C (T=0)→S3    |","R        G2=0 |","----    X* ----","Next: 08ca"],QP210/1A4
},

// Instruction address reg control
'IV': {
4: 'IA/4→A,IA',
5 : 'IA+2/4', // QT220/019B
6 : 'IA+2', // QT120/018B
7: 'IA+0/2→A', // QP206/0D94 Also IA+0+2→A: QT115/0199 
},

// Suppress memory instruction fetch / ROS address control
'ZN': {
0: '--ROAR--', // QT220/019B
1: 'SMIF',
2: 'AΩ(B=0)→A', // hypothesis
3: 'AΩ(B=1)→A',
4: '2', // QP206/0D94
6: 'BΩ(A=0)→B', // QT220/020A
7: 'BΩ(A=1)→B', // QT120/01CC
},

// C: Stat setting and misc control
'SS': {
4: 'F→SCANCTL',
8: 'E→S03', // qm11/61d
15: 'B0,1SYL', // QT220/0189
16: 'S03.¬E',
17: '(T=0)→S3',
19: 'E→BS', // QT220/019B
23: 'MANUAL→STOP', // QT200/0152
24: 'E→S47', // QP206/D94
28: 'OPPANEL→S47',
30: 'KEY→F', // QT220/020E
31: 'F→KEY', // QT220/02BF
32: '1→LSGNS',
36: 'L(0)→LSGNS',
38: 'E(13)→WFN',
39: 'E(23)→LSFN', // QT120/0102
40: 'E(23)→CR',
41: 'SETCRALG',
45: '1→REFETCH',
46: 'SYNC→OPPANEL', // QT200/0107
50: 'E(0)→IBFULL',
55: 'T→PSW,IPL→T',
56: 'T→PSW',
57: 'SCAN*E,00',
},

// ROAR values for ZN=0
'ZF': {
  6: 'M(03)',
  8: 'M(47)',

},

// Condition test (left side)
'AB': {
0: '0',
1: '1', // ?QP100/614
2: 'S0',
3: 'S1',
4: 'S2',
5: 'S3', // QT120/0102
6: 'S4', // guess
7: 'S5', // guess
8: 'S6', // QT200/0209
9: 'S7', // 0130
12: '1SYLS', // QT220/0189
13: 'LSGNS',
16: 'CRMD',
19: 'WR=0',
21: 'MB=3',
22: 'MD3=0',
29: 'R(31)', // QT120/01CC
31: 'L(0)',
34: 'TZ*BS',
36: 'PROB',
56: 'I-FETCH', // QP206/D94
58: 'EXT,CHIRPT',
60: 'PSS',
63: 'RX,S0',
},

'BB': {
0: '0',
1: '1',
2: 'S0',
3: 'S1',
4: 'S2',
5: 'S3',
6: 'S4',
7: 'S5',
8: 'S6',
9: 'S7', // QT220/020A
12: 'EXC',
13: 'WR=0',
16: 'T(0)',
20: 'LB=0',
21: 'LB=3',
22: 'MD=0',
23: 'G2=0',
28: 'IVA', // QT110/0149
30: '(CAR)',
},

};

// Generates the info box for the given entry at addr.
// Returns array of strings.
function box(addr, entry) {
  function get(label) {
    if (!(label in labels)) {
      alert('Missing label ' + label);
      return;
    }
    if (label in entry) {
      var l = labels[label][entry[label]];
      if (l == undefined) {
        return 'UNDEF_' + label + "_" + entry[label];
      } else {
        return l;
      }
    } else {
      return 'undef!!!' + label;
    }
  }

  result = [];
  result.push('---------- ' + addr.toUpperCase());
  if (entry['CE']) {
    padbox(result, 'E', bin(entry['CE'], 4));
  }

  if (entry['AL'] == 28 || entry['AL'] == 30 || entry['AL'] == 31 || entry['TR'] == 12) {
    // Handled by D
  } else if (entry['TR'] == 8) {
    // Handled by S
  } else {
    if (entry['RY'] || entry['LX'] || entry['TR']) {
      var lx = get('LX');
      if (entry['TC'] == 0 && entry['LX'] == 0) {
        lx = '1'; // -0 turns into -1 for some reason
      }
      padbox(result, 'A', (get('RY') + get('TC') + lx + '→' + get('TR')).replace('0+', '').replace('+0', '').replace('0-', '-'));
    }
    var l = undefined, r = undefined;
    if (entry['AL'] == 6) {
      // Handled by D
    } else if (entry['AL']) {
      r = get('AL');
    }
    if (entry['AD'] != 1) {
      l = get('AD');
    }
    if (l || r) {
      padbox(result, 'A', l, r);
    }
  }

  // B entry
  var lu = undefined;
  if (entry['LU']) {
    lu = get('LU') + '→U';
  }
  var lv = undefined;
  if (entry['MV']) {
    lv = get('MV') + '→V';
  }
  if (lu || lv) {
    padbox(result, 'B', lu, lv);
  }

  if ((lu || entry['UL'] != 1) && entry['UL'] == entry['UR']) {
    padbox(result, 'B', get('UL') + '→W');
  } else if (entry['UL'] != 1 || entry['UR'] != 1) {
    var ul = '      ';
    var ur = '      ';
    if (entry['UL'] != 1 || entry['UR'] == 3) {
      ul = ( get('UL') + 'L→WL').replace('EL', 'E').padEnd(6, ' ');
    }
    if (entry['UR'] != 1) {
      ur = ( get('UR') + 'R→WR').replace('ER', 'E').replace('?R', '?').padEnd(6, ' ');
    }
    result.push('B ' + ul + ur + '|');
  }
  if (entry['WM']) {
    padbox(result, 'B', get('WM'));
  }

  if (entry['AL'] == 6) {
    padbox(result, 'D', 'IA→H');
  } else if (entry['AL'] == 28) {
    padbox(result, 'D', 'DKEY→' + get('TR'));
  } else if (entry['AL'] == 30) {
    padbox(result, 'D', 'D→' + get('TR'));
  } else if (entry['AL'] == 31) {
    padbox(result, 'D', 'AKEY→' + get('TR'));
  }
  // Combine LB, MB, MD into 1
  var n = undefined;
  var names = [];
  for (var i = 0 ; i < 3; i++) {
    var key = ['LB', 'MB', 'MD'][i];
    if (entry[key]) {
      if (n != undefined && n != entry[key]) {
        alert("unexpected LB/MB/MD values");
      }
      n = entry[key];
      names.push(key);
    }
  }
  if (n != undefined) {
    if (entry['UP'] == 0 || entry['UP'] == 1) {
      padbox(result, 'D', get('UP') + names.join(','));
    } else {
      padbox(result, 'D', names.join(',') + get('UP') + n);
    }
  }

  if (entry['DG']) {
    padbox(result, 'D', get('DG'));
  }
  if (entry['TR'] == 12) {
    padbox(result, 'D', get('TR'));
  }

  if (entry['WS'] != 4 || entry['SF'] != 7) {
    padbox(result, 'L', get('WS'));
  }
  if (entry['SF'] != 7) {
    padbox(result, 'L', get('SF'));
  }

  if (entry['TR'] == 8) {
    padbox(result, 'S', get('TR'));
  }
  var iv;
  if (entry['IV']) {
    iv = get('IV');
    if (iv.indexOf('→') >= 0) {
      // Assignments go into S
      padbox(result, 'S', get('IV'));
      iv = undefined;
    }
  }

  var ss;
  if (entry['SS']) {
    ss = get('SS');
  }
  if (iv) {
    padbox(result, 'C', iv, ss);
  } else if (ss) {
    padbox(result, 'C', ss);
  }

  if (result.length == 1) {
    result.push('|             |');
    result.push('| NOP         |');
  }

  var zf = parseInt(entry['ZF'], 10)
  var nextaddr = parseInt(entry['ZP'], 10) << 6;
  var addr03;
  if (entry['ZN'] == 0) {
    padbox(result, 'R', get('ZF') + '→ROAR');
    addr03 = '****';
  } else if (entry['ZN'] != 4) {
    padbox(result, 'R', get('ZN'));
    nextaddr |= parseInt(entry['ZF'], 10) << 2
    addr03 = '    ';
  } else {
    nextaddr |= parseInt(entry['ZF'], 10) << 2
    addr03 = '    ';
  }

  while (result.length < 6) {
    result.push('|             |');
  }

  if (entry['AB'] <= 1 && entry['BB'] <= 1) {
  } else {
    var ab = get('AB');
    var bb = get('BB');
    if (entry['BB'] == 0 && (entry['AB'] == 56 || entry['AB'] == 58)) {
        // Sometimes suppress BB=0?
        bb = '';
    } else if (entry['BB'] == 1 && (entry['AB'] == 34)) {
        // Sometimes suppress BB=1?
        bb = '';
    }
    if (entry['AB'] == 1 && (entry['BB'] == 2 || entry['BB'] == 23 || entry['BB'] == 30)) {
        ab = '';
    } 
    padbox(result, 'R', ab + bb.padStart(11 - ab.length, ' '));
  }

  while (result.length < 7) {
    result.push('|             |');
  }

  var nextlabel = 'Next: '
  var achar = '*';
  var bchar = '*';
  if (entry['AB'] <= 1 ) {
    nextaddr |= (entry['AB'] << 1);
    achar = 'X'
  }
  if (entry['BB'] <= 1 && entry['AB'] != 56) {
    nextaddr |= entry['BB'];
    bchar = 'X'
  }
  result.push('----' + addr03 + achar + bchar + ' ----');
  nextaddr = nextaddr.toString(16).padStart(4, 0)
    
  result.push(nextlabel + nextaddr);
  // Log info for unittest
  console.log(JSON.stringify(addr) + ": " + JSON.stringify(result) + ",");
  return result;
}

// Pad s1 on the right to make a box
// Append to result.
// If s2 is present, put it to the right of s1
function padbox(result, label, s1, s2) {
  if (s1 == undefined && s2 == undefined) {
    padbox(result, label, '');
  } else if (s1 == undefined) {
    padbox(result, label, '', s2);
  } else if (s2 == undefined) {
    // This is the case that actually does the append.
    result.push(label + ' ' + s1.padEnd(12, ' ') + '|');
  } else {
    var spacing = Math.min(5, 11 - s1.length - s2.length);
    padbox(result, label, s1.padEnd(spacing, ' ') + ' ' + s2);
  }
}

// Dumps the entry's data as an array of string.
function dump(entry) {
  var fields = ['CE', '-E', 'RY', 'TC', 'LX', 'TR', 'AD', 'AL', '-A', 'LU', 'MV', 'UL', 'UR', 'WM', 'RY', '-B',
  'AL', 'TR', 'UP', 'LB', 'MB', 'MD', 'DG', '-D',
  'WS', 'SF', '-L', 'IV', 'TR', 'ZN', '-S', 'SS', '-C', 'ZP', 'ZF', 'ZN', 'AB', 'BB', '-R'];
  var result = [];
  var line = [];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    if (field[0] == '-') {
      if (line.length > 0) {
        result.push(field[1] + ': ' + line.join(', '));
        line = [];
      }
    } else if (field in entry) {
      line.push(field + ': ' + entry[field]);
    }
  }
  var keys = Object.keys(entry);
  for (var i = 0; i < keys.length; i++) {
    var field = keys[i];
    if (fields.indexOf(field) < 0) { // Not in the list
      if (field != 'P' && entry[field] != '0') {
        line.push(field + ': ' + entry[field]);
      }
    }
  }
  if (line.length > 0) {
    result.push('?: ' + line.join(', '));
  }
  return result;
}
