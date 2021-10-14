import re
with open('engine.cpp') as f1:
  with open('engine2.cpp', 'w') as f2:
    for line in f1.readlines():
      line = line.rstrip();
      while 1:
        m = re.search("\['([A-Z0-9]+)'\]", line)
        if m:
          print m.group(0), m.group(1)
          line = line.replace(m.group(0), '.' + m.group(1).lower())
        else:
          break

      while 1:
        m = re.search("state\.([a-z][a-z0-9]*)", line)
        if m:
          print m.group(0), m.group(1)
          line = line.replace(m.group(0), 'state.' + m.group(1).upper())
        else:
          print >>f2, line
          break
