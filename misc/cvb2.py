# Test convert to binary algorithm
import sys

def convert(d): # D is binary coded decimal
  r = 0
  bit = 1
  diff = 0
  while d:
    print '%x - %x = %x shifted = (%x)' % (d, diff, d-diff, (d-diff) / 2)
    d -= diff
    diff = 0
    if d & 0x20:
      diff += 0x6
    if d & 0x200:
      diff += 0x60
    if d & 0x2000:
      diff += 0x600
    if d & 0x20000:
      diff += 0x6000
    print '%x generated diff %x' % (d, diff)
    if d & 1:
      r += bit
    d = d / 2
    bit = bit << 1
  r /= 2
  print 'Result: %x (%d)' % (r, r)
  return r
      

convert(0x25594*2)
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


