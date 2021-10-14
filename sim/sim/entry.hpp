//
//  entry.hpp
//  sim
//
//  Created by Ken on 5/3/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef ENTRY_h
#define ENTRY_h

#include <cstdint>

enum Roartype {CPU, IO, OTHER};

typedef struct Entry {
    Roartype type;
    uint8_t P1, LU, MV, ZP, ZF, ZN, TR, ZR, WS, SF, P2, IV, AL, WM, UP, MD, LB, MB, DG, UL, UR, P3, CE, LX, TC, RY, AD, AB, BB, UX, SS;
    uint8_t CT, HC, CG, MG, CS, SA, MS, WL, CL;
    uint8_t raw[12];
} Entry_t;

extern Entry_t microcode_data[];

#endif /* ENTRY_h */
