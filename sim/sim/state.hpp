//
//  state.hpp
//  sim
//
//  Created by Ken on 5/3/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef state_hpp
#define state_hpp

#include <string>
#include <stdio.h>
#include <cstdint>

typedef struct Pending_t {
    uint8_t G1, G2;
    uint32_t L;
    uint8_t BS[4];
} Pending_t;

class State {
public:
    State();
    std::string debug();
    
    uint32_t MS[65536]; // Main storage
    uint32_t LS[256]; // Local Storage
    uint8_t KEYS[0]; // Need to set size
    uint8_t ED;
    bool SCPS;
    bool SCFS;
    uint32_t LSAR;
    uint8_t FN;
    bool REFETCH;
    bool LSGNS;
    bool RSGNS;
    bool PSS;
    bool IBFULL;
    uint8_t U;
    uint8_t V;
    uint8_t WL;
    uint8_t WR;
    uint8_t W;
    uint8_t MD;
    uint8_t SYSMASK;
    uint8_t KEY;
    uint8_t AMWP;
    uint16_t INPUT;
    uint8_t ILC;
    uint8_t CR;
    uint8_t PROGMASK;
    uint32_t IAR;
    uint8_t SYL1;
    uint8_t WFN;
    uint8_t LB;
    uint8_t MB;
    uint32_t SDR;
    uint32_t Y;
    uint32_t M;
    uint32_t L;
    uint32_t T;
    uint32_t XG;
    uint32_t H;
    uint32_t R;
    uint32_t TRAP;
    std::string TRAPTYPE;
    uint32_t ROAR;
    uint8_t F;
    uint8_t Q;
    uint8_t J;
    uint32_t T0;
    bool CAR;
    uint32_t SAR;
    bool CSTAT;
    uint8_t G1;
    uint8_t G2;
    bool G1NEG;
    bool G2NEG;
    bool BS[4];
    bool S[8];
    bool CIN;
    bool C0;
    bool AUX;
    struct Pending_t pending;
};

#endif /* state_hpp */
