import json

with open('/Users/ken/blog/ibm-360/microcode/js/data.json') as f:
  data = json.load(f)
  keys = data.keys()
  keys.sort()
  for i in range(0, 0xfd8):
    key = '%04x' % i
    if key in keys:
      print key, data[key]
    else:
      print key, 'skip'
