dividend = 0x0011223344556677
divisor = 0x12345678

print 'Should be', hex(dividend / divisor), hex(dividend % divisor)

print hex(dividend)
result = 0
dividend = dividend - (divisor << 31)
print 'first step', hex(dividend), hex(-dividend)
for i in range(30, -1, -1):
  print i, hex(dividend), hex(result)
  if dividend < 0:
    dividend += divisor << i
    print 0
    result = (result << 1)
  else:
    dividend -= divisor << i
    print 1
    result = (result << 1) + 1

result = result << 1
print hex(dividend)
if dividend < 0:
  dividend += divisor
else:
  result += 1
print hex(dividend)
print hex(result)
