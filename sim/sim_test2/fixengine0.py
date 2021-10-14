# Pull out entry constructors
import re

with open('engine.cpp') as fin:
  with open('engine.cpp1', 'w') as fout:
    for line in fin.readlines():
      line = line.rstrip();
      m = re.search('state, ({.*})', line)
      if m:
        print >> fout, '  entry_t entry = %s;' % m.group(1)
        line = line.replace(m.group(1), "entry);")
      print >> fout, line
