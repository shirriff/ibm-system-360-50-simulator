// The 360 microcode simulator engine

// state is the current processor state
// entry is the ROS entry
function cycle(state, entry) {
  adder(state, entry);
  counters(state, entry);
  iar(state, entry);
  localStorage(state, entry);
  mover(state, entry);
  localStorageWrite(state, entry);
  stat(state, entry);
  adderLatch(state, entry);
}

function adder(state, entry) {
  var xg = undefined;

  switch (entry['LX']) { // left input to adder [XG]
    case 0: // No adder input
      break;
    case 1: // L
      xg = state['L'];
      break;
    case 2: // SGN
      alert('Unimplemented LX ' + entry['LX']);
      break;
    case 3: // E  // E is shifted left one bit
      xg = state['E'] << 1;
      break;
    case 4: // LRL // L23->XG01 QT115/0189
      alert('Unimplemented LX ' + entry['LX']);
      break;
  // and L(16-13) to M(16-31) via BUS (0-15) LRL->MHL QE580/070b
    case 5: // LWA
      alert('Unimplemented LX ' + entry['LX']);
      break;
    case 6: // 4
      alert('Unimplemented LX ' + entry['LX']);
      break;
    case 7: // 64C
      alert('Unimplemented LX ' + entry['LX']);
      break;
    default:
      alert('Unexpected LX ' + entry['LX']);
      break;
  }

  // Right input to adder Y
  var y = undefined;
  switch (entry['RY']) {
    case 0: '0'
      alert('Unexpected RY ' + entry['RY']);
      break;
    case 1: // R
      y = state['R'];
      break;
    case 2: // M
      y = state['M'];
      break;
    case 3: // M23
      y = state['M'] & 0xffff;
      break;
    case 4: // H
      y = state['H'];
      break;
    case 5: // SEMT // handled by B. OR SDR parity with emit QY310.
      alert('Unimplemented RY ' + entry['RY']);
      break;
    case 6: // unused
      alert('Unexpected RY ' + entry['RY']);
      break;
    case 7: // unused
      alert('Unexpected RY ' + entry['RY']);
      break;
  }

  var t = undefined;

  if (xg == undefined && y == undefined) {
    // No operation
  } else if (xg == undefined || y == undefined) {
    alert('Unexpected missing xg, y: ' + xg + ', ' + y);
  } else {
    if (entry['TC'] == 0) {
      // Subtract
      t = (-xg + y);
      if (t < 0) {
        // Carry?
        t += 0x100000000;
      }

    } else {
      // Add
      t = xg + y;
    }
    t = (t & 0xffffffff) >>> 0; // Force Javascript to give an unsigned result
  }
 
  // Adder function
  switch (entry['AD']) {
    case 0:
      alert('Instruction with AD=0 should never be accessed.')
      break;
    case 1:
      // 1 is default
      break;
    case 2: // BCFO
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 3:
      alert('Unexpected AD ' + entry['AD']);
      break;
    case 4: // BCO
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 5: // BCVC
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 6: // BC1B // BC for 489
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 7: // BC8
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 8: // DHL
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 9: // DC0
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 10: // DDC0
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 11: // DHH
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 12: // DCBS
      alert('Unimplemented AD ' + entry['AD']);
      break;
    case 13:
    case 14:
    case 15:
    default:
      alert('Unexpected AD ' + entry['AD']);
      break
  } // AD

  // Shift gate and adder latch control
  switch (entry['AL']) {
    case 0: // Normal
      break;
    case 1: // Q→SR1→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 2: // L0,¬S4→
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 3: // +SGN→
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 4: // -SGN→
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 5: // L0,S4→
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 6: // IA→H, // Handled by D
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 7: // Q→SL→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 8: // Q→SL1→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 9: // F→SL1→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 10: // SL1→Q
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 11: // Q→SL1
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 12: // SR1→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 13: // SR1→Q
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 14: // Q→SR1→Q
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 15: // F→SL1→Q
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 16: // SL4→F,    // Shift adder output left by 4, also put in F.
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 17: // F→SL4→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 18: // FPSL4
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 19: // F→FPSL4
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 20: // SR4→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 21: // F→SR4→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 22: // FPSR4→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 23: // 1→FPSR4→F
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 24: // SR4→H
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 25: // F→SR4
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 26: // E→FPSL4
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 27: // F→SR1→Q
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 28: // DKEY→, // Handled by D, data keys
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 29:
      alert('Unimplemented I/O AL ' + entry['AL']);
    case 30: // D→, // Handled by D
      alert('Unimplemented AL ' + entry['AL']);
      break;
    case 31: // AKEY→, // Handled by D, address keys
      alert('Unimplemented AL ' + entry['AL']);
      break;
    default:
      alert('Unexpected AL ' + entry['AL']);
      break;
  } // AL

  // Length counter and carry insert ctrl
  switch (entry['DG']) {
    case 0: // default
      break;
    case 1: // CSTAT→ADDER
      alert('Unexpected DG ' + entry['DG']);
      break;
    case 2: // HOT1→ADDER        // 1 bit in last position
      alert('Unexpected DG ' + entry['DG']);
      break;
    case 3: // G1-1
      alert('Unexpected DG ' + entry['DG']);
      break;
    case 4: // HOT1G-1,
      alert('Unexpected DG ' + entry['DG']);
      break;
    case 5: // G2-1
      alert('Unexpected DG ' + entry['DG']);
      break;
    case 6: // G-1
      alert('Unexpected DG ' + entry['DG']);
      break;
    case 7: // G12-1,
      alert('Unexpected DG ' + entry['DG']);
      break;
    default:
      alert('Unexpected DG ' + entry['DG']);
      break;
  }

  if (t == undefined) {
    if (entry['TR'] != 0) {
      alert('Unexpected undefined t');
    }
  } else {
    state['T'] = t;
  }

}

function adderLatch(state, entry) {
  // Adder latch destination
  var t = state['T'];
  switch (entry['TR']) {
    case 0: // T
      break;
    case 1: // R
      state['R'] = t;
      break;
    case 2: // R0
      state['R'] = (t & 0xff000000) | (state['R'] & 0x00ffffff);
      break;
    case 3: // M
      state['M'] = t;
      break;
    case 4: // D
      state['D'] = t;
      break;
    case 5: // L0
      state['L'] = (t & 0xff000000) | (state['L'] & 0x00ffffff);
      break;
    case 6: // RA,       // stores to R and address reg. Starts read cycle.
      state['R'] = t;
      state['A'] = t;
      fetch();
      break;
    case 7: // L
      state['L'] = t;
      break;
    case 8: // HA→A // under S. selects main storage. 50Maint p22
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 9: // RAN, // QT220/02bf
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 10: // RAW,
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 11: // RAD,
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 12: // D→IAR // under D
      state['IAR'] = state['D'] & 0x00ffffff; // IAR is 24-bit
      break;
    case 13: // SCAN→D // under D        Scan bits 0-27 (extended with parity) to D. QY410
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 14: // R13
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 15: // A // QP100/614
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 16: // LA,
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 17:
      alert('Unimplemented I/O TR ' + entry['TR']);
      break;
    case 18:
      alert('Unexpected TR ' + entry['TR']);
      break;
    case 19:
      alert('Unimplemented I/O TR ' + entry['TR']);
      break;
    case 20: // H
      state['H'] = t;
      break;
    case 21: // IA
      alert("Need to figure out difference between IA and IAR");
      state['IA'] = t;
      break;
    case 22: // FOLD→D // under D // 50Maint p32. FLT reg bit 0 specifies fold; maps 36 bit registers (i.e. with 4 parity) onto two 32 bit storage. Accesses folded part of SCAN QY410
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 23: // MSP,     // store to M register and Storage Protect QU100
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 24: // LM,
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 25: // MLJK     // store to L, M, 12-15 to J, 16-19 to MD  QY310, QT110. 
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 26: // MHL
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 27: // MD
      state['MD'] = t & 0xf;
      break;
    case 28: // MSP, // QT200/0193
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 29: // D*BS     // SDR bytes stats. Store bytes to D (i.e. main memory) where BS bit is high?
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 30: // L13 // QP206/0D95
      alert('Unimplemented TR ' + entry['TR']);
      break;
    case 31: // J
      state['J'] = t & 0xf;
      break;
    default:
      alert('Unexpected TR ' + entry['TR']);
      break;
  } // TR
}

  // Mask for byte 0, 1, 2, 3
bytemask = [0xff000000, 0x00ff0000, 0x0000ff00, 0x000000ff];
byteshift = [24, 16, 8, 0];

function mover(state, entry) {
  // Mover input left side -> U
  var u = undefined;
  switch (entry['LU']) {
    case 0: // no value
      break;
    case 1: // MDF,      // MD and F registers (4 bits each)
      u = (state['MD'] << 4) | state['F'];
      break;
    case 2: // R3        // R3 = low byte (byte 3, right) of register R
      u = state['R'] & 0xff;
      break;
    case 3: // I/O
      alert('Unimplemented LU ' + entry['LU']);
      break;
    case 4: // XTR       // Parity error (extra bit)? Reset by reading. QU100
      break;
    case 5: // PSW4      // PSW word 4 (right).
      u = state['PSW'] & 0xff;
      break;
    case 6: // LMB       // L indexed by MB
      u = (state['L'] & bytemask[state['MB']]) >> byteshift[state['MB']];
      break;
    case 7: // LLB
      u = (state['L'] & bytemask[state['LB']]) >> byteshift[state['LB']];
      break;
    default:
      alert('Unexpected LU ' + entry['LU']);
      break;
  }

  // Mover input right side -> V
  var v = undefined;
  switch (entry['MV']) {
    case 0: // no value
      break;
    case 1: // MLB
      v = (state['M'] & bytemask[state['LB']]) >> byteshift[state['LB']];
      break;
    case 2: // MMB
      v = (state['M'] & bytemask[state['MB']]) >> byteshift[state['MB']];
      break;
    case 3:
    default:
      alert('Unexpected MV ' + entry['MV']);
      break;
  }

  var wl = undefined; // wl is a 4-bit value
  switch (entry['UL']) {
    case 0: // E // E->WL in d29
      wl = state['E'];
      break;
    case 1: // U   default: pass undefined through
      if (u != undefined) {
        wl = u >> 4;
      }
      break;
    case 2: // V
      if (v == undefined) {
        alert('Undefined v')
      }
      wl = v >> 4;
      break;
    case 3: // ? // AND operands together
      if (u == undefined || v == undefined) {
        alert('Undefined u, v')
      }
      wl = (u & v) >> 4;
      break;
    default:
      alert('Unexpected UL ' + entry['UL']);
  }

  var wr = undefined;
  switch (entry['UR']) {
    case 0: // E
      wr = state['E'];
      break;
    case 1: // U   default: pass undefined through
      if (u != undefined) {
        wr = u & 0xf;
      }
      break;
    case 2: // V // or VR
      if (v == undefined) {
        alert('Undefined v')
      }
      wr = v & 0xf;
      break;
    case 3: // ? // AND operands together
      if (u == undefined || v == undefined) {
        alert('Undefined u, v')
      }
      wr = (u & v) & 0xf;
      break;
    default:
      alert('Unexpected UR ' + entry['UR']);
      break;
  }

  if (wl == undefined || wr == undefined) {
    if (entry['WM'] != 0) {
      alert('Using undefined mover output');
    }
    // No mover action
    return;
  }

  state['W'] = (wl << 4) | wr;
  state['WL'] = wl;
  state['WR'] = wr;

  // Mover output destination W ->
  switch (entry['WM']) {
    case 0: // no action
      break;
    case 1: // W→MMB     // W to M indexed by MB
      state['MB'][state['MB']] = w;
      break;
    case 2: // W67→MB    // W bits 6-7 to MB
      state['MB'] = w & 3;
      break;
    case 3: // W67→LB   // W bits 6-7 to LB
      state['LB'] = w & 3;
      break;
    case 4: // W27→PSW4 // W bits 2-7 to PSW bits 34-39 QJ200. Turns off load light too.
      alert('Unimplemented WM ' + entry['WM']);
      break;
    case 5: // W→PSW0    // PSW bits 0-7 (left)
      state['PSW'] = (state['PSW'] & 0x00ffffff) | (w << 24);
      break;
    case 6: // WL→J
      state['J'] = wl & 7;
      break;
    case 7: // W→CHCTL           // Channel control: 0001 is start I/O, 0100 is test I/O. Updates R, M, DA, L (see QK800). M0 = unit status. L1 is channel end status
      alert('Unimplemented WM ' + entry['WM']);
      break;
    case 8: // WE→A(BUMP), // W,E(23) selects bump sector address. Bits shuffled, see 5- Maint p81.
      alert('Unimplemented WM ' + entry['WM']);
      break;
    case 9: // WL→G1
      state['G1'] = wl & 7;
      break;
    case 10: // WR→G2
      state['G2'] = wr & 7;
      break;
    case 11: // W→G
      state['G1'] = wl & 7;
      state['G2'] = wr & 7;
      break;
    case 12: // W→MMB(E?) // d29
      alert('Unimplemented WM ' + entry['WM']);
      break;
    case 13: // WL→MD
      alert('Unimplemented WM ' + entry['WM']);
      break;
    case 14: // WR→F
      state['F'] = state['WR'] & 0xf;
      break;
    case 15: // W→MD,F
      alert('Unimplemented WM ' + entry['WM']);
      break;
    default:
      alert('Unexpected WM ' + entry['WM']);
      break;
  }
}

function counters(state, entry) {
  // Counter function control
  switch (entry['UP']) {
    case 0: // 0→
      if (entry['LB']) {
        state['LB'] = 0;
      }
      if (entry['MB']) {
        state['MB'] = 0;
      }
      if (entry['MD']) {
        state['MD'] = 0;
      }
      break;
    case 1: // 3→
      if (entry['LB']) {
        state['LB'] = 3;
      }
      if (entry['MB']) {
        state['MB'] = 3;
      }
      if (entry['MD']) {
        state['MD'] = 0;
      }
      break;
    case 2: // -   Should negative numbers wrap or be a flag?
      if (entry['LB']) {
        state['LB'] -= 1;
      }
      if (entry['MB']) {
        state['MB'] -= 1;
      }
      if (entry['MD']) {
        state['MD'] -= 1;
      }
      break;
    case 3: // + // QT120/01CE
      if (entry['LB']) {
        state['LB'] = (state['LB'] + 1) & 3;
      }
      if (entry['MB']) {
        state['MB'] = (state['MB'] + 1) & 3;
      }
      break;
    default:
      alert('Unexpected UP ' + entry['UP']);
      break;
  }
}

function localStorage(state, entry) {
  // Local storage addressing
  switch (entry['WS']) {
    case 0:
      alert('Instruction with WS=0 should never be accessed.')
      break;
    case 1: // WS1→LSA // Select WS1 address from local storage. WS7 is PSW0 backup
      state['LSAR'] = 0x31;
      break;
    case 2: // WS2→LSA // Select WS2 address from local storage
      state['LSAR'] = 0x32;
      break;
    case 3: // WSE→LSA, // QP206/D94
      alert('Unimplemented WS ' + entry['WS']);
      break;
    case 4: // FNJ→LSA,
      state['LSAR'] = (state['LSFN'] << 4) | state['J'];
      break;
    case 5: // FNJΩ1→LSA,
      state['LSAR'] = (state['LSFN'] << 4) | state['J'] | 1;
      break;
    case 6: // FNMD→LSA,
      state['LSAR'] = (state['LSFN'] << 4) | state['MD'];
      break;
    case 7: // FNMDΩ1→LSA,
      state['LSAR'] = (state['LSFN'] << 4) | state['MD'] | 1;
      break;
    default:
      alert('Unexpected WS ' + entry['WS']);
      break;
  }

  // Local storage function
  switch (entry['SF']) {
    case 0: // R→LS // QT210/1A3
      break;
    case 1: // LS→LR→LS, 
      alert('Unimplemented WS ' + entry['WS']);
      break;
    case 2: // LS→R→LS 
      state['R'] = state['LS'][state['LSAR']];
      break;
    case 3:
      alert('Unexpected WS ' + entry['WS']);
      break;
    case 4: // L→LS // QP206/D95
      break;
    case 5: // LS→RL→LS,
      alert('Unimplemented WS ' + entry['WS']);
      break;
    case 6: // LS→L→LS // QP206/D94
      state['L'] = state['LS'][state['LSAR']];
      break;
    case 7: // No storage function
      break;
    default:
      alert('Unexpected WS ' + entry['WS']);
      break;
  }
}

// Need to split up local storage read and write since bus can be modified in between
function localStorageWrite(state, entry) {
  // Local storage function
  switch (entry['SF']) {
    case 0: // R→LS // QT210/1A3
      state['LS'][state['LSAR']] = state['R'];
      break;
    case 1: // LS→LR→LS, 
      alert('Unimplemented SF ' + entry['SF']);
      break;
    case 2: // LS→R→LS 
      state['LS'][state['LSAR']] = state['R'];
      break;
    case 3:
      alert('Unexpected WS ' + entry['WS']);
      break;
    case 4: // L→LS // QP206/D95
      state['LS'][state['LSAR']] = state['L'];
      break;
    case 5: // LS→RL→LS,
      break;
    case 6: // LS→L→LS // QP206/D94
      alert('Unimplemented SF ' + entry['SF']);
      state['LS'][state['LSAR']] = state['L'];
      break;
    case 7: // No storage function
      break;
    default:
      alert('Unexpected WS ' + entry['WS']);
      break;
  }
}

// Instruction address reg control
function iar(state, entry) {
  switch (entry['IV']) {
    case 1: // WL→IVD
      alert('Unimplemented WL ' + entry['WL']);
      break;
    case 2: // WR→IVD
      alert('Unimplemented WL ' + entry['WL']);
      break;
    case 3: // W→IVD
      alert('Unimplemented WL ' + entry['WL']);
      break;
    case 4: // IA/4→AIA,
      alert('Unimplemented WL ' + entry['WL']);
      break;
    case 5 : // IA+2/4 // QT115/019B
      alert('Unimplemented WL ' + entry['WL']);
      break;
    case 6 : // IA+2 // QT120/018B
      alert('Unimplemented WL ' + entry['WL']);
      break;
    case 7: // IA+0/2→A // QP206/0D94 Also IA+0+2→A: QT115/0199 
      alert('Unimplemented WL ' + entry['WL']);
      break;
    default:
      alert('Unimplemented WL ' + entry['WL']);
      break;
  }
}

function stat() {
  // C: Stat setting and misc control
  switch (entry['SS']) {
    case 0:
    case 1:
    case 2:
    case 3:
      alert('Unexpected SS ' + entry['SS']);
      break;
    case 4: // E→SCANCTL // Performs scan operation controlled by E. See 50Maint p32. 0101 clears SCPS,SCFS QU100. 0011 ignore IO error. 0000 test for all ones, step bin trigger. 0001 sets SCPS,SCFS.
      // 1000 moves SDR(0-2) to CTR (clock advance counter) STR(5) to PSS (progressive scan stat), SDR(6) to SST (supervisory stat) QY110
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 5: // LRSGNS,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 6: // IVD/RSGNS
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 7: // EDITSGN
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 8: // E→S03             // S03 = stats 0-3 50Maint p183, QU100
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 9: // S03ΩE1→LSGN,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 10: // S03ΩE            // Set S03 bits from E
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 11: // S03ΩE0→BS,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 12: // X0B0,1SYL,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 13: // FPZERO
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 14: // FPZEROE→FN,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 15: // B01SYL, // (B=0)->S1, set 1SYL QT115/0189
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 16: // S03.¬E           // Clear S03 bits from E
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 17: // (T=0)→S3
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 18: // E→B3T30→S3,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 19: // E→BS             // Store E to byte stats (i.e. byte mask)
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 20: // 1→BS*MB
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 21:
      alert('Unexpected SS ' + entry['SS']);
      break;
    case 22:
      alert('Unexpected SS ' + entry['SS']);
      break;
    case 23: // MANUAL→STOP      // M trig to S (Halt status) QU100
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 24: // E→S47            // Write E to channel S bits 4-7
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 25: // S47ΩE            // S bits 4-7 |= E. Set bits indicated by E
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 26: // S47.¬E           // S bits 4-7 &= ~E. I.e. clear bits indicated by E
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 27: // S47ED*FP,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 28: // OPPANEL→S47      // Write operator panel to S bits 4-7
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 29: // CAR(T≠0)→CR,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 30: // KEY→F // QT115/020E
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 31: // F→KEY // QT220/02BF
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 32: // 1→LSGNS
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 33: // 0→LSGNS
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 34: // 1→RSGNS
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 35: // 0→RSGNS
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 36: // L(0)→LSGNS
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 37: // R(0)→RSGNS       // R sign stat QY310
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 38: // E(13)→WFN
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 39: // E(23)→LSFN // QT120/0102
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 40: // E(23)→CR
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 41: // SETCRALG
      // Save CAR(0) V CAR(1). If T=0 00->CR, if T<0, 01->CR, QE580/222. Part may be BCVC
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 42: // SETCRLOG
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 43: // ¬S4S4→CR,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 44: // S4¬S4→CR,
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 45: // 1→REFETCH
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 46: // SYNC→OPPANEL // QT200/0107
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 47: // SCAN*E10,        // sets FLT register. See 50Maint p28. Channel address, Unit address to L.
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 48:
      alert('Unexpected I/O SS ' + entry['SS']);
      break;
    case 49:
      alert('Unexpected SS ' + entry['SS']);
      break;
    case 50: // E(0)→IBFULL      // Reset MPX Input Buffer Full stat QU100
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 51:
      alert('Unexpected SS ' + entry['SS']);
      break;
    case 52: // E→CH             // QY430 E=0110 resets common and mpx channel
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 53:
      alert('Unexpected SS ' + entry['SS']);
      break;
    case 54: // 1→TIMERIRPT
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 55: // T→PSWIPL→T,      // QU100, 50Maint
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 56: // T→PSW            // T(12-15) to PSW QU100
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 57: // SCAN*E00,        // E -> SCANCTRL(2-5), 0->SCANCTRL(1), (FOLD)->SCANCTRL(0) // U100
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 58: // 1→IOMODE // 50Maint p39. Sets I/O mode stat
      alert('Unimplemented SS ' + entry['SS']);
      break;
    case 59:
      alert('Unimplemented I/O SS ' + entry['SS']);
      break;
    case 60:
      alert('Unimplemented I/O SS ' + entry['SS']);
      break;
    case 61:
      alert('Unimplemented I/O SS ' + entry['SS']);
      break;
    case 62:
      alert('Unimplemented I/O SS ' + entry['SS']);
      break;
    case 63:
      alert('Unimplemented I/O SS ' + entry['SS']);
      break;
    default:
      alert('Unexpected SS ' + entry['SS']);
      break;
  }
}

// Compute ROAR address
function computeROAR(state, entry) {
  var roar;
  roar = entry['ZP'] << 6;
  if (entry['ZN'] != 0) {
    roar |= entry['ZF'] << 2;
  }
  // otherwise ZF function generates roar bits at bottom of routine
  
  // Condition test (left side)
  switch (entry['AB']) {
    case 0: // 0
      // roar |= 0;
      break;
    case 1: // 1 // ?QP100/614
      roar |= 2;
      break;
    case 2: // S0
      roar |= state['S'][0] << 1;
      break;
    case 3: // S1
      roar |= state['S'][1] << 1;
      break;
    case 4: // S2
      roar |= state['S'][2] << 1;
      break;
    case 5: // S3
      roar |= state['S'][3] << 1;
      break;
    case 6: // S4
      roar |= state['S'][4] << 1;
      break;
    case 7: // S5
      roar |= state['S'][5] << 1;
      break;
    case 8: // S6
      roar |= state['S'][6] << 1;
      break;
    case 9: // S7
      roar |= state['S'][7] << 1;
      break;
    case 10: // CSTAT
      roar |= state['CSTAT'] << 1;
      break;
    case 11:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 12: // 1SYLS
      roar |= state['1SYLS'] << 1;
      break;
    case 13: // LSGNS
      roar |= state['LSNGS'] << 1;
      break;
    case 14: // VSGNS
      roar |= state['VSNGS'] << 1;
      break;
    case 15:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 16: // CRMD     // masked CR -> A, branch on CC=0 (I/O accepted by channel). Test for branch.
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 17: // W=0
      if (state['W'] == 0) {
        roar |= 2;
      }
      break;
    case 18: // WL=0
      if (state['WL'] == 0) {
        roar |= 2;
      }
      break;
    case 19: // WR=0
      if (state['WR'] == 0) {
        roar |= 2;
      }
      break;
    case 20: // MD=FP
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 21: // MB=3
      if (state['MB'] == 3) {
        roar |= 2;
      }
      break;
    case 22: // MD3=0
      if ((state['MD'] & 1) == 0) {
        roar |= 2;
      }
      break;
    case 23: // G1=0
      if (state['G1'] == 0) {
        roar |= 2;
      }
      break;
    case 24: // G1<0
      if (state['G1'] < 0) {
        roar |= 2;
      }
      break;
    case 25: // G<4
      if (state['G'] < 4) {
        roar |= 2;
      }
      break;
    case 26: // G1MB2
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 27:
    case 28:
      alert('Unimplemented I/O AB ' + entry['AB']);
      break;
    case 29: // R(31)
      if (state['R'] & 1) {
        roar |= 2;
      }
      break;
    case 30: // F(2)
      if (state['F'] & 1) { // Need to figure out which bit is 2
        roar |= 2;
      }
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 31: // L(0)
      if (state['L'] & 0x80000000) {
        roar |= 2;
      }
      break;
    case 32: // F=0
      if (state['F'] == 0) {
        roar |= 2;
      }
      break;
    case 33: // UNORM
      if (state['UNORM']) {
        roar |= 2;
      }
      break;
    case 34: // TZ*BS
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 35: // EDITPAT
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 36: // PROB     // Privileged op? QY110
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 37: // TIMUP
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 38:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 39: // GZ/MB3
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 40:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 41: // LOG      // Branch on log scan stat. QY430 0 for FLT log, 1 for error log QY410
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 42: // STC=0    // Check Scan Test Counter
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 43: // G2<=LB
      if (state['G2'] <= state['LB']) {
        roar |= 2;
      }
      break;
    case 44:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 45: // D(7) // test D bit 7 (SDR) QY510
      if (state['D'] & (1 << (31-7))) {
        roar |= 2;
      }
      break;
    case 46: // SCPS // test and branch on pass trigger: 50Maint p32
      if (state['SCPS']) {
        roar |= 2;
      }
      break;
    case 47: // SCFS // test and branch on fail trigger: 50Maint p32
      if (state['SCFS']) {
        roar |= 2;
      }
      break;
    case 48:
      alert('Unimplemented I/O AB ' + entry['AB']);
      break;
    case 49: // W(67)→AB
      if (entry['BB'] != 0) {
        alert('Unexpected AB 49, BB ' + entry['BB']);
      }
      roar |= state['W'] & 3;
      break;
    case 50:
    case 51:
    case 52:
    case 53:
      alert('Unimplemented I/O AB ' + entry['AB']);
      break;
    case 54: // CANG
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 55: // CHLOG
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 56: // I-FETCH // QP206/D94
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 57: // IA(30)
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 58: // EXTCHIRPT,
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 59:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 60: // PSS      // Test and reset Program Scan Stat QU100
      alert('Unimplemented AB ' + entry['AB']);
      break;
    case 61:
    case 62:
      alert('Unexpected AB ' + entry['AB']);
      break;
    case 63: // RXS0,
      alert('Unimplemented AB ' + entry['AB']);
      break;
    default:
      alert('Unexpected AB ' + entry['AB']);
      break;
  }

  switch (entry['BB']) {
    case 0: // 0
      roar |= 0;
      break;
    case 1: // 1
      roar |= 1;
      break;
    case 2: // S0
      roar |= state['S'][0];
      break;
    case 3: // S1
      roar |= state['S'][1];
      break;
    case 4: // S2
      roar |= state['S'][2];
      break;
    case 5: // S3
      roar |= state['S'][3];
      break;
    case 6: // S4
      roar |= state['S'][4];
      break;
    case 7: // S5
      roar |= state['S'][5];
      break;
    case 8: // S6
      roar |= state['S'][6];
      break;
    case 9: // S7
      roar |= state['S'][7];
      break;
    case 10: // RSGNS
      roar |= state['RSGNS'];
      break;
    case 11: // HSCH
      roar |= state['HSCH'];
      break;
    case 12: // EXC      // Test as part of branch. Address trap exception? QA700
      roar |= state['EXC'];
      break;
    case 13: // WR=0
      if (state['WR'] == 0) {
        roar |= 1;
      }
      break;
    case 14:
      alert('Unexpected BB ' + entry['BB']);
      break;
    case 15: // T13=0
      if ((state['T'] & (1<<31-13)) == 0) {
        roar |= 1;
      }
      break;
    case 16: // T(0)
      if ((state['T'] & (1<<31)) == 0) {
        roar |= 1;
      }
      break;
    case 17: // T=0
      if (state['T'] == 0) {
        roar |= 1;
      }
      break;
    case 18: // TZ*BS    // Latch zero test per byte stats. QA700
      if ((state['BS'][0] == 0 || (state['T'] & 0xff000000) == 0)
          && (state['BS'][1] == 0 || (state['T'] & 0x00ff0000) == 0)
          && (state['BS'][2] == 0 || (state['T'] & 0x0000ff00) == 0)
          && (state['BS'][3] == 0 || (state['T'] & 0x000000ff) == 0)) {
        roar |= 1;
      }
      break;
    case 19: // W=1
      if (state['W'] == 1) {
        roar |= 1;
      }
      break;
    case 20: // LB=0
      if (state['LB'] == 0) {
        roar |= 1;
      }
      break;
    case 21: // LB=3     // Test LB value
      if (state['LB'] == 3) {
        roar |= 1;
      }
      break;
    case 22: // MD=0
      if (state['MD'] == 0) {
        roar |= 1;
      }
      break;
    case 23: // G2=0
      if (state['G2'] == 0) {
        roar |= 1;
      }
      break;
    case 24: // G2<0
      if (state['G2'] < 0) {
        roar |= 1;
      }
      break;
    case 25: // G2LB2
      alert('Unimplemented BB ' + entry['BB']);
      break;
    case 26: // I/O
      alert('Unimplemented I/O BB ' + entry['BB']);
      break;
    case 27: // MD/JI
      alert('Unimplemented BB ' + entry['BB']);
      break;
    case 28: // IVA // QT110/0149
      alert('Unimplemented BB ' + entry['BB']);
      break;
    case 29: // I/O
      alert('Unimplemented I/O BB ' + entry['BB']);
      break;
    case 30: // (CAR)
      alert('Unimplemented BB ' + entry['BB']);
      break;
    case 31: // (Z00)
      alert('Unimplemented BB ' + entry['BB']);
      break;
    default: 
      alert('Unimplemented BB ' + entry['BB']);
  }

  // ROS address control
  switch (entry['ZN']) {
    case 0:
      // Use ZF function
      switch (entry['ZF']) {
        case 2: // D→ROARSCAN, // 50Maint p39 QY110. SDR(19-30) to ROAR, SDR(1-3) to scan counter, STR(4) to enable storage stat, SDR(5) to PSS, SDR(6) to supervis stat, SDR(7) to mode (IOMODE). (Unclear if IOMODE set by this or separately).
          alert('Unimplemented ZF ' + entry['ZF']);
          break;
        case 6: // M(03)→ROAR
          roar |= ((state['M'] >> 28) & 0xf) << 2;
          break;
        case 8: // M(47)→ROAR
          roar |= ((state['M'] >> 24) & 0xf) << 2;
          break;
        case 10: // F→ROAR
          roar |= state['F']  << 2;
          break;
        case 12: // ED→ROAR exp diff
          // bits 1-4 minus bits 5-7?
          alert('Unimplemented ZF ' + entry['ZF']);
          break;
        default:
          alert('Unexpected ZF value ' + entry['ZF']);
          break;
      } // ZF case
      break;
    case 1: // SMIF suppress memory instruction fetch
      alert('Unimplemented ZN ' + entry['ZN']);
      break;
    case 2: // AΩ(B=0)→A
      if ((roar & 1) == 0) {
        roar |= 2;
      }
      break;
    case 3: // AΩ(B=1)→A
      if ((roar & 1) == 1) {
        roar |= 2;
      }
      break;
    case 4:
      // Normal path: no change
      break;
    case 5:
      alert('Unexpected ZN ' + entry['ZN']);
      break;
    case 6: // BΩ(A=0)→B // QT115/020A
      if ((roar & 2) == 0) {
        roar |= 1;
      }
      break;
    case 7: // BΩ(A=1)→B // QT120/01CC
      if ((roar & 2) == 2) {
        roar |= 1;
      }
      break;
    default: 
      alert('Unimplemented ZN ' + entry['ZN']);
      break;
  }

  state['ROAR'] = roar;
}
