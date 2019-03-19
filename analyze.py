
# LHS of A expression
ry = {0: '',
1: 'R',
2: 'M',
3: 'M23', # +L becomes /L 61d?

# RHS of A expression
lx = {0: '1',
1: 'L'}

# dest of A expression
tr = {
0: '--none--',
1: 'R',
2: 'R0',
3: 'M',
4:
5: 'L0',
6:
7: 'L',
8:
9:
10:
11:
12:
13:
14: 'R13',
15:
16:
17:
18:
19:
20: 'H',
21: 'IA',
22:
23: 'M,SP',
24: 'L,M',
25:
26:
27: 'MD',
28:
29:
30:
31:
]

# Sign of A expression
tc = {0: '-', 1: '+'}

# B
# Mover input left side -> U
lu = {
0: 'none',
1: 'MD,F', # 603
2: 'R3',
3:
4:
5:
6:
7: 'LLB', # 636
}
# Mover input right side -> V
mv = {
0: 'none',
1: 'MLB',
2: 'MMB',
}
# Mover action 0-3 -> WL, -> WR
# Combined if same?
ul = {
0: 'none', # E->WL in d29
1: 'U', # E->WR in 61b?
2: 'V',
3: '?', # 636, 603
}
ur = {
0: 'none',
1: 'U',
2: 'V', # or VR
3: '?', # 636, 603
}
# Mover output destination W ->
wm = {
0: 'none',
1: 'MMB',
2: 'MB', # W67->MB 61f
3:
4:
5:
6:
7:
8:
9:
10:
11: 'G',
12: 'MMB(E?)', # d29
13:
14: 'F',
15: 'MD,F',
}
# SDR parity bits to CE bits SEMT
ry = {
0:
1:
2:
3: 'W67', # 61f
4:
5:
}




