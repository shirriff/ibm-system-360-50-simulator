//
//  disasm.hpp
//  sim
//
//  Created by Ken on 4/27/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef disasm_h
#define disasm_h

#include <vector>

extern std::string getName(std::vector<uint16_t> hw);
extern std::string disasm(std::vector<uint16_t> hw);

#endif /* disasm_h */
