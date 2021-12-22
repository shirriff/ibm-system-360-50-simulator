# Test convert to binary algorithm
import sys

def convert(d): # D is binary coded decimal
  r = 0
  bit = 1
  while d:
    diff = 0
    if d & 0x10:
      diff += 0x6
    if d & 0x100:
      diff += 0x60
    if d & 0x1000:
      diff += 0x600
    if d & 0x10000:
      diff += 0x6000
    if d & 1:
      r += bit
    print '%x - %x = %x (%d)' % (d, diff, d-diff, d-diff)
    d -= diff
    d = d / 2
    bit = bit << 1
  print 'Result: %x (%d)' % (r, r)
  return r
      

convert(0x25594)
sys.exit(0)
for d00 in range(0, 10):
 for d0 in range(0, 10):
  for d1 in range(0, 10):
    for d2 in range(0, 10):
      h = (d00 << 12) | (d0 << 8) | (d1 << 4) | d2
      dec = d00 * 1000 + d0 * 100 + d1 * 10 + d2
      c = convert(h)
      if c != dec:
        print '***',
        print dec, hex(h), c, hex(c)


