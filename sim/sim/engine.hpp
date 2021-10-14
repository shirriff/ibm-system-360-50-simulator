//
//  engine.hpp
//  sim
//
//  Created by Ken on 4/27/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef engine_h
#define engine_h

#include "entry.hpp"
#include "state.hpp"

std::string store(State& state);
std::string read(State& state);

bool tzbs(State& state);

void adderLX(State& state, Entry_t& entry);
void adderRY(State& state, Entry_t& entry);
void adderDG(State& state, Entry_t& entry);
void adderT(State& state, Entry_t& entry);
void roar(State& state, Entry_t& entry);
void roarAB(State& state, Entry_t& entry);
void roarBB(State& state, Entry_t& entry);
void roarZN(State& state, Entry_t& entry);
void moverU(State& state, Entry_t& entry);
void moverV(State& state, Entry_t& entry);
void moverWL(State& state, Entry_t& entry);
void moverWR(State& state, Entry_t& entry);
std::string adderAL(State& state, Entry_t& entry);
void stat(State& state, Entry_t& entry);
void storeMover(State& state, Entry_t& entry);
void iar(State& state, Entry_t& entry);
void iar2(State& state, Entry_t& entry);
void counters(State& state, Entry_t& entry);
void localStorageLSAR(State& state, Entry_t& entry);
std::string adderLatch(State& state, Entry_t& entry);
void localStore(State& state, Entry_t& entry);
std::string cycle(State& state, Entry_t& entry);

std::pair<uint32_t, uint8_t> sr1(uint8_t src, uint32_t reg, uint8_t dst);
std::pair<uint32_t, uint8_t> sl1(uint8_t src, uint32_t reg, uint8_t dst);
std::pair<uint32_t, uint8_t> sr4(uint8_t src, uint32_t reg);
std::pair<uint32_t, uint8_t> sl4(uint8_t src, uint32_t reg);

#endif /* engine_h */
