// The 360 microcode simulator engine

// state is the current processor state
// entry is the ROS entry
// Returns message if any
function cycle(state, entry) {
  try {
    adderLX(state, entry);
    adderRY(state, entry);
    adderDG(state, entry);
    adderT(state, entry);

    roar(state, entry); // Need roar before mover to get old W, see 2B7. Need before localStorage read
    roarAB(state, entry);
    roarBB(state, entry);
    roarZN(state, entry);

    mover(state, entry);
    var msg = adderAL(state, entry);
    stat(state, entry);
    storeMover(state, entry);
    iar(state, entry);
    iar2(state, entry); // iar operations after mover
    counters(state, entry); // Need counters after mover, see QK801:0992
    storePending(state);
    localStorageLSAR(state, entry); // Need to do mover before reading localStorage 0126
    var msg2 = adderLatch(state, entry);
    localStorage(state, entry); // Need to do mover before reading localStorage 0126. Need to do this after R is written. See QB730:0220
    if (msg) {
      console.log(msg);
    }
    if (msg2) {
      console.log(msg2);
    }
    return msg || msg2;
  } catch (e) {
    if (e == 'TRAP') {
      state['TRAP'] = 1; // For testing
      return 'Trap to ' + state['ROAR'];
    } else {
      console.log('Unexpected exception ' + e);
      throw e; // Unexpected exception
    }
  }
}

// PSW = SYSMASK, KEY, AMWP, IRUPT; ILC, CR, PROGMASK, IAR

// Format d as 4 hex bytes
function fmt4(d) {
  return d.toString(16).padStart(8, '0');
}

// Sets state['XG'] based on entry['LX'] and TC
function adderLX(state, entry) {
  var xg = 0;
  switch (entry['LX']) { // left input to adder [XG]
    case 0: // No adder input
      xg = 0;
      break;
    case 1: // L
      xg = state['L'];
      break;
    case 2: // SGN
      xg = 0x80000000; // Sign bit
      break;
    case 3: // E  // E is shifted left one bit
      xg = entry['CE'] << 1;
      break;
    case 4: // LRL // L23→XG01 QT115/0189, QC301/003F
      // and L(16-13) to M(16-31) via BUS (0-15) LRL→MHL QE580/070b
      xg = (state['L'] & 0xffff) << 16;
      break;
    case 5: // LWA
      alert('Unimplemented LX ' + entry['LX'] + " " + labels['LX'][entry['LX']]);
      break;
    case 6: // 4
      xg = 4;
      break;
    case 7: // 64C  -- F2E QY310: carry
      // QG700:0541 64 complement for excess-64 correct
      alert('Unimplemented LX ' + entry['LX'] + " " + labels['LX'][entry['LX']]);
      break;
    default:
      alert('Unexpected LX ' + entry['LX'] + " " + labels['LX'][entry['LX']]);
      break;
  }
  if (entry['TC'] == 0) {
    // Subtract
    xg = (~xg) >>> 0; // 1's complement
  }
  state['XG'] = xg;
}

// Sets state['Y'] based on entry['RY']
function adderRY(state, entry) {
  // Right input to adder Y
  var y = 0;
  switch (entry['RY']) {
    case 0: '0' // No input
      y = 0;
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
      alert('Unimplemented RY ' + entry['RY'] + " " + labels['RY'][entry['RY']]);
      break;
    case 6: // unused
      alert('Unexpected RY ' + entry['RY'] + " " + labels['RY'][entry['RY']]);
      break;
    case 7: // unused
      alert('Unexpected RY ' + entry['RY'] + " " + labels['RY'][entry['RY']]);
      break;
  }
  state['Y'] = y;
}

// Sets carry-in state['CIN'] based on entry['DG']
// Does other DG functions such as G1, G2
function adderDG(state, entry) {
  state['pending'] = state['pending'] || {}; // Initialize if necessary
  var carry = 0;

  // Length counter and carry insert ctrl
  // Inconveniently, we need to do some of the DG operations early, to set up the adder. But
  // we also need to do some of the DG operations late in the cycle, to update registers.
  // The roar checks need to happen in the middle.
  switch (entry['DG']) {
    case 0: // default
      break;
    case 1: // CSTAT→ADDER
      carry = state['CSTAT'];
      break;
    case 2: // HOT1→ADDER        // Add 1 bit
      carry = 1;
      break;
    case 3: // G1-1
      state['G1NEG'] = (state['G1'] == 0 ? 1 : 0); // Update underflow
      state['pending']['G1'] = (state['G1'] - 1) & 0xf;
      break;
    case 4: // HOT1,G-1
      carry = 1;
      state['G1NEG'] = (state['G1'] == 0 ? 1 : 0); // Update underflow
      if (state['G2'] == 0) {
        state['pending']['G1'] = (state['G1'] - 1) & 0xf;
      }
      state['pending']['G2'] = (state['G2'] - 1) & 0xf;
      break;
    case 5: // G2-1
      state['G2NEG'] = (state['G2'] == 0 ? 1 : 0); // Update underflow
      state['pending']['G2'] = (state['G2'] - 1) & 0xf;
      break;
    case 6: // G-1
      // Need to update G1NEG, G2NEG?
      if (state['G2'] == 0) {
        state['pending']['G1'] = (state['G1'] - 1) & 0xf;
      }
      state['pending']['G2'] = (state['G2'] - 1) & 0xf;
      break;
    case 7: // G1,2-1
      state['G1NEG'] = (state['G1'] == 0 ? 1 : 0); // Update underflow
      state['G2NEG'] = (state['G2'] == 0 ? 1 : 0); // Update underflow
      state['pending']['G1'] = (state['G1'] - 1) & 0xf;
      state['pending']['G2'] = (state['G2'] - 1) & 0xf;
      break;
    default:
      alert('Unexpected DG ' + entry['DG'] + " " + labels['DG'][entry['DG']]);
      break;
  }

  if (entry['AD'] == 9) { // DC0
    carry = state['S'][1]; // See QE900, 0848
  }

  state['CIN'] = carry;
}

// Does the actual addition using XG, Y and CIN. Sets state['T']
// Adder AD functions, mostly setting carry flag
function adderT(state, entry) {
  var t;

  var xg = state['XG'];
  var y = state['Y'];
  var carry = state['CIN']
  t = xg + y + carry;

  var c0 = (t >= 0x100000000) ? 1 : 0;
  var c1 = (((xg & 0x7fffffff) + (y & 0x7fffffff) + carry) & 0x80000000) ? 1 : 0;

  t = t >>> 0; // Force Javascript to give an unsigned result
  state['T'] = t;
 
  // See CROS page 33 for carry info
  switch (entry['AD']) {
    case 0:
      alert('Instruction with AD=0 should never be accessed.')
      break;
    case 1:
      // 1 is default
      break;
    case 2: // BCFO
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 3:
      alert('Unexpected AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 4: // BC0
      // Carry from position 0.
      state['CAR'] = c0;
      break;
    case 5: // BC⩝C
      // QB730:220: Save CAR(0) ⩝ CAR(1). Test overflow.
      state['CAR'] = (c0 != c1) ? 1 : 0;
      break;
    case 6: // BC1B // Block carry from 8, save carry from 1  QG700:503  i.e. MIER+MCND-64 CLF116
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 7: // BC8
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 8: // DHL
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 9: // DC0
      state['S'][1] = c0;
      state['L'] = 0x66666666; // Decimal correction to L
      break;
    case 10: // DDC0
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 11: // DHH
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 12: // DCBS
      alert('Unimplemented AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 13:
    case 14:
    case 15:
    default:
      alert('Unexpected AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break
  } // AD
  state['T'] = t;
}

// Force n to unsigned 32-bit
function u32(n) {
  return n >>> 0;
}

// Force n to unsigned 4-bit
function u4(n) {
  return n & 0xf;
}

// Shifts 32-bit reg right 1 bit, shifting one bit from 4-bit src in at top.
// Bit from reg is shifted into 4-bit dst
// Returns [new reg, new dst]
function sr1(src, reg, dst) {
  var reg1 = ((src & 1) << 31) | (reg >>> 1);
  var dst1 = ((reg & 1) << 3) | (dst >> 1);
  return [u32(reg1), u4(dst1)];
}

// Shifts 32-bit reg left 1 bit, shifting one bit from 4-bit src in at bottom.
// Bit from reg is shifted into 4-bit dst
// Returns [new reg, new dst]
function sl1(src, reg, dst) {
  var reg1 = (reg << 1) | ((src >>> 3) & 1);
  var dst1 = (dst << 1) | (reg >>> 31);
  return [u32(reg1), u4(dst1)];
}

// Shifts 32-bit reg right 4 bits, shifting 4-bit src in at top.
// 4 bottom bits from reg are returned in dst
// Returns [new reg, dst]
function sr4(src, reg) {
  var reg1 = ((src & 0xf) << 28) | (reg >>> 4);
  var dst1 = reg & 0xf;
  return [u32(reg1), u4(dst1)];
}

// Shifts 32-bit reg left 4 bits, shifting 4-bit src in at bottom.
// 4 top bits from reg are returned in dst
// Returns [new reg, dst]
function sl4(src, reg) {
  var reg1 = (reg << 4) | (src & 0xf);
  var dst1 = reg >>> 28;
  return [u32(reg1), u4(dst1)];
}

function adderAL(state, entry) {
  msg = '';
  // Shift gate and adder latch control
  switch (entry['AL']) {
    case 0: // Normal
      break;
    case 1: // Q→SR1→F
      var s = sr1(state['Q'], state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 2: // L0,¬S4→
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 3: // +SGN→
      state['T'] &= 0x7fffffff;
      break;
    case 4: // -SGN→
      state['T'] = (state['T'] | 0x80000000) >>> 0;
      break;
    case 5: // L0,S4→
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 6: // IA→H // Handled by D
      if (state['IAR'] == undefined) {alert('undefined iar');}
      state['H'] = state['IAR'];
      break;
    case 7: // Q→SL→-F
      var s = sl1(state['Q'] << 3, state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1] ^ 0x1; // Negate new (bottom) bit
      break;
    case 8: // Q→SL1→F
      var s = sl1(state['Q'] << 3, state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 9: // F→SL1→F
      var s = sl1(state['F'], state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 10: // SL1→Q
      var s = sl1(0, state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1];
      break;
    case 11: // Q→SL1
      var s = sl1(state['Q'] << 3, state['T'], 0);
      state['T'] = s[0];
      break;
    case 12: // SR1→F
      var s = sr1(0, state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 13: // SR1→Q
      var s = sr1(0, state['T'], state['Q']);
      state['T'] = s[0];
      state['Q'] = s[1] >> 3; // Convert 4-bit result to 1-bit Q
      break;
    case 14: // Q→SR1→Q
      var s = sr1(state['Q'], state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1] >> 3; // Convert 4-bit result to 1-bit Q
      break;
    case 15: // F→SL1→Q
      var s = sl1(state['F'], state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1];
      break;
    case 16: // SL4→F    // Shift adder output left by 4, also put in F.
      var s = sl4(0, state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 17: // F→SL4→F
      var s = sl4(state['F'], state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 18: // FPSL4
      // What's the difference between SL4 and FPSL4?
      state['T'] = state['T'] << 4;
      break;
    case 19: // F→FPSL4
      var s = sl4(state['F'], state['T']);
      state['T'] = s[0];
      break;
    case 20: // SR4→F
      var s = sr4(0, state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 21: // F→SR4→F
      var s = sr4(state['F'], state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 22: // FPSR4→F
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 23: // 1→FPSR4→F
      // Hypothesis
      var f1 = state['T'] & 0xf;
      state['T'] = (state['T'] >>> 4) | (1 << 28);
      state['F'] = f1;
      break;
    case 24: // SR4→H
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 25: // F→SR4
      var s = sr4(state['F'], state['T']);
      state['T'] = s[0];
      break;
    case 26: // E→FPSL4
      // Just a guess based on QK800:09b2
      state['T'] = (((state['T'] << 4) | entry['CE']) & 0xffffffff) >>> 0;
      break;
    case 27: // F→SR1→Q
      var s = sr1(state['F'], state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1] >> 3;
      break;
    case 28: // DKEY→ // Handled by D, data keys
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 29:
      alert('Unimplemented I/O AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
    case 30: // D→ // Handled by D
      msg = read(state);
      state['T'] = state['SDR'];
      break;
    case 31: // AKEY→ // Handled by D, address keys
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    default:
      alert('Unexpected AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
  } // AL
  return msg;
}

// Perform a ROS-level trap. See CLF 122 / QT300
function rosTrap(state, addr) {
  state['ROAR'] = addr;
  throw(Error('TRAP'));
}

function trapStorProt(state) {
  rosTrap(state, 0x0142);
}

function trapInvalidOpndAddr(state) {
  rosTrap(state, 0x01c0);
}

function trapAddrSpecViolation(state) {
  rosTrap(state, 0x01c2);
}

// Invalid decimal data or sign
function trapInvalidDecimal(state) {
  rosTrap(0x0140);
}

// Write memory: call after setting SDR
// Assume SAR and SDR set up
function store(state) {
  state['MS'][state['SAR'] & ~3] = state['SDR'];
  return 'Storing ' + fmt4(state['SDR']) + ' in ' + fmt4(state['SAR']);
}

// Read memory: call before using SDR
// Assume SAR
function read(state) {
  // Add some bounds to memory? Or just implement the whole 16 MB?
  state['SDR'] = state['MS'][state['SAR'] & ~3];
  if (state['SDR'] == undefined) {
    state['SDR'] = 0x12345678; // Random value in uninitialized memory.
  }
  return 'Read ' + fmt4(state['SDR']) + ' from ' + fmt4(state['SAR']);
}

function checkaddr(state, alignment) {
  if (state['SAR'] & (alignment-1)) {
   console.log('alignment?');
   // trapAddrSpecViolation(state);
  }
}

// Helper functions
function x0(state) {
  // (X=0)→S0, where X = T(12-15)
  state['S'][0] = (state['T'] & 0x000f0000) == 0 ? 1 : 0;
}

function b0(state) {
  // (B=0)→S1, where B = T(16-19)
  state['S'][1] = (state['T'] & 0x0000f000) == 0 ? 1 : 0;
}

function syl1(state) {
  // Set 1SYL
  var op0 = state['T'] >>> 28;
  if (op0 <= 3) {
    state['1SYL'] = 1; // RR
  } else {
    state['1SYL'] = 0;
  }
}

// Store any pending entries
function storePending(state) {
  var pending = state['pending'];
  if (pending) {
    var keys = Object.keys(pending);
    for (var i = 0; i < keys.length; i++) {
      state[keys[i]] = state['pending'][keys[i]];
    }
    delete state['pending'];
  }
  // Store carry CAR to CSTAT
  state['CSTAT'] = state['CAR']
}

function adderLatch(state, entry) {
  // Adder latch destination
  var msg = '';
  var t = state['T'];
  switch (entry['TR']) {
    case 0: // T
      break;
    case 1: // R
      state['R'] = t;
      break;
    case 2: // R0
      state['R'] = ((t & 0xff000000) | (state['R'] & 0x00ffffff)) >>> 0;
      break;
    case 3: // M
      state['M'] = t;
      break;
    case 4: // D
      state['SDR'] = t;
      msg = store(state);
      break;
    case 5: // L0
      state['L'] = ((t & 0xff000000) | (state['L'] & 0x00ffffff)) >>> 0;
      break;
    case 6: // R,A       // stores to R and address reg.
      state['R'] = t;
      state['SAR'] = t;
      checkaddr(state, 8);
      break;
    case 7: // L
      state['L'] = t;
      break;
    case 8: // HA→A   Complicated hardware address implementation.
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 9: // R,AN // QT220/20d
      // AN means No IV addr trap 
      state['R'] = t;
      state['SAR'] = t;
      checkaddr(state, 1);
      break;
    case 10: // R,AW
      // QA111: check word adr
      state['R'] = t;
      state['SAR'] = t;
      checkaddr(state, 4);
      break;
    case 11: // R,AD
      // QG010: check double word adr
      state['R'] = t;
      state['SAR'] = t;
      checkaddr(state, 8);
      break;
    case 12: // D→IAR // under D
      msg = read(state);
      state['IAR'] = state['SDR'] & 0x000fffff; // IAR is 20-bit
      break;
    case 13: // SCAN→D // under D        Scan bits 0-27 (extended with parity) to D. QY410
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 14: // R13
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 15: // A // QP100/614
      state['SAR'] = t;
      checkaddr(state, 2);
      break;
    case 16: // L,A
      state['L'] = t;
      state['SAR'] = t;
      checkaddr(state, 2);
      break;
    case 17:
      alert('Unimplemented I/O TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 18:
      alert('Unexpected TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 19:
      alert('Unimplemented I/O TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 20: // H
      state['H'] = t;
      break;
    case 21: // IA
      state['IAR'] = t;
      break;
    case 22: // FOLD→D // under D // 50Maint p32. FLT reg bit 0 specifies fold; maps 36 bit registers (i.e. with 4 parity) onto two 32 bit storage. Accesses folded part of SCAN QY410
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 23:
      alert('Unexpected TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 24: // L,M
      state['L'] = t;
      state['M'] = t;
      break;
    case 25: // MLJK     // store to L, M, 12-15 to J, 16-19 to MD  QY310, QT110. 
    // CLF 001: L16-31 (i.e. LRL) → M 0-15, L28-31 (X) → J, ILC = length, 
    // S1 on, S0 on if X=0.
    // QT115:14e: T → L, M. 0→Refetch, T(12-15)→J, T(16-19)→MD, (X=0)→ S0,
    // 16-19(B) → MD, 12-15 (X) → J, set ILC, 1SYL. (B=0)→S1
      state['L'] = state['T'];
      state['M'] = state['T'];
      state['REFETCH'] = 0;
      state['J'] = (state['T'] >>> 16) & 0xf;
      state['MD'] = (state['T'] >>> 12) & 0xf;
      b0(state);
      x0(state);
      syl1(state);
      var op0 = state['T'] >>> 28;
      // See PrincOpsDec67 page 89 for information on ILC
      if (op0 <= 3) { // Instruction starts with 00
        state['ILC'] = 1;
      } else if (op0 <= 0xb) { // Instruction starts with 01 or 10
        state['ILC'] = 2;
      } else { // Instruction starts with 11
        state['ILC'] = 3;
      }
      break;
    case 26: // MHL  T(0-3)→MD, T(0-15)→M(16,31) QC301/003F
      state['MD'] = (state['T'] >> 28) & 0xf;
      state['M'] = ((state['M'] & 0xffff0000) | ((state['T'] >>> 16) & 0xfffff)) >>> 0;
      break;
    case 27: // MD
      // From CLF 001: bits 8-11 (R1) moved to MD
      state['MD'] = (t >>> 20) & 0xf;
      break;
    case 28: // M,SP // QT200/0193
      state['M'] = t;
      state['SP'] = t & 0xf;
      break;
    case 29: // D*BS     // SDR bytes stats. Store bytes to D (i.e. main memory) where BS bit is high QK801:09b7
      read(state);
      var mem = state['SDR'];
      var d = 0;
      for (var i = 0; i < 4; i++) {
        if (state['BS'][i]) {
          d |= state['T'] & bytemask[i];
        } else {
          d |= mem & bytemask[i];
        }
      }
      d = d >>> 0; // convert to unsigned
      state['SDR'] = d;
      msg = store(state);
      break;
    case 30: // L13 // QP206/0D95
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 31: // J
      state['J'] = t & 0xf;
      break;
    default:
      alert('Unexpected TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
  } // TR
  return msg;
}

  // Mask for byte 0, 1, 2, 3
bytemask = [0xff000000, 0x00ff0000, 0x0000ff00, 0x000000ff];
byteshift = [24, 16, 8, 0];

function mover(state, entry) {
  // Mover input left side → U
  var u;
  // See CROS manual page 25 for left mover bit patterns
  switch (entry['LU']) {
    case 0: // no value
      u = 0;
      break;
    case 1: // MD,F      // MD and F registers (4 bits each)
      u = (state['MD'] << 4) | state['F'];
      break;
    case 2: // R3        // R3 = low byte (byte 3, right) of register R
      u = state['R'] & 0xff;
      break;
    case 3: // I/O
      alert('Unimplemented LU ' + entry['LU'] + " " + labels['LU'][entry['LU']]);
      break;
    case 4: // XTR       // Parity error (extra bit)? Reset by reading. QU100
      u = 0;
      break;
    case 5: // PSW4      // PSW word 4.
      u = state['PROGMASK'];
      break;
    case 6: // LMB       // L indexed by MB
      u = (state['L'] & bytemask[state['MB']]) >> byteshift[state['MB']];
      break;
    case 7: // LLB
      u = (state['L'] & bytemask[state['LB']]) >> byteshift[state['LB']];
      break;
    default:
      alert('Unexpected LU ' + entry['LU'] + " " + labels['LU'][entry['LU']]);
      break;
  }

  // Mover input right side → V
  var v = undefined;
  switch (entry['MV']) {
    case 0: // no value
      v = 0;
      break;
    case 1: // MLB
      v = (state['M'] & bytemask[state['LB']]) >> byteshift[state['LB']];
      break;
    case 2: // MMB
      v = (state['M'] & bytemask[state['MB']]) >> byteshift[state['MB']];
      break;
    case 3:
    default:
      alert('Unexpected MV ' + entry['MV'] + " " + labels['MV'][entry['MV']]);
      break;
  }

  var wl = 0; // wl is a 4-bit value
  switch (entry['UL']) {
    case 0: // E // E→WL in d29
      wl = entry['CE'];
      break;
    case 1: // U   default: pass undefined through
      wl = u >> 4;
      break;
    case 2: // V
      wl = v >> 4;
      break;
    case 3: // ? Use mover function
      switch (state['WFN']) {
        case 0: // cross
          wl = u & 0xf;
          break;
        case 1: // or
          wl = (u | v) >>> 4;
          break;
        case 2: // and
          wl = (u & v) >>> 4;
          break;
        case 3: // xor
          wl = (u ^ v) >>> 4;
          break;
        case 4: // character
          wl = u >>> 4;
          break;
        case 5: // zone
          wl = u >>> 4; // move uppwer nybble
          break;
        case 6: // numeric
          wl = v >>> 4; // Don't move lower nybble
          break;
        case 7: //unused
        default:
          alert('Unexpected mover function ' + state['WFN']);
          break;
      }

      break;
    default:
      alert('Unexpected UL ' + entry['UL'] + " " + labels['UL'][entry['UL']]);
  }

  var wr;
  switch (entry['UR']) {
    case 0: // E
      wr = entry['CE'];
      break;
    case 1: // U   default: pass undefined through
      wr = u & 0xf;
      break;
    case 2: // V // or VR
      wr = v & 0xf;
      break;
    case 3: // ? use mover function
      switch (state['WFN']) {
        case 0: // cross
          wr = u >>> 4;
          break;
        case 1: // or
          wr = (u | v) & 0xf;
          break;
        case 2: // and
          wr = (u & v) & 0xf;
          break;
        case 3: // xor
          wr = (u ^ v) & 0xf;
          break;
        case 4: // character
          wr = u & 0xf;
          break;
        case 5: // zone
          wr = v & 0xf; // Don't move low nybble
          break;
        case 6: // numeric
          wr = u & 0xf;
          break;
        case 7: //unused
        default:
          alert('Unexpected mover function ' + state['WFN']);
          break;
      }
      break;
    default:
      alert('Unexpected UR ' + entry['UR'] + " " + labels['UR'][entry['UR']]);
      break;
  }

  state['U'] = u;
  state['V'] = v;
  state['WL'] = wl;
  state['WR'] = wr;
  var w = (wl << 4) | wr;
  state['W'] = w;
}

function storeMover(state, entry) {
  // Mover output destination W →
  switch (entry['WM']) {
    case 0: // no action
      break;
    case 1: // W→MMB     // W to M indexed by MB
      state['M'] = ((state['M'] & ~bytemask[state['MB']]) | (state['W'] << byteshift[state['MB']])) >>> 0;
      break;
    case 2: // W67→MB    // W bits 6-7 to MB
      state['MB'] = state['WR'] & 3;
      break;
    case 3: // W67→LB   // W bits 6-7 to LB
      state['LB'] = state['WR'] & 3;
      break;
    case 4: // W27→PSW4 // W bits 2-7 to PSW bits 34-39 QJ200. Turns off load light too.
      // i.e. CR and program mask
      state['CR'] = (state['W'] & 0x30) >>> 4;
      state['PROGMASK'] = state['W'] & 0xf;
      break;
    case 5: // W→PSW0    // PSW bits 0-7, system mask
      state['SYSMASK'] = state['W'];
      break;
    case 6: // WL→J
      state['J'] = state['WL'];
      break;
    case 7: // W→CHCTL           // Channel control: 0001 is start I/O, 0100 is test I/O. Updates R, M, DA, L (see QK800). M0 = unit status. L1 is channel end status
      chctl(state, entry); // in io.js
      break;
    case 8: // W,E→A(BUMP) // W,E(23) selects bump sector address. Bits shuffled, see 5- Maint p81.
      // Fake the bump address for now
      state['SAR'] = 0x1000000 | (state['W'] << 4) | ((entry['CE'] & 3) << 2);
      break;
    case 9: // WL→G1
      state['G1'] = state['WL'];
      break;
    case 10: // WR→G2
      state['G2'] = state['WR'];
      break;
    case 11: // W→G
      state['G1'] = state['WL'];
      state['G2'] = state['WR'];
      break;
    case 12: // W→MMB(E?) // d29
      alert('Unimplemented WM ' + entry['WM'] + " " + labels['WM'][entry['WM']]);
      break;
    case 13: // WL→MD
      state['MD'] = state['WL'];
      break;
    case 14: // WR→F
      state['F'] = state['WR'];
      break;
    case 15: // W→MD,F
      state['MD'] = state['WL'];
      state['F'] = state['WR'];
      break;
    default:
      alert('Unexpected WM ' + entry['WM'] + " " + labels['WM'][entry['WM']]);
      break;
  }
}

// Instruction address reg control
  // These need to happen after the mover so are implemented here.
function iar2(state, entry) {
  switch (entry['IV']) {
    case 1: // WL→IVD  trap on invalid digit
      if (state['WL'] > 9) {
        trapInvalidDecimal(state);
      }
      break;
    case 2: // WR→IVD
      // QS304: 0e25: check for invalid digit
      if (state['WR'] > 9) {
        trapInvalidDecimal(state);
      }
      break;
    case 3: // W→IVD
      if (state['WL'] > 9 || state['WR'] > 9) {
        trapInvalidDecimal(state);
      }
      break;
  }
}

// Update LB, MB, MD
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
        state['MD'] = 3;
      }
      break;
    case 2: // -   Should negative numbers wrap or be a flag?
      if (entry['LB']) {
        state['LB'] = (state['LB'] - 1) & 3;
      }
      if (entry['MB']) {
        state['MB'] = (state['MB'] - 1) & 3;
      }
      if (entry['MD']) {
        state['MD'] = (state['MD'] - 1) & 0xf;
      }
      break;
    case 3: // + // QT120/01CE
      if (entry['LB']) {
        state['LB'] = (state['LB'] + 1) & 3;
      }
      if (entry['MB']) {
        state['MB'] = (state['MB'] + 1) & 3;
      }
      if (entry['MD']) {
        state['MD'] = (state['MD'] + 1) & 0xf;
      }
      break;
    default:
      alert('Unexpected UP ' + entry['UP'] + " " + labels['UP'][entry['UP']]);
      break;
  }
}

function localStorageLSAR(state, entry) {
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
    case 3: // WS,E→LSA // QP206/D94
      state['LSAR'] = 0x30 | entry['CE'];
      break;
    case 4: // FN,J→LSA
      // SF=7 is only used with WS=4, and disables it
      if (entry['SF'] != 7) {
        state['LSAR'] = (state['FN'] << 4) | state['J'];
      }
      break;
    case 5: // FN,JΩ1→LSA
      state['LSAR'] = (state['FN'] << 4) | state['J'] | 1;
      break;
    case 6: // FN,MD→LSA
      state['LSAR'] = (state['FN'] << 4) | state['MD'];
      break;
    case 7: // FN,MDΩ1→LSA
      state['LSAR'] = (state['FN'] << 4) | state['MD'] | 1;
      break;
    default:
      alert('Unexpected WS ' + entry['WS'] + " " + labels['WS'][entry['WS']]);
      break;
  }
}

function localStorage(state, entry) {
  // Local storage function
  switch (entry['SF']) {
    case 0: // R→LS // QT210/1A3
      state['LS'][state['LSAR']] = state['R'];
      break;
    case 1: // LS→LR→LS, 
      state['L'] = state['LS'][state['LSAR']];
      state['R'] = state['LS'][state['LSAR']];
      break;
    case 2: // LS→R→LS 
      state['R'] = state['LS'][state['LSAR']];
      break;
    case 3:
      alert('Unexpected SF ' + entry['SF'] + " " + labels['SF'][entry['SF']]);
      break;
    case 4: // L→LS // QP206/D95
      state['LS'][state['LSAR']] = state['L'];
      break;
    case 5: // LS→R,L→LS
      state['R'] = state['LS'][state['LSAR']];
      state['LS'][state['LSAR']] = state['L'];
      break;
    case 6: // LS→L→LS // QP206/D94
      state['L'] = state['LS'][state['LSAR']];
      break;
    case 7: // No storage function
      if (entry['WS'] != 4) {
        alert('Unexpected SF ' + entry['SF'] + ' with SF ' + entry['SF'] + " " + labels['SF'][entry['SF']]);
      }
      break;
    default:
      alert('Unexpected SF ' + entry['SF'] + " " + labels['SF'][entry['SF']]);
      break;
  }
}

// Instruction address reg control
function iar(state, entry) {
  switch (entry['IV']) {
    case 0: // default
      break;
    case 1: // WL→IVD
      // implemented in mover
      break;
    case 2: // WR→IVD
      // implemented in mover
      break;
    case 3: // W→IVD
      // implemented in mover
      break;
    case 4: // IA/4→A,IA
      state['IAR'] += 4;
      state['SAR'] = state['IAR'];
      break;
    case 5 : // IA+2/4 // QT115/019B
      // CLF 001: IAR += 2 if ILC = 01, IAR += 4 if ILC = 1X
      if (state['ILC'] == 1) {
        state['IAR'] += 2;
      } else if (state['ILC'] == 2 || state['ILC'] == 3) {
        state['IAR'] += 4;
      }
      break;
    case 6 : // IA+2 // QT120/018B
      state['IAR'] += 2;
      break;
    case 7: // IA+0/2→A // QP206/0D94 Also IA+0+2→A: QT115/0199 
      // CLF 001 says +2 if ref is off, +0 if ref is on.
      if (entry['ZN'] == 1) {
        // SMIF: Suppress Memory Instruction Fetch
        if (state['REFETCH'] == 0 && (state['IAR'] & 3) != 0) {
          // Half-word alignment, no refetch. Skip fetch because using op buffer.
          break;
        }
      }
      if (state['REFETCH'] == 1) {
        // Seems like we need to adjust the alignment when refetching
        state['SAR'] = state['IAR'];
      } else {
        state['SAR'] = (state['IAR'] + 2) & ~0x3;
      }
      break;
    default:
      alert('Unimplemented IV ' + entry['IV'] + " " + labels['IV'][entry['IV']]);
      break;
  }
}

function stat(state, entry) {
  // C: Stat setting and misc control
  switch (entry['SS']) {
    case 0: // default;
      break;
    case 1:
    case 2:
    case 3:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 4: // E→SCANCTL // Performs scan operation controlled by E. See 50Maint p32. 0101 clears SCPS,SCFS QU100. 0011 ignore IO error. 0000 test for all ones, step bin trigger. 0001 sets SCPS,SCFS.
      // 1000 moves SDR(0-2) to CTR (clock advance counter) STR(5) to PSS (progressive scan stat), SDR(6) to SST (supervisory stat) QY110
      alert('Unimplemented SCANTRL ' + entry['CE'] + " " + labels['SS'][entry['SS']]);
      switch (entry['CE']) {
        case 1:
          state['SCPS'] = 1;
          state['SCFS'] = 1;
          break
        case 3:
          // Ignore I/O error QJ200:0731
          break
        case 5:
          state['SCPS'] = 0;
          state['SCFS'] = 0;
          break;
        case 12:
          // Turn off log trig (for machine check traps)
          // QT310:010e
          break;
        default:
          alert('Unimplemented SCANTRL ' + entry['CE'] + " " + labels['SS'][entry['SS']]);
          break;
      }
      break;
    case 5: // L,RSGNS: QE900
      // Trap if invalid sign. Valid sign is 0xa to 0xf; 0xa, 0xc, 0xe, 0xf positive, 0xb, 0xd negative.
      // See Principles of Operation page 36.
      // QS400 0d05: if -, 1→LSGN, ¬RSGN
      // if +, 0→LSGN
      // Value tested is in U apparently.
      if ([0xa, 0xc, 0xe, 0xf].includes(state['U'])) { // Positive
        state['LSGNS'] = 0;
      } else if ([0xb, 0xd].includes(state['U'])) { // Negative
        state['LSGNS'] = 1;
        state['RSGNS'] = 0;
      } else {
        trapInvalidDecimal(state);
      }
      break;
    case 6: // IVD/RSGNS
    // QS200:E26: if -, clear RSGN. If not sign, trap.
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 7: // EDITSGN
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 8: // E→S03             // S03 = stats 0-3 50Maint p183, QU100
      var e = entry['CE'];
      state['S'][0] = (e >> 3) & 1;
      state['S'][1] = (e >> 2) & 1;
      state['S'][2] = (e >> 1) & 1;
      state['S'][3] = (e >> 0) & 1;
      break;
    case 9: // S03ΩE,1→LSGN
      state['LSGNS'] = 1;
      var e = entry['CE'];
      state['S'][0] |= (e >> 3) & 1;
      state['S'][1] |= (e >> 2) & 1;
      state['S'][2] |= (e >> 1) & 1;
      state['S'][3] |= (e >> 0) & 1;
      break;
    case 10: // S03ΩE            // Set S03 bits from E
      var e = entry['CE'];
      state['S'][0] |= (e >> 3) & 1;
      state['S'][1] |= (e >> 2) & 1;
      state['S'][2] |= (e >> 1) & 1;
      state['S'][3] |= (e >> 0) & 1;
      break;
    case 11: // S03ΩE,0→BS
      state['BS'] = [0, 0, 0, 0];
      var e = entry['CE'];
      state['S'][0] |= (e >> 3) & 1;
      state['S'][1] |= (e >> 2) & 1;
      state['S'][2] |= (e >> 1) & 1;
      state['S'][3] |= (e >> 0) & 1;
      break;
    case 12: // X0,B0,1SYL      (B=0)→S1, set 1 SYL. QC031/003F
      x0(state);
      b0(state);
      syl1(state);
      break;
    case 13: // FPZERO
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 14: // FPZERO,E→FN
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 15: // B0,1SYL // (B=0)→S1, set 1SYL QT115/0189
      b0(state);
      syl1(state);
      break;
    case 16: // S03.¬E           // Clear S03 bits from E
      for (var i = 0; i < 4; i++) {
        state['S'][i] &= ~(entry['CE']>>(3-i));
      }
      break;
    case 17: // (T=0)→S3
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 18: // E→BS,T30→S3
      // 01C6
      for (var i = 0; i < 4; i++) {
        state['BS'][i] = (entry['CE'] & (1<<(3-i))) ? 1 : 0;
      }
      state['S'][3] = (state['T'] >> 1) & 1; // T(30)→S3, branch address halfword indicator
      break;
    case 19: // E→BS             // Store E to byte stats (i.e. byte mask)
      for (var i = 0; i < 4; i++) {
        state['BS'][i] = (entry['CE'] & (1<<(3-i))) ? 1 : 0;
      }
      break;
    case 20: // 1→BS*MB
      state['BS'][state['MB']] = 1;
      break;
    case 21:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 22:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 23: // MANUAL→STOP      // M trig to S (Halt status) QU100
      // Ignore.
      break;
    case 24: // E→S47            // Write E to channel S bits 4-7
      state['S'][4] = (entry['CE'] >>> 3) & 1;
      state['S'][5] = (entry['CE'] >>> 2) & 1;
      state['S'][6] = (entry['CE'] >>> 1) & 1;
      state['S'][7] = (entry['CE'] >>> 0) & 1;
      break;
    case 25: // S47ΩE            // S bits 4-7 |= E. Set bits indicated by E
      state['S'][4] |= (entry['CE'] >>> 3) & 1;
      state['S'][5] |= (entry['CE'] >>> 2) & 1;
      state['S'][6] |= (entry['CE'] >>> 1) & 1;
      state['S'][7] |= (entry['CE'] >>> 0) & 1;
      break;
    case 26: // S47.¬E           // S bits 4-7 &= ~E. I.e. clear bits indicated by E
      state['S'][4] &= ~((entry['CE'] >>> 3) & 1);
      state['S'][5] &= ~((entry['CE'] >>> 2) & 1);
      state['S'][6] &= ~((entry['CE'] >>> 1) & 1);
      state['S'][7] &= ~((entry['CE'] >>> 0) & 1);
      break;
    case 27: // S47,ED*FP  QG700:0503
      // Norm sign → S4
      // Compl add → S4
      // (ED<16) → S6
      // (ED=0) → S7
      // Set exp dif reg 
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 28: // OPPANEL→S47      // Write operator panel to S bits 4-7
      // See QT200 for mapping from console switches to S47
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 29: // CAR,(T≠0)→CR
      state['CR'] = (state['CAR'] ? 2 : 0) | (state['T'] != 0 ? 1 : 0);
      break;
    case 30: // KEY→F // QT115/020E
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 31: // F→KEY // QT220/02BF
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 32: // 1→LSGNS
      state['LSGNS'] = 1;
      break;
    case 33: // 0→LSGNS
      state['LSGNS'] = 0;
      break;
    case 34: // 1→RSGNS
      state['RSGNS'] = 1;
      break;
    case 35: // 0→RSGNS
      state['RSGNS'] = 0;
      break;
    case 36: // L(0)→LSGNS
      state['LSGNS'] = (state['L'] & 0x80000000) ? 1 : 0;
      break;
    case 37: // R(0)→RSGNS       // R sign stat QY310
      state['RSGNS'] = (state['R'] & 0x80000000) ? 1 : 0;
      break;
    case 38: // E(13)→WFN
      // Seems to also do something with I/O? Maybe I/O mover?
      // .000 = CROSS QA800:01A2
      // .001 = O (OR) QB400:0298
      // .010 = N (AND) QB400:0290
      // .011 = X XOR QC030:0138
      // .100: set mover fn reg to move (8 bit) characters QP800:0608 default???
      // .101: set mover fn reg to move zones (upper 4 bits) QP800:060c
      // .110: set mover fn reg to move numerics (lower 4 bits) QP800:0604
      state['WFN'] = entry['CE'] & 7;
      break;
    case 39: // E(23)→FN // QT120/0102
      state['FN'] = entry['CE'] & 3;
      break;
    case 40: // E(23)→CR
      state['CR'] = entry['CE'] & 3;
      break;
    case 41: // SETCRALG
      // If T=0 00→CR, if T<0, 01→CR, QE580/222. Part may be BCVC
      if (state['T'] == 0) {
        state['CR'] = 0;
      } else if (state['T'] & 0x80000000) {
        state['CR'] = 1; // Negative
      } else {
        state['CR'] = 2; // Positive
      }
      break;
    case 42: // SETCRLOG
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 43: // ¬S4,S4→CR
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 44: // S4,¬S4→CR
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 45: // 1→REFETCH
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 46: // SYNC→OPPANEL // QT200/0107
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 47: // SCAN*E,10        // sets FLT register. See 50Maint p28. Channel address, Unit address to L.
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 48:
      alert('Unexpected I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 49:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 50: // E(0)→IBFULL      // Reset MPX Input Buffer Full stat QU100
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      state['IBFULL'] = (entry['CE'] >> 3) & 1;
      break;
    case 51:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 52: // E→CH             // QY430 E=0110 resets common and mpx channel
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 53:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 54: // 1→TIMERIRPT
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 55: // T→PSW,IPL→T,      // QU100, 50Maint
      // IPL UA → 0-7, IPL CA → 21-23
      // T 12-15 to PSW AMWP control bits
      state['AMWP'] = (state['T'] & 0x000f0000) >>> 16;
      // Hardwire card reader = 00C: channel 0, device 0C
      var ca = 0
      var ua = 0x0c;
      state['T'] = ((ua << 24) | (ca << 8)) >>> 0;
      break;
    case 56: // T→PSW            // T(12-15) to PSW control bits QJ200:751
      state['AMWP'] = (state['T'] & 0x000f0000) >>> 16;
      break;
    case 57: // SCAN*E,00        // E → SCANCTRL(2-5), 0→SCANCTRL(1), (FOLD)→SCANCTRL(0) // U100
      var fold = 0;
      state['SCANCTRL'] = (fold << 7) | entry['CE'] << 2;
      break;
    case 58: // 1→IOMODE // 50Maint p39. Sets I/O mode stat
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 59:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 60:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 61:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 62:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 63:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    default:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
  }
}

// Compute ROAR address
// See special bits in CROS manual page 29
function roar(state, entry) {
  var roar;
  roar = entry['ZP'] << 6;
  if (entry['ZN'] != 0) {
    roar |= entry['ZF'] << 2;
  }
  // otherwise ZF function generates roar bits at bottom of routine
  state['ROAR'] = roar;
}
  
function roarAB(state, entry) {
  // Condition test (left side)
  var roar = state['ROAR'];
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
    case 10: // CSTAT carry stat
      roar |= state['CSTAT'] << 1;
      break;
    case 11:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 12: // 1SYLS
      roar |= state['1SYLS'] << 1;
      break;
    case 13: // LSGNS L Sign Stat
      roar |= state['LSGNS'] << 1;
      break;
    case 14: // ⩝SGNS: LSS xor RSS
      if (state['LSGNS'] != state['RSGNS']) {
        roar |= 2;
      }
      break;
    case 15:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 16: // CRMD     // masked CR → A
      // CROS manual: MD bit 0 & CR23 = 00 or MD1 & CR23 = 10 or MD bit 2 & CR23=01 or MD bit 3 & CR23 = 11
      if (state['MD'] & (1<<(3-state['CR']))) {
        roar |= 2;
      }
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
    case 20: // MD=FP  i.e. MD = 0xx0
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 21: // MB=3   BAM bit 0 and 1
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
      if (state['G1NEG'] == 1) {
        roar |= 2;
      }
      break;
    case 25: // G<4
      if (state['G1'] == 0 && state['G2'] < 4) {
        roar |= 2;
      }
      break;
    case 26: // G1MBZ
      // G1 == 0 or MB == 0 QS400:0D04
      if (state['G1'] == 0 || state['MB'] == 0) {
        roar |= 2;
      }
      break;
    case 27: // IO Stat 0 to CPU
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 28: // IO Stat 2
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 29: // R(31)
      if (state['R'] & 1) {
        roar |= 2;
      }
      break;
    case 30: // F(2)
      if (state['F'] & 2) {
        roar |= 2;
      }
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
    case 33: // UNORM   T8-11 zero and not stat 0
      if (((state['T'] & 0x00f00000) == 0) && state['S'][0] == 0) {
        roar |= 2;
      }
      break;
    case 34: // TZ*BS  T zero per byte stat
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 35: // EDITPAT
      // CROS manual page 31: sets A with edit stat 1, B with edit stat 2.
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 36: // PROB     // Privileged op? QY110  Monitor stat
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 37: // TIMUP   Timer update signal and not manual trigger
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 38:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 39: // GZ/MB3    CCROS: G1 == 0 & G2 == 0   or  BAM0 == 1 & BAM1 == 1
      if ((state['G1'] == 0 && state['G2'] == 0) || state['MB'] == 3) {
        roar |= 2;
      }
      break;
    case 40:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 41: // LOG      // Branch on log scan stat. QY430 0 for FLT log, 1 for error log QY410
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 42: // STC=0    // Check Scan Test Counter
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 43: // G2<=LB
      if (state['G2'] <= state['LB']) {
        roar |= 2;
      }
      break;
    case 44:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 45: // D(7) // test D bit 7 (SDR) QY510
      read(state);
      if (state['SDR'] & (1 << (31-7))) {
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
    case 48: // CROS: Storage protect violation
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 49: // W(67)→AB
      if (entry['BB'] != 0) {
        alert('Unexpected AB 49, BB ' + entry['BB'] + " " + labels['AB'][entry['AB']]);
      }
      roar |= state['W'] & 3;
      break;
    case 50: // CROS T16-31 != 0
    case 51: // CROS T5-7 == 0 && T16-31 != 0
    case 52: // CROS bus in bit 0
    case 53: // CROS IB full
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 54: // CANG
      // CROS: IO mode & (T29-31 not zero or Inv Add)   or  CPU mode & (T29-31 not zero or Inv Add) -- seems redundant
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 55: // CHLOG   CROS: AC log
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 56:
      // I-FETCH does a 4-way branch:
      // 00: off-bounds fetch (i.e. odd halfword)
      // 01: off-bounds, refetch (i.e. can't use instruction in op buffer WS14)
      // 10: on-bounds fetch (i.e. fetching a normal even halfword.)
      // 11: exception for on-bit in instruction counter position 30 (CROS page 31)
      // See e.g. QT105
      if (state['IAR'] & 1) {
        // Alignment exception. Other address exceptions?
        roar |= 3; 
      } else if (state['IAR'] & 2) {
        if (state['REFETCH'] == 0) {
          // roar |= 0;
        } else {
          roar |= 1;
        }
      } else {
        roar |= 2;
      }
      break;
    case 57: // IA(30)
      if (state['IAR'] & 2) { // Bit 30
        roar |= 2;
      }
      break;
    case 58: // EXT,CHIRPT
      // CROS page 31: A set with either timer or external channel, B with channel interrupt
      // timer update and not manual trigger    or external chan intr
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 59: // CROS: direct date hold sense br
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 60: // PSS      // Test and reset Progressive Scan Stat QU100
      if (state['PSS']) {
        roar |= 2;
        state['PSS'] = 0;
      }
      break;
    case 61: // CROS: IO Stat 4
    case 62:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 63: // RX.S0   CROS: S0 & M01==01
      // QT115:0188 RX instruction type
      if (((state['M'] >>> 30) == 1) && state['S'][0]) {
        roar |= 2;
      }
      break;
    default:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
  }
  state['ROAR'] = roar;
}

function roarBB(state, entry) {
  var roar = state['ROAR'];
  // B bit can be set later in the cycle, see CROS manual page 31
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
    case 10: // RSGNS R Sign Stat
      roar |= state['RSGNS'];
      break;
    case 11: // HSCH HS Channel Special Branch
      alert('Unexpected BB ' + entry['BB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 12: // EXC      // Exception Branch
      roar |= state['EXC'];
      break;
    case 13: // WR=0 MVR LTH 4-7 eq zero
      if (state['WR'] == 0) {
        roar |= 1;
      }
      break;
    case 14:
      alert('Unexpected BB ' + entry['BB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 15: // T13=0
      if ((state['T'] & (1<<31-13)) == 0) {
        roar |= 1;
      }
      break;
    case 16: // T(0)
      if (state['T'] & (1<<31)) {
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
      if (state['G2NEG'] == 1) {
        roar |= 1;
      }
      break;
    case 25: // G2LBZ
      // G2 == 0 or LB == 0 QS400:0D04
      if (state['G2'] == 0 || state['LB'] == 0) {
        roar |= 1;
      }
      break;
    case 26: // I/O  CROS manual: IO Stat 1 to CPU
      alert('Unimplemented I/O BB ' + entry['BB'] + " " + labels['BB'][entry['BB']]);
      break;
    case 27: // MD/JI   CROS manual: MD Odd Gt 8 or J odd gt 8
      if (((state['MD'] & 1) && state['MD'] > 8) || ((state['J'] & 1) && state['J'] > 8)) {
        roar |= 1;
      }
      break;
    case 28: // IVA // QT110/0149
      if (state['SAR'] & 1) {
        roar |= 1;
      }
      break;
    case 29: // I/O stat 3
      alert('Unimplemented I/O BB ' + entry['BB'] + " " + labels['BB'][entry['BB']]);
      break;
    case 30: // (CAR) branch immediate on carry latch
      if (state['CAR'] == 1) {
        roar |= 1;
      }
      break;
    case 31: // (Z00)
      if (state['T'] & 0x80000000) {
        roar |= 1;
      }
      break;
    default: 
      alert('Unimplemented BB ' + entry['BB'] + " " + labels['BB'][entry['BB']]);
  }
  state['ROAR'] = roar;
}

function roarZN(state, entry) {
  var roar = state['ROAR'];

  // ROS address control
  // See also CROS manual page 28 for gate-level description
  switch (entry['ZN']) {
    case 0:
      // Use ZF function
      switch (entry['ZF']) {
        case 2: // D→ROAR,SCAN // 50Maint p39 QY110. SDR(19-30) to ROAR, SDR(1-3) to scan counter, STR(4) to enable storage stat, SDR(5) to PSS, SDR(6) to supervis stat, SDR(7) to mode (IOMODE). (Unclear if IOMODE set by this or separately).
          alert('Unimplemented ZF ' + entry['ZF'] + " " + labels['ZF'][entry['ZF']]);
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
          alert('Unimplemented ZF ' + entry['ZF'] + " " + labels['ZF'][entry['ZF']]);
          break;
        // case 14: Add Bfr ROS Add Cntl
        default:
          alert('Unexpected ZF value ' + entry['ZF'] + " " + labels['ZF'][entry['ZF']]);
          break;
      } // ZF case
      break;
    case 1: // SMIF suppress memory instruction fetch
      // Handle in iar()
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
      alert('Unexpected ZN ' + entry['ZN'] + " " + labels['ZN'][entry['ZN']]);
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
      alert('Unimplemented ZN ' + entry['ZN'] + " " + labels['ZN'][entry['ZN']]);
      break;
  }

  state['ROAR'] = roar;
}
