//
//  engine.hpp
//  sim
//
//  Created by Ken on 4/27/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef engine_h
#define engine_h

typedef struct pending_t {
    uint8_t G1, G2;
    uint32_t L;
    uint8_t BS[4];
} pending_t;

typedef struct state {
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
    struct pending_t pending;
} state_t;

typedef struct entry {
    uint8_t P1, LU, MV, ZP, ZF, ZN, TR, ZR, WS, SF, P2, IV, AL, WM, UP, MD, LB, MB, DG, UL, UR, P3, CE, LX, TC, RY, AD, AB, BB, UX, SS;
} entry_t;

std::string store(state_t& state);
std::string read(state_t& state);

bool tzbs(state_t& state);

void adderLX(state_t& state, entry_t& entry);
void adderRY(state_t& state, entry_t& entry);
void adderDG(state_t& state, entry_t& entry);
void adderT(state_t& state, entry_t& entry);
void roar(state_t& state, entry_t& entry);
void roarAB(state_t& state, entry_t& entry);
void roarBB(state_t& state, entry_t& entry);
void roarZN(state_t& state, entry_t& entry);
void moverU(state_t& state, entry_t& entry);
void moverV(state_t& state, entry_t& entry);
void moverWL(state_t& state, entry_t& entry);
void moverWR(state_t& state, entry_t& entry);
std::string adderAL(state_t& state, entry_t& entry);
void stat(state_t& state, entry_t& entry);
void storeMover(state_t& state, entry_t& entry);
void iar(state_t& state, entry_t& entry);
void iar2(state_t& state, entry_t& entry);
void counters(state_t& state, entry_t& entry);
void localStorageLSAR(state_t& state, entry_t& entry);
std::string adderLatch(state_t& state, entry_t& entry);
void localStore(state_t& state, entry_t& entry);

std::pair<uint32_t, uint8_t> sr1(uint8_t src, uint32_t reg, uint8_t dst);
std::pair<uint32_t, uint8_t> sl1(uint8_t src, uint32_t reg, uint8_t dst);
std::pair<uint32_t, uint8_t> sr4(uint8_t src, uint32_t reg);
std::pair<uint32_t, uint8_t> sl4(uint8_t src, uint32_t reg);

#endif /* engine_h */
