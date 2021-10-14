import re

with open('engine.cpp1') as fin:
  with open('engine.cpp2', 'w') as fout:
    for line in fin.readlines():
      line = line.rstrip();
      m = re.search('state = {(.*)};', line)
      if m:
        parts = m.group(1).split(', ')
        for part in parts:
          if not part.strip(): continue
          m = re.match('"(.*)": (.*)', part)
          if m:
            g1 = m.group(1)
            g2 = m.group(2)
            m = re.search('( /\*.*\*/)', g2)
            if m:
              g2 = g2.replace(m.group(1), '') + m.group(1);
            print >> fout, '  state.%s = %s;' % (g1, g2)
          else:
            #print 'Bad', part
            print >> fout, line
      else:
        m = re.search('entry = {(.*)};', line)
        if m:
          parts = m.group(1).split(', ')
          for part in parts:
            if not part.strip(): continue
            m = re.match('"(.*)": (.*)', part)
            if m:
              g1 = m.group(1)
              g2 = m.group(2)
              m = re.search('( /.*/)', g2)
              if m:
                print '***', m.group(1)
                g2 = g2.replace(m.group(1), ';') + m.group(1)
              else:
                g2 = g2 + ';'
              print >> fout, '  entry.%s = %s' % (g1, g2)
            else:
              # print 'Bad', part
              print >> fout, line
        else:
          print >> fout, line
