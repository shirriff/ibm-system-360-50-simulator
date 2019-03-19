# Label data.txt

num = 0
with open('data.txt') as f:
  with open('data2.txt', 'w') as f2:
    for line in f.readlines():
      if line[0] == '*':
        print >>f2, line.strip()
        print '%04x  %s' % (num, line.strip())
      else:
        print >>f2, '%04x  %s' % (num, line.strip())
        parseLine(line.strip())
        num += 1
        if (num & 0x7F) == 0x58:
            num = (num & 0xFF80) + 0x80
