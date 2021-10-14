//
//  decode.hpp
//  sim
//
//  Created by Ken on 5/7/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef decode_h
#define decode_h
#include <string>
#include <vector>
#include "entry.hpp"

void padbox(std::vector<std::string> &result, std::string label, std::string s1 = "", std::string s2 = "");
std::vector<std::string> decode(uint16_t addr, Entry_t entry);

#endif /* decode_h */
