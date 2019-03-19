# Label data.txt

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
  if p != 1:
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
      return label(l, lab)
  raise Exception('parse')

count = 0
num = 0
counts = defaultdict(int)
js = {}
with open('data.txt') as f:
 with open('data2.txt', 'w') as f2:
    for line in f.readlines():
      if line[0] == '*':
        print >>f2, line.strip()
      else:
        print >>f2, '%04x  %s' % (num, line.strip())
        count += 1
        try:
          r = parseLine(line.strip())
          counts['ok'] += 1
          js['%04x' % num] = r
        except Exception, e:
          counts[e.message] += 1
          print '%04x' % num, e
        num += 1
        if (num & 0x7F) == 0x58:
            num = (num & 0xFF80) + 0x80

print 'Success: %.2f%%, failures: %d ' % (counts['ok'] * 100. / count, count - counts['ok'])
print dict(counts)
if sum(counts.values()) != count:
  print 'Count mismatch'

with open('data.json', 'w') as jsfile:
  print >>jsfile, json.dumps(js)
