
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
5: 'SEMT', // handled by B. OR SDR parity with emit QY310.
// no 6
// no 7
},

// True - complement control
'TC': {0: '-', 1: '+'},

// left input to adder [XG]
'LX': {0: '0',
1: 'L',
2: 'SGN',
3: 'E',  // E is shifted left one bit
4: 'LRL', // L23->XG01 QT115/0189
// and L(16-13) to M(16-31) via BUS (0-15) LRL->MHL QE580/070b
5: 'LWA',
6: '4',
7: '64C',
},

// Adder latch destination
'TR': {
0: 'T',
1: 'R',
2: 'R0',
3: 'M',
4: 'D',
5: 'L0',
6: 'R,A',       // stores to R and address reg. Starts read cycle.
7: 'L',
8: 'HA→A', // under S. selects main storage. 50Maint p22
9: 'R,AN', // QT220/02bf
10: 'R,AW',
11: 'R,AD',
12: 'D→IAR', // under D
13: 'SCAN→D', // under D        Scan bits 0-27 (extended with parity) to D. QY410
14: 'R13',
15: 'A', // QP100/614
16: 'L,A',
// 17: IO
// 18 not found
// 19: IO
20: 'H',
21: 'IA',
22: 'FOLD→D', // under D // 50Maint p32. FLT reg bit 0 specifies fold; maps 36 bit registers (i.e. with 4 parity) onto two 32 bit storage. Accesses folded part of SCAN QY410
// 23 not found
24: 'L,M',
25: 'MLJK',     // store to L, M, 12-15 to J, 16-19 to MD  QY310, QT110. 
// 0 -> REFETCH, (X=0)->S0, (B=0)->S1, set ILC,1SYL: QT110, QT115
26: 'MHL',
// T->L, T(0-3)->MD, T(0-15)->M, (B=0)->S1, set 1SYL QT115/0184
// T->L, T(0-3)->MD, T(0-15)->M, L(0-15) to M(16-31) QE180/709
27: 'MD',
28: 'M,SP', // store to M register and Storage Protect QU100
29: 'D*BS',     // SDR bytes stats. Store bytes to D (i.e. main memory) where BS bit is high?
30: 'L13', // QP206/0D95
31: 'J',
},

// Adder function
'AD': {
// 0 used by f43?
// 1 is default
2: 'BCFO',
// 3: not found
4: 'BC0',       // Save CAR from 0, QG501
5: 'BC⩝C',      // Save CAR(0) CAR(1) QB100:0219
6: 'BC1B',      // Save CAR from 1, Block CAR from 8, QG501
7: 'BC8',       // Save carry out of pos 8  QP800:064A
8: 'DHL',
9: 'DC0',       // Decimal add correction QG900/0e3c
10: 'DDC0',
11: 'DHH',
12: 'DCBS',
// 13-15 unused
},

/// Shift gate and adder latch control
'AL': {
1: 'Q→SR1→F',
2: 'L0,¬S4→',
3: '+SGN→',
4: '-SGN→',
5: 'L0,S4→',
6: 'IA→H', // Handled by D
7: 'Q→SL→-F',
8: 'Q→SL1→F',
9: 'F→SL1→F',
10: 'SL1→Q',
11: 'Q→SL1',
12: 'SR1→F',
13: 'SR1→Q',
14: 'Q→SR1→Q',
15: 'F→SL1→Q',
16: 'SL4→F',    // Shift adder output left by 4, also put in F.
17: 'F→SL4→F',
18: 'FPSL4',
19: 'F→FPSL4',
20: 'SR4→F',
21: 'F→SR4→F',
22: 'FPSR4→F',
23: '1→FPSR4→F',
24: 'SR4→H',
25: 'F→SR4',
26: 'E→FPSL4',
27: 'F→SR1→Q',
28: 'DKEY→', // Handled by D, data keys
// 29 used by I/O
30: 'D→', // Handled by D
31: 'AKEY→', // Handled by D, address keys
},

// B
// Mover input left side -> U
'LU': {
0: '',
1: 'MD,F',      // MD and F registers (4 bits each)
2: 'R3',        // R3 = low byte (byte 3, right) of register R
// 3: I/O
4: 'XTR',       // Parity error (extra bit)? Reset by reading. QU100
5: 'PSW4',      // PSW word 4 (right).
6: 'LMB',       // L indexed by MB?
7: 'LLB',
},

// Mover input right side -> V
'MV': {
0: '',
1: 'MLB',       // M indexed by LB?
2: 'MMB',
// 3 not found
},

// Mover action 0-3 -> WL, -> WR
// Combined if same?
'UL': {
0: 'E', // E->WL in d29
1: 'U', // E->WR in 61b
2: 'V',
3: '?', // Use mover function
},

'UR': {
0: 'E',
1: 'U',
2: 'V', // or VR
3: '?', // AND operands together
},

// Mover output destination W ->
'WM': {
0: '',
1: 'W→MMB',     // W to M indexed by MB
2: 'W67→MB',    // W bits 6-7 to MB
3: 'W67→LB',   // W bits 6-7 to LB
4: 'W27→PSW4', // W bits 2-7 to PSW bits 34-39 QJ200. Turns off load light too.
5: 'W→PSW0',    // PSW bits 0-7 (left)
6: 'WL→J',
7: 'W→CHCTL',           // Channel control: 0001 is start I/O, 0100 is test I/O. Updates R, M, DA, L (see QK800). M0 = unit status. L1 is channel end status
8: 'W,E→A(BUMP)', // W,E(23) selects bump sector address. Bits shuffled, see 5- Maint p81.
9: 'WL→G1',
10: 'WR→G2',
11: 'W→G',
12: 'W→MMB(E?)', // d29
13: 'WL→MD',
14: 'WR→F',
15: 'W→MD,F',
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
1: '1', // QT115/0189
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
2: 'HOT1→ADDER',        // 1 bit added to last position
3: 'G1-1',
4: 'HOT1,G-1',
5: 'G2-1',
6: 'G-1',
7: 'G1,2-1',
},

// Local storage addressing
'WS': {
1: 'WS1→LSA', // Select WS1 address from local storage. WS7 is PSW0 backup
2: 'WS2→LSA', // Select WS2 address from local storage
3: 'WS,E→LSA', // QP206/D94
4: 'FN,J→LSA', // NOP if SF==7
5: 'FN,JΩ1→LSA',
6: 'FN,MD→LSA',
7: 'FN,MDΩ1→LSA',
},

// Local storage function
'SF': {
0: 'R→LS', // QT210/1A3
1: 'LS→L,R→LS', 
2: 'LS→R→LS', 
// 3 not found
4: 'L→LS', // QP206/D95
5: 'LS→R,L→LS',
6: 'LS→L→LS', // QP206/D94
7: '', // Only used with WS 4: disables WS 4 for nop
},

// Instruction address reg control
'IV': {
1: 'WL→IVD',
2: 'WR→IVD',
3: 'W→IVD',
4: 'IA/4→A,IA',
5 : 'IA+2/4', // QT115/019B
6 : 'IA+2', // QT120/018B
7: 'IA+0/2→A', // QP206/0D94 Also IA+0+2→A: QT115/0199 
},

// Suppress memory instruction fetch / ROS address control
'ZN': {
0: '--ROAR--', // QT115/019B
1: 'SMIF',      // Suppress Memory IF off bnds and ¬refetch. QB100:0219. Only used with I-FETCH and I+0/2→A
2: 'AΩ(B=0)→A', // hypothesis
3: 'AΩ(B=1)→A',
4: '2', // QP206/0D94
// 5 unused
6: 'BΩ(A=0)→B', // QT115/020A
7: 'BΩ(A=1)→B', // QT120/01CC
},

// C: Stat setting and misc control
'SS': {
// 1,2,3 not present
4: 'E→SCANCTL', // Performs scan operation controlled by E. See 50Maint p32. 0101 clears SCPS,SCFS QU100. 0011 ignore IO error. 0000 test for all ones, step bin trigger. 0001 sets SCPS,SCFS.
// 1000 moves SDR(0-2) to CTR (clock advance counter), STR(5) to PSS (progressive scan stat), SDR(6) to SST (supervisory stat) QY110
5: 'L,RSGNS',
6: 'IVD/RSGNS',
7: 'EDITSGN',
8: 'E→S03',             // S03 = stats 0-3 50Maint p183, QU100
9: 'S03ΩE,1→LSGN',
10: 'S03ΩE',            // Set S03 bits from E
11: 'S03ΩE,0→BS',
12: 'X0,B0,1SYL',
13: 'FPZERO',
14: 'FPZERO,E→FN',
15: 'B0,1SYL', // (B=0)->S1, set 1SYL QT115/0189
16: 'S03.¬E',           // Clear S03 bits from E
17: '(T=0)→S3',
18: 'E→BS,T30→S3',
19: 'E→BS',             // Store E to byte stats (i.e. byte mask)
20: '1→BS*MB',
// 21 not found
// 22 not found
23: 'MANUAL→STOP',      // M trig to S (Halt status) QU100
24: 'E→S47',            // Write E to channel S bits 4-7
25: 'S47ΩE',            // S bits 4-7 |= E. Set bits indicated by E
26: 'S47.¬E',           // S bits 4-7 &= ~E. I.e. clear bits indicated by E
27: 'S47,ED*FP',
28: 'OPPANEL→S47',      // Write operator panel to S bits 4-7
29: 'CAR,(T≠0)→CR',
30: 'KEY→F', // QT115/020E
31: 'F→KEY', // QT220/02BF
32: '1→LSGNS',
33: '0→LSGNS',
34: '1→RSGNS',
35: '0→RSGNS',
36: 'L(0)→LSGNS',
37: 'R(0)→RSGNS',       // R sign stat QY310
38: 'E(13)→WFN',
39: 'E(23)→LSFN', // QT120/0102
40: 'E(23)→CR',
41: 'SETCRALG', // Set CR algebraic
// T=0, 00->CR, if T<0, 01->CR, if 0<T, 10->CR QB100:0284, QE580/222.
42: 'SETCRLOG', // Set CR logical
// QP102/0641: If T*BS=0: 00->CR. If T*BS != 0 and CAR(0) =0: 01->CR. If T*BS != 0 and CAR(0)=1: 10->CR
43: '¬S4,S4→CR',
44: 'S4,¬S4→CR',
45: '1→REFETCH',
46: 'SYNC→OPPANEL', // QT200/0107
47: 'SCAN*E,10',        // sets FLT register. See 50Maint p28. Channel address, Unit address to L.
// 48: I/O only
// 49 not found
50: 'E(0)→IBFULL',      // Reset MPX Input Buffer Full stat QU100
// 51 not found
52: 'E→CH',             // QY430 E=0110 resets common and mpx channel, QK702:099f 0001 resets common channel.)
// 53 not found
54: '1→TIMERIRPT',
55: 'T→PSW,IPL→T',      // QU100, 50Maint
56: 'T→PSW',            // T(12-15) to PSW QU100
57: 'SCAN*E,00',        // E -> SCANCTRL(2-5), 0->SCANCTRL(1), (FOLD)->SCANCTRL(0) // U100
58: '1→IOMODE', // 50Maint p39. Sets I/O mode stat
// 59-63 I/O
},

// ROAR values for ZN=0
'ZF': {
  2: 'D→ROAR,SCAN', // 50Maint p39 QY110. SDR(19-30) to ROAR, SDR(1-3) to scan counter, STR(4) to enable storage stat, SDR(5) to PSS, SDR(6) to supervis stat, SDR(7) to mode (IOMODE). (Unclear if IOMODE set by this or separately).
  6: 'M(03)→ROAR',
  8: 'M(47)→ROAR',
  10: 'F→ROAR',
  12: 'ED→ROAR',
  // Others unused

},

// Condition test (left side)
'AB': {
0: '0',
1: '1', // ?QP100/614
2: 'S0',
3: 'S1',
4: 'S2',        // stat 2: channel end status: 0 = channel busy, 1 = channel end
5: 'S3',        // stat 3: channel response
6: 'S4', // guess
7: 'S5',        // stat 5: channel ?
8: 'S6', // QT200/0209
9: 'S7',        // stat 7: 0 for test I/O, 1 for start I/O
10: 'CSTAT',    // test saved carry stat (e.g. BC8 in prev instruction) QP800:064E
// 11 not found
12: '1SYLS', // QT115/0189. One syllable instruction
// QT110: (X=0) -> S0, (B=0)->S1, set ILC,1SYL
13: 'LSGNS',
14: '⩝SGNS',
// 15 not found
16: 'CRMD',     // masked CR -> A, branch on CC=0 (I/O accepted by channel). Test for branch.
17: 'W=0',
18: 'WL=0',
19: 'WR=0',
20: 'MD=FP',
21: 'MB=3',     // Test MB register value
22: 'MD3=0',
23: 'G1=0',
24: 'G1<0',
25: 'G<4',
26: 'G1MBZ',
// 27, 28 I/O
29: 'R(31)', // QT120/01CC
30: 'F(2)',
31: 'L(0)',
32: 'F=0',
33: 'UNORM',
34: 'TZ*BS',
35: 'EDITPAT',
36: 'PROB',     // Privileged op? QY110 QK700:0932
37: 'TIMUP',
// 38 not found
39: 'GZ/MB3',
// 40 not found
41: 'LOG',      // Branch on log scan stat. QY430 0 for FLT log, 1 for error log QY410
42: 'STC=0',    // Check Scan Test Counter
43: 'G2<=LB',
// 44 not found
45: 'D(7)', // test D bit 7 (SDR) QY510
46: 'SCPS', // test and branch on pass trigger: 50Maint p32
47: 'SCFS', // test and branch on fail trigger: 50Maint p32
// 48: I/O
49: 'W(67)→AB',
// 50: I/O
// 51: I/O
// 52: I/O
// 53: I/O
54: 'CANG', // CA(29-31) != 0, CA(4-7) != 0? QK700:0995
55: 'CHLOG', // Select channel log out QK700:018d
56: 'I-FETCH', // QP206/D94
57: 'IA(30)',
58: 'EXT,CHIRPT',
// 59 not found
60: 'PSS',      // Test and reset Program Scan Stat QU100
// 61, 62 not found
63: 'RX.S0',
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
10: 'RSGNS',
11: 'HSCH',
12: 'EXC',      // Test as part of branch. Address trap exception? QA700
13: 'WR=0',
// 14 unused
15: 'T13=0',
16: 'T(0)',
17: 'T=0',
18: 'TZ*BS',    // Latch zero test per byte stats. QA700
19: 'W=1',
20: 'LB=0',
21: 'LB=3',     // Test LB value
22: 'MD=0',
23: 'G2=0',
24: 'G2<0',
25: 'G2LBZ',
// 26: I/O
27: 'MD/JI', // QG400:0307
28: 'IVA', // CA all right or invalid. QK700:09bd
// 29: I/O
30: '(CAR)',    // Test carry. QP800:0650
31: '(Z00)',
},

};

var nextaddr = 0;

// Generates the info box for the given entry at addr.
// Returns array of strings.
// Addr is a 4-digit hex string.
function decode(addr, entry) {
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

  if (entry == undefined) {
    throw('Missing microcode for addr ' + addr);
  }

  var result = [];
  result.push('---------- ' + addr.toUpperCase());
  if (entry['CE']) {
    padbox(result, 'E', bin(entry['CE'], 4));
  }

  if (entry['AL'] == 28 || entry['AL'] == 30 || entry['AL'] == 31 || entry['TR'] == 12 || entry['TR'] == 22 || entry['TR'] == 13) {
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
  if (entry['RY'] == 5) {
      padbox(result, 'B', undefined, get('RY'));
  }
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
    if (entry['UR'] != 1 || entry['UL'] == 0) {
      ur = ( get('UR') + 'R→WR').replace('ER', 'E').replace('?R', '?').padEnd(6, ' ');
    }
    result.push('B ' + ul + ur + '|');
  }
  if (entry['WM']) {
    padbox(result, 'B', get('WM'));
  }

  if (entry['AL'] == 6) {
    padbox(result, 'D', get('AL'));
  } else if (entry['AL'] == 28 || entry['AL'] == 30 || entry['AL'] == 31) {
    padbox(result, 'D', get('AL') + get('TR'));
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
  if (entry['TR'] == 12 || entry['TR'] == 13 || entry['TR'] == 22) {
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
    padbox(result, 'R', get('ZF'));
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

  var nextlabel = 'Next: ';
  var achar = '*';
  var bchar = '*';
  if (entry['AB'] <= 1 ) {
    nextaddr |= (entry['AB'] << 1);
    achar = 'X'
  }
  if (entry['BB'] <= 1 && entry['AB'] != 56 && entry['AB'] != 49) {
    nextaddr |= entry['BB'];
    bchar = 'X'
  }
  result.push('----' + addr03 + achar + bchar + ' ----');
  var nextaddr_pad = nextaddr.toString(16).padStart(4, '0');
    
  result.push(nextlabel + nextaddr_pad);
  return result;
}

// Pad s1 on the right to make a box
// Append to result.
// If s2 is present, put it to the right of s1
function padbox(result, label, s1, s2?) {
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
