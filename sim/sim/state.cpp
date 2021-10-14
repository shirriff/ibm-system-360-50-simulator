//
//  state.cpp
//  sim
//
//  Created by Ken on 5/3/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#include <sstream>
#include "state.hpp"

// Constructor. Initialize with arbitrary values to help catch problems
State::State() : AMWP(0), AUX(0), C0(0), CAR(0), CIN(0), CR(0), CSTAT(0), ED(0), F(3), FN(3), G1(3), G1NEG(0),
G2(3), G2NEG(0), H(0xffffffff), IAR(0), IBFULL(0), ILC(0), INPUT(0), J(3), KEY(0), L(0xffffffff), LB(3), LSAR(3), LSGNS(0), M(0xffffffff),
MB(3), MD(3), PROGMASK(0), PSS(0), Q(1), R(0xffffffff), REFETCH(0), ROAR(0xffff), RSGNS(0), SAR(0xffffff), SCFS(0), SCPS(0), SDR(0xffffffff),
SYL1(0), SYSMASK(0), T(3), T0(0), TRAP(0), TRAPTYPE(""), U(3), V(3), W(3), WFN(0), WL(0), WR(0), XG(3), Y(3) {
    for (int i = 0; i < sizeof(LS) / sizeof(*LS); i++) {
        LS[i] = 0x01010101 * i;
    }
    for (int i = 0; i < sizeof(LS) / sizeof(*LS); i++) {
        MS[i] = 0xdeadbeef;
    }
    memset(BS, 0, sizeof(BS) / sizeof(*BS));
    memset(S, 0, sizeof(S) / sizeof(*S));
    
    pending.G1 = 0;
    pending.G2 = 0;
    pending.L = 0;
    memset(pending.BS, 0, sizeof(pending.BS) / sizeof(*pending.BS));
}

std::string State::debug() {
    std::ostringstream sstream;
    sstream << std::hex << "L: " << L <<
    ", R: " << R <<
    ", M: " << M <<
    ", T: " << T <<
    ", F: " << uint16_t(F) <<
    ", H: " << H <<
    ", J: " << J <<
    ", U: " << U <<
    ", V: " << V <<
    ", W: " << W <<
    ", LB: " << LB <<
    ", MB: " << MB <<
    ", MD: " << MD <<
    ", G1: " << G1 <<
    ", G2: " << G2 <<
    ", IAR: " << IAR <<
    ", LSAR: " << LSAR <<
    ", SGNS: " << LSGNS << " " << RSGNS <<
    ", S: " << S[0] << "," << S[1] << "," << S[2] << "," << S[3] << "," <<
    S[4] << "," << S[5] << "," << S[6] << "," << S[7] << ","
    ", BS: " << BS[0] << "," << BS[1] << "," << BS[2] << "," << BS[3] <<
    ", CR: " << CR <<
    ", CSTAT: " << CSTAT <<
    ", CAR: " << CAR;
    return sstream.str();
}
