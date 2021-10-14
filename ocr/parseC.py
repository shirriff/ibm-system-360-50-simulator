# Label data.txt, generating C++ file

import json
import re
import sys
from collections import defaultdict

def checkParity(parts, labels):
  ''' Check for odd parity. P indicates parity for the next section.
  '''
  def bitsum(s):
    return sum(int(c) for c in s)
  sums = map(bitsum, parts)
  assert(labels[0] == 'P')
  p = 1 # So first empty parity will be good
  for i, label in enumerate(labels):
    if label == 'P':
      if p != 1:
        raise Exception('parity')
      p = sums[i]
    else:
      p = (p + sums[i]) % 2
  if p != 1 and num < 0xfd5: # Deliberate parity errors at end
    raise Exception('parity')

blankCount =0
def label(l, labels):
  ''' Put labels on the fields.
      l is a string separated by spaces.
      labels is a string separated by spaces.
      '''
  parts = re.split(' +', l)
  labels = re.split(' +', labels)
  if len(parts) != len(labels):
    # There must be an extra space
    raise Exception('blank')
  checkParity(parts, labels)
  nums = [int(x, 2) for x in parts]
  return dict(zip(labels, nums))


def parseLine(l):
  lab0 = 'P LU  MV ZP     ZF   ZN  TR    ZR WS  SF  P IV  AL    WM   UP MD LB MB DG  UL UR P CE   LX  TC RY  AD   AB     BB    UX SS'
  pat0 = '. ... .. ...... .... ... ..... .  ... ... . ... ..... .... .. .  .  .  ... .. .. . .... ... .  ... .... ...... ..... .  ......'
  lab1 = 'P LU  MV ZP     ZF   ZN  TR    ZR WS  SF  P IV  AL    WM   UP MD LB MB DG  UL UR P CE   LX  TC RY  AD   AB     BB    UX SS     ?1 ?2'
  pat1 = '. ... .. ...... .... ... ..... .  ... ... . ... ..... .... .. .  .  .  ... .. .. . .... ... .  ... .... ...... ..... .  ...... .. ......'
  lab2 = 'P LU  MV ZP     ZF   ZN  TR    ZR CS SA SF  P CT  AL    WL  HC MS  CG MG  UL UR P CE   LX  TC RY  CL  ? AB     BB    UX SS'
  pat2 = '. ... .. ...... .... ... ..... .  .  .. ... . ... ..... ... .  ... .. ... .. .. . .... ... .  ... ... . ...... ..... .  ......'
  lab3 = 'P LU  MV ZP     ZF   ZN  TR    ZR CS SA SF  P CT  AL    WL  HC MS  CG MG  UL UR P CE   LX  TC RY  CL  ? AB     BB    UX SS     ?1 ?2'
  pat3 = '. ... .. ...... .... ... ..... .  .  .. ... . ... ..... ... .  ... .. ... .. .. . .... ... .  ... ... . ...... ..... .  ...... .. ......'
  lab4 = 'P B0                             P B1                       P B2'
  pat4 = '. .............................. . ........................ . .................................'

  raw = line.strip().replace(' ', '')
  if len(raw) == 98 and raw[-8:] == '00000000':
    raw = raw[:-8]
  if len(raw) != 90:
    print '***', raw, len(raw)
  raw = raw + '000000' # Pad to 96 (multiple of 8)
  chunks = ['0x%02x' % int(raw[i:i+8], 2) for i in range(0, 96, 8)]

  for lab, pat in [[lab0, pat0], [lab1, pat1], [lab2, pat2], [lab3, pat3], [lab4, pat4]]:
    l = l.replace('X', ' ')
    m = re.match(pat + '$', l)
    if m:
      # Check that matches are all 0's or 1's
      for i, ch in enumerate(l):
        if ch == '0' or ch == '1':
          if pat[i] != '.':
            raise Exception('parse-unexpected_digit')
        elif ch == ' ':
          if pat[i] != ' ':
            raise Exception('parse-unexpected_space')
        else:
          raise Exception('parse-unexpected_char')
      # Process the line
      return label(l, lab), chunks, lab
  raise Exception('parse')

count = 0
num = 0
counts = defaultdict(int)
with open('data.txt') as f:
 with open('data.cpp', 'w') as f2:
    print >> f2, '#include "simInt.hpp"'
    print >> f2
    print >> f2, 'entry_t data[] = {'
    for line in f.readlines():
      if line[0] == '*':
        pass
      else:
        if (num & 0x7F) == 0x58:
          while (num & 0x7f) != 0:
            print >> f2, '  {}, // %04x' % num
            num += 1
        count += 1
        try:
          r, chunks, labels = parseLine(line.strip())
          if 'ZR' in r and r['ZR'] != 0: print 'Bad ZR at %x' % num
          if 'UX' in r and r['UX'] != 0: print 'Bad UX at %x' % num
          counts['ok'] += 1
          print >> f2, '  {',
          if 'IV' in labels:
            print >> f2, '.type=CPU, ',
          elif 'CT' in labels:
            print >> f2, '.type=IO, ',
          else:
            print >> f2, '.type=OTHER, ',

          for lab in re.split(' +', labels):
            if r[lab] == 0: continue
            if lab == 'P': continue # parity
            if lab == 'B0' or lab == 'B1' or lab == 'B2': continue
            print >> f2, '.%s=%d,' % (lab.upper(), r[lab]),
          print >> f2, ' .raw={%s}}, // %04x' % (', '.join(chunks), num)
        except Exception, e:
          counts[e.message] += 1
          print >> f2,'  {.raw={%s}}, // %04x' % (', '.join(chunks), num)
        num += 1
    print >> f2, '};'

print 'Success: %.2f%%, failures: %d ' % (counts['ok'] * 100. / count, count - counts['ok'])
print dict(counts)
if sum(counts.values()) != count:
  print 'Count mismatch'
