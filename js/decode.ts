
function bin(n, len) {
  return n.toString(2).padStart(len, 0);
}

// Descriptions from Microprogramming: Principles and Practices appendix 8B
// Copy of IBM 2050 Control Field Specification

// LHS of A expression
var labels = {
// Right input to adder Y
'RY': {0: ['0', ''],
1: ['R', 'R register'],
2: ['M', 'M register'],
3: ['M23', 'M register bytes 2,3'], // +L becomes /L 61d?
4: ['H', 'H register'],
5: ['SEMT', 'OR the four SDR parity bits into the four emit field bits.'], // handled by B. OR SDR parity with emit QY310.
// 6 undefined
// 7 undefined
},

// True - complement control
'TC': {0: ['-', 'complement'], 1: ['+', '']},

// left input to adder (XG)
'LX': {0: ['0', 'No operation'],
1: ['L', 'L register'],
2: ['SGN', 'Sign bit'],
3: ['E', 'Emit (shifted)'],  // E is shifted left one bit
4: ['LRL', 'L register bytes 2,3'], // L23->XG01 QT115/0189
// and L(16-13) to M(16-31) via BUS (0-15) LRL->MHL QE580/070b
5: ['LWA', 'L register, bottom 2 bits set'],
6: ['4', 'Value 4'],
7: ['64C', 'Gate ones to XG bits 0-1. Gate zeros to other bits.'],
},

// left input to adder (XG), I/O mode
'LXI': {0: ['0', 'No operation'],
1: ['L', 'L register'],
2: ['SGN', 'Sign bit'],
3: ['E', 'Emit (shifted)'],  // E is shifted left one bit
4: ['LRL', 'L register bytes 2,3'], // L23->XG01 QT115/0189
// and L(16-13) to M(16-31) via BUS (0-15) LRL->MHL QE580/070b
5: ['LWA', 'L register, bottom 2 bits set'],
6: ['IOC', 'Gate ones complement of I/O reg to XG bits 30-31. Gate zeros to bits 0-29.'],
7: ['IO', 'Gate I/O reg to XG bits 30-31. Gate zeros to bits 0-29.'],
},

// Adder latch destination
'TR': {
0: ['T', 'No gating from adder latch to registers.'],
1: ['R', 'Gate adder latch to R reg.'],
2: ['R0', 'Gate adder latch bits 0-7 to R regbits 0-7.'],
3: ['M', 'Gate adder latch to M reg.'],
4: ['D', 'Gate adder latch to SDR.'],
5: ['L0', 'Gate adder latch bits 0-7 to L reg bits 0-7.'],
6: ['R,A', 'Gate adder latch to R reg and SAR. Initiate storage request.'],       // stores to R and address reg. Starts read cycle.
7: ['L', 'Gate adder latch to L reg.'],
8: ['HA→A', 'Gate hardware-generated address to SAR. Initiate storage request. Decode emit field to determine storage function.'], // under S. selects main storage. 50Maint p22
9: ['R,AN', 'Gate adder latch to R reg and SAR. Initiate storage request. Suppress invalid address trap. Set invalid address stat instead.'], // QT220/02bf
10: ['R,AW', 'Gate adder latch to R reg and SAR. Initiate storage request. Trap if address not on word boundary.'],
11: ['R,AD', 'Gate adder latch to R reg and SAR. Initiate storage request. Trap if address not on double word boundary.'],
12: ['D→IAR', 'Gate SDR to IAR. Interlock with storage timing ring.'], // under D
13: ['SCAN→D', 'Gate scan bus to SDR. Good parity is inserted in SDR.'], // under D        Scan bits 0-27 (extended with parity) to D. QY410
14: ['R13', 'Gate adder latch bits 8-31 to R reg bits 8-31.'],
15: ['A', 'Gate adder latch bits 8-31 to SAR. Initiate storage request.'], // QP100/614
16: ['L,A', 'Gate adder latch to L reg and SAR. Initiate storage request.'],
17: ['R,D', 'Gate adder latch to R reg and SDR.'],
// 18 undefined
19: ['R,IO', 'Gate adder latch to R reg. Gate adder latch bits 30-31 to I/O reg.'],
20: ['H', 'Gate adder latch to H reg.'],
21: ['IA', 'Gate adder ltch bits 8-31 to IAR.'],
22: ['FOLD', 'Gate scan bus bits 28-31 to SDR bits 24-27. Gate zeros to SDR bits 0-23 and 28-31. Good parity is inserted into SDR.'], // under D // 50Maint p32. FLT reg bit 0 specifies fold; maps 36 bit registers (i.e. with 4 parity) onto two 32 bit storage. Accesses folded part of SCAN QY410
// 23 undefine
24: ['L,M', 'Gate adder latch to L reg and M reg.'],
25: ['MLJK', 'Gate adder latch to L reg an M reg. J reg and MD counter, stats, ILC updated in complex ways.'],     // store to L, M, 12-15 to J, 16-19 to MD  QY310, QT110. 
// 0 -> REFETCH, (X=0)->S0, (B=0)->S1, set ILC,1SYL: [QT110, QT115
26: ['MHL', 'Gate adder latch to L reg. Gate adder latch bits 0-15 to M reg bits 16-31. Gate adder latch bits 0-3 to MD counter.'],
// T->L, T(0-3)->MD, T(0-15)->M, (B=0)->S1, set 1SYL QT115/0184
// T->L, T(0-3)->MD, T(0-15)->M, L(0-15) to M(16-31) QE180/709
27: ['MD', 'Gate adder latch bits 8-11 to MD counter.'],
28: ['M,SP', 'Gate adder latch to M reg. Gate adder latch bits 8-11 to storage protection key (PSW bits 8-11).'], // store to M register and Storage Protect QU100
29: ['D*BS', 'Gate adder latch to SDR under control of CPU byte stats.'],     // SDR bytes stats. Store bytes to D (i.e. main memory) where BS bit is high?
30: ['L13', 'Gate ader latch bits 8-31 to L reg bits 8-31.'], // QP206/0D95
31: ['J', 'Gate adder latch bits 12-15 to J reg.'],
},

// TR in I/O mode
// Only 27 and 31 are different
'TRI': {
0: ['T', 'No gating from adder latch to registers.'],
1: ['R', 'Gate adder latch to R reg.'],
2: ['R0', 'Gate adder latch bits 0-7 to R regbits 0-7.'],
3: ['M', 'Gate adder latch to M reg.'],
4: ['D', 'Gate adder latch to SDR.'],
5: ['L0', 'Gate adder latch bits 0-7 to L reg bits 0-7.'],
6: ['R,A', 'Gate adder latch to R reg and SAR. Initiate storage request.'],       // stores to R and address reg. Starts read cycle.
7: ['L', 'Gate adder latch to L reg.'],
8: ['HA→A', 'Gate hardware-generated address to SAR. Initiate storage request. Decode emit field to determine storage function.'], // under S. selects main storage. 50Maint p22
9: ['R,AN', 'Gate adder latch to R reg and SAR. Initiate storage request. Suppress invalid address trap. Set invalid address stat instead.'], // QT220/02bf
10: ['R,AW', 'Gate adder latch to R reg and SAR. Initiate storage request. Trap if address not on word boundary.'],
11: ['R,AD', 'Gate adder latch to R reg and SAR. Initiate storage request. Trap if address not on double word boundary.'],
12: ['D→IAR', 'Gate SDR to IAR. Interlock with storage timing ring.'], // under D
13: ['SCAN→D', 'Gate scan bus to SDR. Good parity is inserted in SDR.'], // under D        Scan bits 0-27 (extended with parity) to D. QY410
14: ['R13', 'Gate adder latch bits 8-31 to R reg bits 8-31.'],
15: ['A', 'Gate adder latch bits 8-31 to SAR. Initiate storage request.'], // QP100/614
16: ['L,A', 'Gate adder latch to L reg and SAR. Initiate storage request.'],
17: ['R,D', 'Gate adder latch to R reg and SDR.'],
// 18 undefined
19: ['R,IO', 'Gate adder latch to R reg. Gate adder latch bits 30-31 to I/O reg.'],
20: ['H', 'Gate adder latch to H reg.'],
21: ['IA', 'Gate adder ltch bits 8-31 to IAR.'],
22: ['FOLD', 'Gate scan bus bits 28-31 to SDR bits 24-27. Gate zeros to SDR bits 0-23 and 28-31. Good parity is inserted into SDR.'], // under D // 50Maint p32. FLT reg bit 0 specifies fold; maps 36 bit registers (i.e. with 4 parity) onto two 32 bit storage. Accesses folded part of SCAN QY410
// 23 undefine
24: ['L,M', 'Gate adder latch to L reg and M reg.'],
25: ['MLJK', 'Gate adder latch to L reg an M reg. J reg and MD counter, stats, ILC updated in complex ways.'],     // store to L, M, 12-15 to J, 16-19 to MD  QY310, QT110. 
// 0 -> REFETCH, (X=0)->S0, (B=0)->S1, set ILC,1SYL: [QT110, QT115
26: ['MHL', 'Gate adder latch to L reg. Gate adder latch bits 0-15 to M reg bits 16-31. Gate adder latch bits 0-3 to MD counter.'],
27: ['D*BI', 'Gate adder latch to SDR under control of I/O byte stats.'],
28: ['M,SP', 'Gate adder latch to M reg. Gate adder latch bits 8-11 to storage protection key (PSW bits 8-11).'], // store to M register and Storage Protect QU100
29: ['D*BS', 'Gate adder latch to SDR under control of CPU byte stats.'],     // SDR bytes stats. Store bytes to D (i.e. main memory) where BS bit is high?
30: ['L13', 'Gate ader latch bits 8-31 to L reg bits 8-31.'], // QP206/0D95
31: ['IO', 'Gate adder latch bits 12-15 to I/O reg.'],
},

// Adder functions
'AD': {
// 0 undefined. used by f43?
// 1 is default
2: ['BCFO', 'Binary add, no carry saved, hot 1 in if F=0'],
// 3: undefined
4: ['BC0', 'Binary add, save carry zero'],       // Save CAR from 0, QG501
5: ['BC⩝C', 'Binary add, save carry zero XOR carry one'],      // Save CAR(0) CAR(1) QB100:0219
6: ['BC1B', 'Binary add, save carry one, block carry 8'],      // Save CAR from 1, Block CAR from 8, QG501
7: ['BC8', 'Binary add, save carry 8, pass carry 8'],       // Save carry out of pos 8  QP800:064A
8: ['DHL', 'Decimal halve, low-order correct'],
9: ['DC0', 'Decimal add and correct, save carry zero in stat 1'],       // Decimal add correction QG900/0e3c
10: ['DDC0', 'Decimal double and correct, save carry in stat 1'],
11: ['DHH', 'Decimal halve, high-order correct'],
12: ['DCBS', 'Decimal add and correct, save carry per byte stats in stat 1'],
// 13-15 undefined
},

// Shift gate and adder latch control (gating into adder latches)
'AL': {
0: ['', 'Shift right one, spill to F, and enter from Q'],
1: ['Q→SR1→F', 'Shift right one, spill to F, and enter from Q'],
2: ['L0,¬S4→', 'Shift zero, insert inverted sign'],
3: ['+SGN→', 'Shift zero, insert plus sign'],
4: ['-SGN→', 'Shift zero, insert minus sign'],
5: ['L0,S4→', 'Shift zero, insert normal sign'],
6: ['IA→H', 'Shift zero and gate LAR to H directly'], // Handled by D
7: ['Q→SL→-F', 'Shift left one, spill complement to F, and enter from Q'],
8: ['Q→SL1→F', 'Shift left one, spill to F, and enter from Q'],
9: ['F→SL1→F', 'Shift left one, spill to F, and enter from F'],
10: ['SL1→Q', 'Shift left one, spill to Q, no enter'],
11: ['Q→SL1', 'Shift left one, no spill, and enter from Q'],
12: ['SR1→F', 'Shift right one, spill to F, no enter'],
13: ['SR1→Q', 'Shift right one, spill to Q, no enter'],
14: ['Q→SR1→Q', 'Shift right one, spill to Q, and enter from Q'],
15: ['F→SL1→Q', 'Shift left one, spill to Q, and enter from F while shifting F'],
16: ['SL4→F', 'Shift left four, spill to F, and no enter'],    // Shift adder output left by 4, also put in F.
17: ['F→SL4→F', 'Gate adder output to latch, shifted left 4, entering F. Spill bits enter F.'],
18: ['FPSL4', 'Floating point shift left four, no enter'],
19: ['F→FPSL4', 'Floating point shift left four, and enter from F'],
20: ['SR4→F', 'Shift right four, spill to F, and enter from F'],
21: ['F→SR4→F', 'Gate adder output to latch, shifted right 4, entering F. Spill bits enter F.'],
22: ['FPSR4→F', 'Floating point shift right four, and no enter'],
23: ['1→FPSR4→F', 'Floating point right shift four, and enter 0001'],
24: ['SR4→H', 'Shift right four, spill to H (0-3), and no enter'],
25: ['F→SR4', 'Shift right four, no spill, and enter from F'],
26: ['E→FPSL4', 'Floating-point shift left four, no spill, and enter from emit field'],
27: ['F→SR1→Q', 'Shift right one, spill to Q, and enter from F'],
28: ['DKEY', 'Data keys to adder latches, bits 28-31 to F'], // Handled by D, data keys
29: ['CH', 'Gate bus from selector channels to latch.'], // Handled by D, data keys
30: ['D', 'MDR to adder latches (read holdoff)'], // Handled by D
31: ['AKEY', 'Address keys to adder latches'], // Handled by D, address keys
},

// B
// Mover input left side -> U
'LU': {
0: ['', 'Gate zeros to left mover input U.'],
1: ['MD,F→U', 'Gate MD reg to left mover input U bits 0-3. Gate F reg to mover input U bits 4-7.'],      // MD and F registers (4 bits each)
2: ['R3→U', 'Gate R reg bits 24-31 to left mover input U.'],        // R3 = low byte (byte 3, right) of register R
3: ['DCI→U', 'Gate direct control data in lines to left mover input U.'], // I/O
4: ['XTR→U', 'Gate external interrupt reg to left mover input U. Reset external interrupt reg.'],       // Parity error (extra bit)? Reset by reading. QU100
5: ['PSW4→U', 'Gate PSW bits 32-39 (instruction length,condition reg,program mask) to left mover input U.'],      // PSW word 4 (right).
6: ['LMB→U', 'Gate L reg to left mover input U. Byte selection controlled by M byte counter.'],       // L indexed by MB?
7: ['LLB→U', 'Gate L reg to left mover input U. Byte selection controlled by L byte counter.'],
},

// LU, I/O mode
'LUI': {
0: ['', 'Gate zeros to left mover input U.'],
1: ['MD,F→U', 'Gate MD reg to left mover input U bits 0-3. Gate F reg to mover input U bits 4-7.'],      // MD and F registers (4 bits each)
2: ['R3→U', 'Gate R reg bits 24-31 to left mover input U.'],        // R3 = low byte (byte 3, right) of register R
3: ['BIB→U', 'Gate multiplex channel buffer in bus to left mover input U.'],
4: ['L0→U', 'Gate L reg bits 0-7 to left mover input U.'],
5: ['L1→U', 'Gate L reg bits 8-15 to left mover input U.'],
6: ['L2→U', 'Gate L reg bits 16-23 to left mover input U.'],
7: ['L3→U', 'Gate L reg bits 24-31 to left mover input U.'],
},

// Mover input right side -> V
'MV': {
0: ['', 'Gate zeros to right mover input V.'],
1: ['MLB→V', 'Gate M reg to right mover input V. Byte selection controlled by L byte counter.'],       // M indexed by LB?
2: ['MMB→V', 'Gate M reg to right mover input V. Byte selection controlled by M byte counter.'],
// 3 undefined 1401/7010: R3→V, Gate R reg bit 24-31 to right mover input V.
},

// Mover input right side, I/O
'MVI': {
0: ['', 'Gate zeros to right mover input V.'],
// 1 undefined
2: ['BIB→V', 'Gate multiplex channel buffer in bus to right mover input V.'],
// 3 undefined
},

// Mover action 0-3 -> WL, -> WR
// Mover action - Latch bits 0-3 (null value: UL1)
// Combined if same?
'UL': {
0: ['E', 'Gate emit field to mover latch bits 0-3.'], // E->WL in d29
1: ['U', 'Gate left input (U) bits 0-3 to latch bits 0-3.'], // E->WR in 61b
2: ['V', 'Gate right input (V) bits 0-3 to latch bits 0-3.'],
3: ['?', 'Gate to latch bits 0-3 according to contents of mover function register.'], // Use mover function
},

'UR': {
0: ['E', 'Gate emit field to mover latch bits 4-7.'],
1: ['U', 'Gate left input (U) bits 4-7 to latch bits 4-7.'],
2: ['V', 'Gate right input (V) bits 4-7 to latch bits 4-7.'], // or VR
3: ['?', 'Gate to latch bits 4-7 according to contents of mover function register.'], // AND operands together
},

// Mover output destination W ->
'WM': {
0: ['', 'No operation'],
1: ['W→MMB', 'Gate mover latches to byte of M reg specified by M byte counter. Modified for 1401/7010.'],     // W to M indexed by MB
2: ['W67→MB', 'Gate mover latch bits 6-7 to M byte counter.'],    // W bits 6-7 to MB
3: ['W67→LB', 'Gate mover latch bits 6-7 to L byte counter.'],   // W bits 6-7 to LB
4: ['W27→PSW4', 'Gate mover latch bits 2-7 to PSW register bits 34-39 (condition code and program mask).'], // W bits 2-7 to PSW bits 34-39 QJ200. Turns off load light too.
5: ['W→PSW0', 'Gate mover latch to PSW register bits 0-7 (system mask).'],    // PSW bits 0-7 (left)
6: ['WL→J', 'Gate mover latch bits 0-3 to J reg.'],
7: ['W→CHCTL', 'Gate mover latch to channel control.'],           // Channel control: 0001 is start I/O, 0100 is test I/O. Updates R, M, DA, L (see QK800). M0 = unit status. L1 is channel end status
8: ['W,E→A(BUMP)', 'Gate mover latch bits 0-1 to SAR bits 14-15. Gate mover latch bits 2-7 to SAR bits 24-29. Gate emit field bits 2-3 to SAR bits 16-17. Initiate bump storage request.'], // W,E(23) selects bump sector address. Bits shuffled, see 5- Maint p81.
9: ['WL→G1', 'Gate mover latch bits 0-3 to length counter G1. Reset G1 sign.'],
10: ['WR→G2', 'Gate mover latch bits 4-7 to length counter G2. Reset G2 sign.'],
11: ['W→G', 'Gate mover latch to combined length counter G. Reset G1,G2 signs.'],
12: ['W→MMB(E?)', 'Gate mover latch to byte of M reg specified by M byte counter. The emit field is modified in a complex way.'], // d29
13: ['WL→MD', 'Gate mover latch bits 0-3 to MD counter.'],
14: ['WR→F', 'Gate mover latch bits 4-7 to F reg.'],
15: ['W→MD,F', 'Gate mover latch bits 0-3 to MD counter. Gate mover latch bits 4-7 to F reg.'],
},

// D
// Counter function control
'UP': {
0: ['0→', 'Set selected counters to zero.'],
1: ['3→', 'Set selected counters to three.'],
2: ['-', 'Decrement selected counters by 1. If underflow, set to all ones.'],
3: ['+', 'Increment selected counters by 1. If overflow, set to all zeros.'], // QT120/01CE
},

// Select L byte counter
'LB': {
0: ['0', ''],
1: ['1', ''], // QT115/0189
},
// Select M byte counter
'MB': {
0: ['', ''],
1: ['1', ''], // QT210/01A3
},
// Select MD counter
'MD': {
0: ['', ''],
},
// Length counter and carry insertion control
'DG': {
1: ['CSTAT→ADDER', 'Insert carry stat into adder.'],
2: ['HOT1→ADDER', 'Insert hot carry into adder.'],        // 1 bit added to last position
3: ['G1-1', 'Decrement length counter G1 by 1. If underflow, set G1 sign to minus and counter to all ones.'],
4: ['HOT1,G-1', 'Decrement coupled length counters by one. If underflow ccurs in bits 4-7, set G2 sign to minus. If all 8 bits undeflow, set G1 sign to minus. Insert hot carry into adder.'],
5: ['G2-1', 'Decrement length counter G2 by 1. If underflow, set G2 sign to minus and counter to all ones.'],
6: ['G-1', 'Decrement coupled length counters by one. If underflow occurs, in bits 4-7, set G2 sign to minus. If all 8 bits underflow, set G1 sign to minus.'],
7: ['G1,2-1', 'Decrement each length counter by one. If a counter underflows, set its sign to minus and its value to all ones.'],
},

// Local storage addressing (null value: WS4)
'WS': {
// 0 ndefined
1: ['WS1→LSA', 'Set LSAR to 0100001 to address word 1 of working storage.'], // Select WS1 address from local storage. WS7 is PSW0 backup
2: ['WS2→LSA', 'Set LSAR to 0100010 to address word 2 of working storage.'], // Select WS2 address from local storage
3: ['WS,E→LSA', 'Set LSAR bits 0-1 to 01. Set LSAR bits 2-5 to emit field value to address working storage per the emit field.'], // QP206/D94
4: ['FN,J→LSA', 'Gate local storage function reg to LSAR bits 0-1. Gate J reg to LSAR bits 2-5.'], // NOP if SF==7
5: ['FN,JΩ1→LSA', 'Gate local storage function reg to LSAR bits 0-1. Gate J reg to LSAR bits 2-5. OR a one into LSAR bit 5.'],
6: ['FN,MD→LSA', 'Gate local storage function reg to LSAR bits 0-1. Gate J reg to LSAR bits 2-5. Gate MD reg to LSAR bits 2-5.'],
7: ['FN,MDΩ1→LSA', 'Gate local storage function reg to LSAR bits 0-1. Gate J reg to LSAR bits 2-5. Gate MD reg to LSAR bits 2-5. OR a one into LSAR bit 5.'],
},

// Local storage function (null value: SF7)
'SF': {
0: ['R→LS', 'Write into local storage from R reg.'], // QT210/1A3
1: ['LS→L,R→LS', 'Read local storage into L reg. Write into local storage from R reg.'], 
2: ['LS→R→LS', 'Read local storage into R reg. Regenerate from R reg.'], 
// 3 undefined
4: ['L→LS', 'Write into local storage from L reg.'], // QP206/D95
5: ['LS→R,L→LS', 'Read local storage into R reg, write into local storage from L reg.'],
6: ['LS→L→LS', 'Read local storage into L reg, regenerate from L reg.'], // QP206/D94
7: ['', 'No operation.'], // Only used with WS 4: disables WS 4 for nop
},

// Invalid digit test and instruction address reg controrl
'IV': {
0: ['', 'No operation'],
1: ['WL→IVD', 'Trap if value of mover output bits 0-3 is greater than 9.'],
2: ['WR→IVD', 'Trap if value of mover output bits 4-7 is greater than 9.'],
3: ['W→IVD', 'Trap if value of either mover output bits 0-3 or mover output bits 4-7 is greater than 9.'],
4: ['IA/4→A,IA', 'Increment IAR by 4. Gate result to IAR and SAR. Initiate storagerequest. Inhibit invalid address trap. Set invalid address stat instead.'],
5 : ['IA+2/4', 'If instruction length code value is 0 or 1, increment IAR by 2. If ILC value is 2 or 3, increment IAR by 4. Gate result back to IAR.'], // QT115/019B
6 : ['IA+2', 'Increment IAR by 2. Gate result back to IAR.'], // QT120/018B
7: ['IA+0/2→A', 'Gate IAR to SAR, incremented by 2 if refetch stat is off. Not incremented if refetch stat is on. Initiate storage request. Inhibit invalid address trap. Set invalid address stat instead. IAR is not altered.'], // QP206/0D94 Also IA+0+2→A: QT115/0199 
},

// Suppress memory instruction fetch / ROS address control
// ROS address control (null value: ZN4)
'ZN': {
0: ['--ROAR--', 'Decode ZF field'], // QT115/019B
1: ['SMIF', 'Suppress initiation of main storage cycle by decimal order IV7 in this microinstruction if refetch stat is off and IAR bit 30 is 1. (Next instruction is off word boundary.)'],      // Suppress Memory IF off bnds and ¬refetch. QB100:0219. Only used with I-FETCH and I+0/2→A
2: ['AΩ(B=0)→A', 'Force A bit to 1 if B bit is 0.'], // hypothesis
3: ['AΩ(B=1)→A', 'Force A bit to 1 if B bit is 1.'],
4: ['', 'Normal ROS addressing.'], // QP206/0D94
5: ['FNTRAP', 'Force ROS address to invalid op trap if this microinstruction was reached by a function branch.'], // QP206/0D94
6: ['BΩ(A=0)→B', 'Force B bit to 1 if A bit is 0.'], // QT115/020A
7: ['BΩ(A=1)→B', 'Force B bit to 1 if A bit is 1.'], // QT120/01CC
},

// C: [Stat setting and misc control
'SS': {
// 1,2 undefined
3: ['D→CR*BS', 'Set condition reg for test and set instruction.'],
4: ['E→SCANCTL', 'Control scan stats per edit field.'], // Performs scan operation controlled by E. See 50Maint p32. 0101 clears SCPS,SCFS QU100. 0011 ignore IO error. 0000 test for all ones, step bin trigger. 0001 sets SCPS,SCFS.
// 1000 moves SDR(0-2) to CTR (clock advance counter), STR(5) to PSS (progressive scan stat), SDR(6) to SST (supervisory stat) QY110
5: ['L,RSGNS', 'Test for minus sign in left mover input U, modifying L and R sign stats.'],
6: ['IVD/RSGNS', 'Test left mover input U for minus sign; force invalid data ROS trap or invert R sign stat.'],
7: ['EDITSGN', 'Test mover latch, modify L and R sign stats.'],
8: ['E→S03', 'Gate emit field to stats 0-3.'],             // S03 = stats 0-3 50Maint p183, QU100
9: ['S03ΩE,1→LSGN', 'Turn on stats 0-3 per emit field. Turn on L sign stat.'],
10: ['S03ΩE', 'Turn on stats 0-3 per emit field.'],            // Set S03 bits from E
11: ['S03ΩE,0→BS', 'Turn on stats 0-3 per emit field. Turn off CPU byte stat.'],
12: ['X0,B0,1SYL', 'Set stats based on adder latch bits.'],
13: ['FPZERO', 'Set stat 0 based on adder latch and F reg.'],
14: ['FPZERO,E→FN', 'Set stat on complex conditions.'],
15: ['B0,1SYL', 'Set stat based on complex conditions.'], // (B=0)->S1, set 1SYL QT115/0189
16: ['S03.¬E', 'Turn off stats 0-3 per emit field'],           // Clear S03 bits from E
17: ['(T=0)→S3', 'If adder latch is zero turn on stat 3. Otherwise turn off stat 3.'],
18: ['E→BS,T30→S3', 'Gate emit field to CPU byte stats. Set stat 3 to value of adder latch bit 30.'],
19: ['E→BS', 'Gate emit field to CPU byte stats.'],             // Store E to byte stats (i.e. byte mask)
20: ['1→BS*MB', 'Turn on byte stat indicated by value of MB counter'],
21: ['DIRCTL*E', 'Direct control per emit.'],
// 22 undefined
23: ['MANUAL→STOP', 'Setstop trigger to value of manual trigger.'],      // M trig to S (Halt status) QU100
24: ['E→S47', 'Gate emit field to stats 4-7.'],            // Write E to channel S bits 4-7
25: ['S47ΩE', 'Turn on stats 4-7 per emit field.'],            // S bits 4-7 |= E. Set bits indicated by E
26: ['S47.¬E', 'Turn offstats 4-7 per emit field.'],           // S bits 4-7 &= ~E. I.e. clear bits indicated by E
27: ['S47,ED*FP', 'Set stat based on complex conditions.'],
28: ['OPPANEL→S47', 'Set stat based on complex conditions.'],      // Write operator panel to S bits 4-7
29: ['CAR,(T≠0)→CR', 'Set stat based on complex conditions.'],
30: ['KEY→F', 'Set stat based on complex conditions.'], // QT115/020E
31: ['F→KEY', 'Set stat based on complex conditions.'], // QT220/02BF
32: ['1→LSGNS', 'Turn on L sign stat.'],
33: ['0→LSGNS', 'Turn off L sign stat.'],
34: ['1→RSGNS', 'Turn on R sign stat.'],
35: ['0→RSGNS', 'Turn off R sign stat.'],
36: ['L(0)→LSGNS', 'Set L sign stat to value of L reg bit 0.'],
37: ['R(0)→RSGNS', 'Set R sign stat to value of R reg bit 0.'],       // R sign stat QY310
38: ['E(13)→WFN', 'Gate emit field bits 1-3 to mover function reg.'],
39: ['E(23)→LSFN', 'Gate emit field bits 2-3 to Local Storage Function reg. (Effective for local storage addressing this cycle.)'], // QT120/0102
40: ['E(23)→CR', 'Gate emit field bits 2-3 to condition reg (PSW bits 34-35).'],
41: ['SETCRALG', 'Set the condition reg according to algebraic conditions.'], // Set CR algebraic
// T=0, 00->CR, if T<0, 01->CR, if 0<T, 10->CR QB100:0284, QE580/222.
42: ['SETCRLOG', 'Set the condition reg according to logical conditions.'], // Set CR logical
// QP102/0641: [If T*BS=0: 00->CR. If T*BS := 0 and CAR(0) =0: 01->CR. If T*BS != 0 and CAR(0)=1: 10->CR
43: ['¬S4,S4→CR', 'Set condition reg from stats.'],
44: ['S4,¬S4→CR', 'Set condition reg from stats.'],
45: ['1→REFETCH', 'Turn on the refetch trigger.'],
46: ['SYNC→OPPANEL', 'Send address compare sync/stop pulse to console.'], // QT200/0107
47: ['SCAN*E,10', 'Set Flt op reg based on complex conditions.'],        // sets FLT register. See 50Maint p28. Channel address, Unit address to L.
48: ['1→SUPOUT', 'Turn on multiplexor channel suppress out line.'],
49: ['MPXSELRESET', 'Selective reset of multiplexor channel.'],
50: ['E(0)→IBFULL', 'Set interrupt buffer full stat to value of emit field bit 0.'],      // Reset MPX Input Buffer Full stat QU100
// 51 undefined
52: ['E→CH', 'Gate the emit field to the common channel.'],             // QY430 E=0110 resets common and mpx channel, QK702:099f 0001 resets common channel.)
// 53 undefined
54: ['1→TIMERIRPT', 'Turn on the timer bit in the external interrupt reg.'],
55: ['T→PSW,IPL→T', 'IPL and channel address gating.'],      // QU100, 50Maint
56: ['T→PSW', 'Gate adder latch bits 12-15 to PSW bits 12-15 (mode bits)'],            // T(12-15) to PSW QU100
57: ['SCAN*E,00', 'Flt op reg controls.'],        // E -> SCANCTRL(2-5), 0->SCANCTRL(1), (FOLD)->SCANCTRL(0) // U100
58: ['1→IOMODE', 'Turn on I/O mode stat.'], // 50Maint p39. Sets I/O mode stat
59: ['0→IOMODE', 'Turn off I/O mode stat.'],
60: ['1→SELOUT', 'Turn on multiplexor channel select out line.'],
61: ['1→ADROUT', 'Turn on multiplexor channel address out line.'],
62: ['1→COMOUT', 'Turn on multiplexor channel command out line.'],
63: ['1→SERVOUT', 'Turn on multiplexor channel service out line.'],
},

// ROAR values for ZN=0
// Function branch control or ROS address bits 6-9
'ZF': {
  // 0 undefined
  // No odd values
  2: ['D→ROAR,SCAN', 'Gate storage data reg bits as follows: bits 19-30 to ROS dadress'], // 50Maint p39 QY110. SDR(19-30) to ROAR, SDR(1-3) to scan counter, STR(4) to enable storage stat, SDR(5) to PSS, SDR(6) to supervis stat, SDR(7) to mode (IOMODE). (Unclear if IOMODE set by this or separately).
  // 4 undefined
  6: ['M(03)→ROAR', 'Gate M reg bits 0-3 to next ROS address bits 6-9'],
  8: ['M(47)→ROAR', 'Gate M reg bits 4-7 to next ROS address bits 6-9.'],
  10: ['F→ROAR', 'Gate F reg to next ROS address bits 6-9.'],
  12: ['ED→ROAR', 'Gate exponent difference reg to next ROS address bits 6-9.'],
  14: ['RETURN→ROAR', 'Gate ROS address buffer reg to next ROS address. This register is set on I/O break-in'],
},

// Condition test (left side)
'AB': {
0: ['0', 'Set A bit to 0.'],
1: ['1', 'Set A bit to 1.'], // ?QP100/614
2: ['S0', 'Set A bit to value of stat 0.'],
3: ['S1', 'Set A bit to value of stat 1.'],
4: ['S2', 'Set A bit to value of stat 2.'],        // stat 2: channel end status: 0 = channel busy, 1 = channel end
5: ['S3', 'Set A bit to value of stat 3.'],        // stat 3: channel response
6: ['S4', 'Set A bit to value of stat 4.'], // guess
7: ['S5', 'Set A bit to value of stat 5.'],        // stat 5: channel ?
8: ['S6', 'Set A bit to value of stat 6.'], // QT200/0209
9: ['S7', 'Set A bit to value of stat 7.'],        // stat 7: 0 for test I/O, 1 for start I/O
10: ['CSTAT', 'Set A bit to value of carry stat.'],    // test saved carry stat (e.g. BC8 in prev instruction) QP800:064E
// 11 undefined
12: ['1SYLS', 'Set A bit to value of One Syllable Op in buffer stat.'], // QT115/0189. One syllable instruction
// QT110: (X=0) -> S0, (B=0)->S1, set ILC,1SYL
13: ['LSGNS', 'Set A bit to value of L sign stat.'],
14: ['⩝SGNS', 'Set A bit to exclusive OR of L sign stat and R sign stat.'],
// 15 undefined
16: ['CRMD', 'Perform AND of MD reg (mask) and decoded condition reg. If result is non-zero, set A bit to one. If result is zero, set A bit to zero.'],     // masked CR -> A, branch on CC=0 (I/O accepted by channel). Test for branch.
17: ['W=0', 'If mover latches are zero, set A bit to one. If non-zero, set A bit to zero.'],
18: ['WL=0', 'If mover latche bits 0-3 are zero, set A bit to one. If non-zero, set A bit to zero.'],
19: ['WR=0', 'If mover latche bits 4-7 are zero, set A bit to one. If non-zero, set A bit to zero.'],
20: ['MD=FP', 'If both bit 0 and bit 3 of MD reg are zero, set A bit to one. Otherwise set A bit to zero. (Valid floating point reg)'],
21: ['MB=3', 'If MB coutner equals 3, set A bit to one. Otherwise set A bit to zero.'],     // Test MB register value
22: ['MD3=0', 'Set A bit to complement of MD reg bit 3.'],
23: ['G1=0', 'If length counter G1 is zero, set A bit to one. Otherwise set A bit to zero.'],
24: ['G1<0', 'Set A bit to value of length counter G1 sign.'],
25: ['G<4', 'If coupled length counters have value less than 4, set A bit to one. Otherwise set A bit to zero. Sign of G1 is included in value.'],
26: ['G1MBZ', 'If either length counter G1 or MB counter is zero, set A bit to one. Otherwise set A bit to zero.'],
27: ['IOS0', 'Set A bit to value of multiplexor channel stat 0.'],
28: ['IOS1', 'Set A bit to value of multiplexor channel stat 1.'],
29: ['R(31)', 'Set A bit to value of R reg bit 31.'], // QT120/01CC
30: ['F(2)', 'Set A bit to value of F reg bit 2.'],
31: ['L(0)', 'Set A bit to value of L reg bit 0.'],
32: ['F=0', 'If F reg is zero, set A bit to one. Otherwise set A bit to zero.'],
33: ['UNORM', 'If stat 0 is off and adder output bits 8-11 are zero, set A bit to one. Otherwise set A bit to zero.'],
34: ['TZ*BS', 'If allbyte sof adder output specified by byte stats are zero, set A bit to one. Otherwise set A bit to zero.'],
35: ['EDITPAT', 'Set A bit to value of edit stat 1. Set B bit to value of edit stat 2.'],
36: ['PROB', 'Set A bit to value of PSW bit 15.'],     // Privileged op? QY110 QK700:0932
37: ['TIMUP', 'Set A bit to value of timer update signals. Reset timer update signal.'],
// 38 undefined
39: ['GZ/MB3', 'If either the value of the coupled length counter G is zero or the value of the MB counter is 3 set A bit to one. Otherwise set A bit to zero.'],
// 40 undefined
41: ['LOG', 'Set A bit to value of log/scan stat.'],      // Branch on log scan stat. QY430 0 for FLT log, 1 for error log QY410
42: ['STC=0', 'If scan test counter is zero, set A bit to one. Otehrwise set A bit to zero.'],    // Check Scan Test Counter
43: ['G2<=LB', 'If length counter G2 is less than or equal to LB counter, set A bit to one. Otherwise set A bit to zero. Sign of length counter is ignored.'],
// 44 undefined
45: ['D(7)', 'SeA bit to value of SDR bit 7.'], // test D bit 7 (SDR) QY510
46: ['SCPS', 'Set A bit to value of scan pass stat.'], // test and branch on pass trigger: 50Maint p32
47: ['SCFS', 'Set A bit to value of scan fail stat.'], // test and branch on fail trigger: 50Maint p32
48: ['STORV', 'Set A it to value of I/O storage violation trigger.'],
49: ['W(67)→AB', 'Set A bit to value of mover latch bit 6. Set B bit to value of mover latch bit 7.'],
50: ['Z23≠0', 'If adder output bits 16-13 are non-zero set A bit to one. Otherwise set A bit to zero.'],
51: ['CCW2OK', 'If SDR bits 16-13and 5-7 are all zero set A bit to one. Otherwise set A bit to zero. (Count and flag test)'],
52: ['MXBIO', 'Set A bit to value of multiplexor input buffer bit 0.'],
53: ['IBFULL', 'Set A bit to value of input buffer full stat.'],
54: ['CANG', 'If adder output bits 29-31 are non-zero or invalid address trigger is on, set A bit to one. Otherwise set A bit to zero.'], // CA(29-31) := 0, CA(4-7) != 0? QK700:0995
55: ['CHLOG', 'Set A bit to value of channel error log request line.'], // Select channel log out QK700:018d
56: ['I-FETCH', 'Four-way branch on IAR, refetch stat, and exception trigger.'], // QP206/D94
57: ['IA(30)', 'Set A bit to value of IAR bit 30.'],
58: ['EXT,CHIRPT', 'If either a timer update request has occurred, or an external interrupt is requested with mask bit on, set A bit to one. Otherwise set A bit to zero. If a chanel interrupt is requested set B bit to one. Otherwise set B bit to zero.'],
59: ['DCHOLD', 'Set A bit to value of direct control hold line.'],
60: ['PSS', 'Set A bit to value of progressive scan stat. If PSS is on when tested reset it, unless supervisory stat is on and supervisory enablestoragestat is off.'],      // Test and reset Program Scan Stat QU100
61: ['IOS4', 'Set A bit to value of multiplexor channel stat 4.'],
// 62 undefined
63: ['RX.S0', 'If stat 0 is on and M reg bits 0-1 have value 01 ste A bit to one. Otherwise set A bit to zero. (RX format and indexing required)'],
},

'BB': {
0: ['0', 'Set B bit to 0.'],
1: ['1', 'Set B bit to 1.'],
2: ['S0', 'Set B bit to value of stat 0.'],
3: ['S1', 'Set B bit to value of stat 1.'],
4: ['S2', 'Set B bit to value of stat 2.'],
5: ['S3', 'Set B bit to value of stat 3.'],
6: ['S4', 'Set B bit to value of stat 4.'],
7: ['S5', 'Set B bit to value of stat 5.'],
8: ['S6', 'Set B bit to value of stat 6.'],
9: ['S7', 'Set B bit to value of stat 7.'], // QT220/020A
10: ['RSGNS', 'Set B bit to value of R sign stat'],
11: ['HSCH', 'If high speed channel is operating or 256 subchannel option is installed, set B bit to one. Otherwise set B bit to zero.'],
12: ['EXC', 'Set B bit to value of exception trigger.'],      // Test as part of branch. Address trap exception? QA700
13: ['WR=0', 'If mover latch bits 4-7 are zero set B bit to one. Otherwise set B bit to zero.'],
// 14 undefined
15: ['T13=0', 'If adder output bus bits 8-13 are zero, set B bit to one. Otherwise set B bit to zero.'],
16: ['T(0)', 'Set B bit to value of adder output bus bit 0.'],
17: ['T=0', 'If adder output bus is zero, set B bit to one. Otherwise set B bit to zero.'],
18: ['TZ*BS', 'If the bytes of the adder output bus specified by the byte stats are all zero, set B bit to one. Otherwise set B bit to zero.'],    // Latch zero test per byte stats. QA700
19: ['W=1', 'If the mover latches contain 0000 0001 set B bit to one. Otherwise set B bit to zero.'],
20: ['LB=0', 'If LB counter is zero set B bit to one. Otherwise set B bit to zero.'],
21: ['LB=3', 'If LB counter equals 3 set B bit to one. Otherwise set B bit to zero.'],     // Test LB value
22: ['MD=0', 'If MD reg is zero set B bit to one. Otherwiser set B bit to zero.'],
23: ['G2=0', 'If length counter G2 is zero set B bit to one. Otherwiser set B bit to zero.'],
24: ['G2<0', 'Set B bit to value of length counter G2 sign.'],
25: ['G2LBZ', 'If either length counter G2 or LB counter is zero, set B bit to one. Otherwise set B bit to zero.'],
26: ['IOS1', 'Set B bit to value of multiplexer stat 1'],
27: ['MD/JI', 'If either bit 1 or bit 3 of either MD reg or J reg is one, set B bit to one (illegal FP reg). Otherwise set B bit to zero.'], // QG400:0307
28: ['IVA', 'Set B bit to value of invalid address stat.'], // CA all right or invalid. QK700:09bd
29: ['IOS3', 'Set B bit to value of multiplexer channel state 3.'],
30: ['(CAR)', 'Set B bit to value of carry latch as set this cycle.'],    // Test carry. QP800:0650
31: ['(Z00)', 'Set B bit to value of adder sum bit 0 (before shift) this cycle.'],
},

// Timing signals to external channel (I/O mode)
'CT': {
// 0 Nop
1: ['FIRSTCYCLE', 'Send first cycle check signal to channel. If this is not the first cycle of a channel routine, a channel control check and log-out will result.'],
2: ['DTC1', 'Send ingate timing pulse to channel.'],
3: ['DTC2', 'Send outgate timing pulse to channel.'],
4: ['IA+4→A,IR', 'Increment IAR by 4. Gate result to IAR and SAR. Initiate storage request. Inhibit invalid address trap. Set invalid address stat instead.'],
// 5, 6, 7 undefined
},

// Mover output destination (I/O mode)
'WL': {
// 0 Nop
1: ['W→L0', 'Gate mover latch to L reg bits 0-7.'],
2: ['W→L1', 'Gate mover latch to L reg bits 8-15.'],
3: ['W→L2', 'Gate mover latch to L reg bits 16-23.'],
4: ['W→L3', 'Gate mover latch to L reg bits 24-31.'],
5: ['W,E→A(BMP)', 'Gate mover latch to SAR in complex arrangement. Initiate bump storage request.'],
6: ['W,E→A(BMP)S', 'Gate mover latch to SAR in complex arrangement. Initiate bump storage request for split read-write cycle.'],
// 7 undefined
},

// Multiplexor channel stat control (I/O mode)
'MS': {
// 0 Nop
1: ['BIB(03)→IOS', 'Gate buffer in bus bits 0-3 to multiplexor channel stats.'],
2: ['BIB(47)→IOS', 'Gate buffer in bus bits 4-7 to multiplexor channel stats.'],
3: ['BIB03→IOS*E', 'Gate buffer in bus bits 0-3 to those multiplexor channel stats corresponding to one bits in the emit field. Leave unchanged those stats corresponding to zero bits.'],
4: ['BIB47→IOS*E', 'Gate buffer in bus bits 4-7 to those multiplexor channel stats corresponding to one bits in the emit field. Leave unchanged those stats corresponding to zero bits.'],
5: ['IOSΩE', 'Turn on those multiplexor channel stats corresponding to one bits in the emit field.'],
6: ['IOS.¬E', 'Turn off those multiplexor channel stats corresponding to one bits in the emit field.'],
7: ['BIB4,ERR→IOS', 'Set multiplexor channel stats based on complex conditions.'],
},

// Control signals to channel
'CG': {
// 0 Nop
1: ['CH→BI', 'Selector channel byte gate control. Causes channel to set BGC register from byte counter and end register. Decoded output of BGC reg is gated to byte stats by order TR28. (When read bkwd, output is crossed before gatingto byte stats.'],
2: ['1→PRI', 'Send end of channel routine signal to channel priority circuits. (Used in next to last cycle of routine.)'],
3: ['1→LCY', 'Send last cycle signal to channel priority circuits. (Used in next to last cycle of routine.)'],
},

// Multiplexor channel gate control (null value: BG3)
'MG': {
0: ['BFR2→BIB', 'Gate multiplexor channel buffer 2 to buffer in bus.'],
1: ['CHPOSTEST', 'Initiate a selector channel position test.'],
2: ['BFR2→BUS0', 'Gate multiplexor channel buffer 1 to buffer in bus. Gate multiplexor channel buffer 2 to bus out (to interface).'],
3: ['BFR1→BIB', 'Gate multiplexor channel buffer 1 to buffer in bus.'],
4: ['BOB→BFR1', 'Gate multiplexor channel buffer 1 to buffer in bus. Then gate buffer out bus to multiplexor channel buffer 1.'],
5: ['BOB→BFR2', 'Gate multiplexor channel buffer 1 to buffer in bus. Then gate buffer out bus to multiplexor channel buffer 2.'],
6: ['BUSI→BFR1', 'Gate multiplexor channel buffer 1 to buffer in bus. Then gate bus in (from interface) to multiplexor channel buffer 1.'],
7: ['BUSI→BFR2', 'Gate multiplexor channel buffer 1 to buffer in bus. Then gate bus in (from interface) to multiplexor channel buffer 2.'],
},

// Selector channel adder latch tests
'CL': {
// 0 Nop
// 1,2 undefined
3: ['CCW2TEST', 'Send program check signal to selector channel if SDR bits 5-7 are not zero or if SDR bits 16-31 are zero. (Count and flag test.)'],
4: ['CATEST', 'Send program check signal to selector channel if adder output bits 29-31 are not zero. (Address test)'],
5: ['UATEST', 'Set bit 8 of adder-latch-to-channel bus to one if adder output bits 0-7 are all zero. Otherwise set bit 8 to zero. All other bits of bus are set to zero. (Unit address test)'],
6: ['LSWDTEST', 'Last words test.'],
// 7 undefined
},

};


var nextaddr = 0;

// Generates the info box for the given entry at addr.
// Returns array of strings.
// Addr is a 4-digit hex string.
function decode(addr : string, entry) : [string[], string[]] {
  function get(label, field=0) {
    if (!(label in labels)) {
      alert('Missing label ' + label);
      return;
    }
    if (label in entry) {
      var l = labels[label][entry[label]][field];
      if (l == undefined) {
        return 'UNDEF_' + label + "_" + entry[label];
      } else {
        return l;
      }
    } else {
      return 'undef!!!' + label;
    }
  }
  function getDesc(label) {
    return get(label, 1);
  }

  if (entry == undefined) {
    throw('Missing microcode for addr ' + addr);
  }

  var result = [];
  var description = [];
  result.push('---------- ' + addr.toUpperCase());
  if (entry['CE']) {
    padbox(result, 'E', bin(entry['CE'], 4));
    description.push('Emit value ' + bin(entry['CE'], 4));
  }

  if (entry['AL'] == 28 || entry['AL'] == 30 || entry['AL'] == 31 || entry['TR'] == 12 || entry['TR'] == 22 || entry['TR'] == 13) {
    // Handled by D
  } else if (entry['TR'] == 8) {
    // Handled by S
  } else {
    if (entry['RY'] || entry['LX'] || entry['TR']) {
      var lx = get('LX');
      if (entry['TC'] == 0 && entry['LX'] == 0) {
        lx = '1'; // -0 turns into -1 for some reason, 1's complement?
      }
      padbox(result, 'A', (get('RY') + get('TC') + lx + '→' + get('TR')).replace('0+', '').replace('+0', '').replace('0-', '-'));
      if (entry['TC'] == 0) {
        description.push('Adder: ' + getDesc('RY') + ', complemented');
      } else {
        description.push('Adder: ' + getDesc('RY'));
      }
      description.push(getDesc('LX'));
      description.push(getDesc('TR'));
    }
    var l = undefined, r = undefined;
    if (entry['AL'] == 6) {
      // Handled by D
    } else if (entry['AL']) {
      r = get('AL');
      description.push(getDesc('AL'));
    }
    if (entry['AD'] != 1) {
      l = get('AD');
      description.push(getDesc('AD'));
    }
    if (l || r) {
      padbox(result, 'A', l, r);
    }
  }

  // B entry
  if (entry['RY'] == 5) {
      padbox(result, 'B', undefined, get('RY'));
      description.push(getDesc('RY'));
  }
  var lu = undefined;
  if (entry['LU']) {
    lu = get('LU');
  }
  var lv = undefined;
  if (entry['MV']) {
    lv = get('MV');
  }
  if (lu || lv) {
    padbox(result, 'B', lu, lv);
  }
  if (lu) {
    description.push(getDesc('LU'));
  }
  if (lv) {
    description.push(getDesc('LV'));
  }

  if ((lu || entry['UL'] != 1) && entry['UL'] == entry['UR']) {
    padbox(result, 'B', get('UL') + '→W');
    description.push(getDesc('UL'));
  } else if (entry['UL'] != 1 || entry['UR'] != 1) {
    var ul = '      ';
    var ur = '      ';
    if (entry['UL'] != 1 || entry['UR'] == 3) {
      ul = ( get('UL') + 'L→WL').replace('EL', 'E').padEnd(6, ' ');
      description.push(getDesc('UL'));
    }
    if (entry['UR'] != 1 || entry['UL'] == 0) {
      ur = ( get('UR') + 'R→WR').replace('ER', 'E').replace('?R', '?').padEnd(6, ' ');
      description.push(getDesc('UR'));
    }
    result.push('B ' + ul + ur + '|');
  }
  if (entry['WM']) {
    padbox(result, 'B', get('WM'));
    description.push(getDesc('WM'));
  }

  if (entry['AL'] == 6) {
    padbox(result, 'D', get('AL'));
    description.push(getDesc('AL'));
  } else if (entry['AL'] == 28 || entry['AL'] == 30 || entry['AL'] == 31) {
    padbox(result, 'D', get('AL') + get('TR'));
    description.push(getDesc('AL'));
    description.push(getDesc('TR'));
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
    description.push(getDesc('UP'));
    if (entry['UP'] == 0 || entry['UP'] == 1) {
      padbox(result, 'D', get('UP') + names.join(','));
    } else {
      padbox(result, 'D', names.join(',') + get('UP') + n);
    }
  }

  if (entry['DG']) {
    padbox(result, 'D', get('DG'));
    description.push(getDesc('DG'));
  }
  if (entry['TR'] == 12 || entry['TR'] == 13 || entry['TR'] == 22) {
    padbox(result, 'D', get('TR'));
    description.push(getDesc('TR'));
  }

  if (entry['WS'] != 4 || entry['SF'] != 7) {
    padbox(result, 'L', get('WS'));
    description.push(getDesc('WS'));
  }
  if (entry['SF'] != 7) {
    padbox(result, 'L', get('SF'));
    description.push(getDesc('SF'));
  }

  if (entry['TR'] == 8) {
    padbox(result, 'S', get('TR'));
    description.push(getDesc('TR'));
  }
  var iv;
  if (entry['IV']) {
    iv = get('IV');
    if (iv.indexOf('→') >= 0) {
      // Assignments go into S
      padbox(result, 'S', get('IV'));
      description.push(getDesc('IV'));
      iv = undefined;
    }
  }

  var ss;
  if (entry['SS']) {
    ss = get('SS');
    description.push(getDesc('SS'));
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
    description.push(getDesc('ZF'));
    addr03 = '****';
  } else if (entry['ZN'] != 4) {
    padbox(result, 'R', get('ZN'));
    description.push(getDesc('ZN'));
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
    if (ab != '') {
      description.push(getDesc('AB'));
    }
    if (bb != '') {
      description.push(getDesc('BB'));
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
  return [result, description];
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
