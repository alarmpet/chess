# Town economy pacing check. Uses the real drop table; every town number is a placeholder under test.
# Result tells whether one game buys one visible change for adults and for weak players.
import random, statistics as st
random.seed(11)
T = {'p': (.90, .09, .009, .001), 'n': (.50, .40, .095, .005), 'b': (.50, .40, .095, .005), 'r': (.40, .40, .18, .02), 'q': (.20, .40, .35, .05), 'm': (0, .50, .40, .10)}
PER = {'p': 37 / 6, 'n': 11 / 6, 'b': 9 / 6, 'r': 9 / 6, 'q': 5 / 6}
ANIMAL = {'p': 'meerkat', 'n': 'kangaroo', 'b': 'panda', 'r': 'rhino', 'q': 'tiger', 'm': 'lion'}
# name: (acorns, what must live there, goods needed to build)
BUILD = [
    ('field', 20, ('any', 0)), ('grove', 30, ('any', 0)), ('mill', 40, ('any', 0)), ('market', 60, ('any', 0)),
    ('bakery', 80, ('any', 1)), ('firefly', 120, ('any', 1)), ('spring', 160, ('any', 1)), ('stage', 240, ('any', 2))
]


def roll(k):
    r = random.random(); a = 0
    for i, p in enumerate(T[k]):
        a += p
        if r < a: return i
    return 0


def run(scale, win, seed_income=True):
    owned = set(); cards = {}; acorns = 0; built = []; first = True; sr = sh = 0
    log = {}; changes = []
    for g in range(1, 61):
        won = random.random() < win
        seq = []
        for k, v in PER.items():
            n = v * scale; seq += [k] * (int(n) + (random.random() < n - int(n)))
        if won: seq.append('m')
        for k in seq:
            t = roll(k)
            if first: t = max(t, 2); first = False
            sr += 1; sh += 1
            if sr >= 10: t = max(t, 2)
            if sh >= 60: t = 3
            if t >= 2: sr = 0
            if t == 3: sh = 0
            cards[(ANIMAL[k], t)] = cards.get((ANIMAL[k], t), 0) + 1
        if not seq: cards[('meerkat', 0)] = cards.get(('meerkat', 0), 0) + 1
        for (a, r), n in list(cards.items()):   # merge whenever three spares exist, up to rare
            while r < 2 and cards[(a, r)] >= 4:
                cards[(a, r)] -= 3; cards[(a, r + 1)] = cards.get((a, r + 1), 0) + 1
        acorns += 30 if won else 15
        n = len(built)
        acorns += (6 if 'market' in built else 0) * ('field' in built) + (10 if 'bakery' in built and 'market' in built else 0)
        got = 0
        for name, cost, (_, tier) in BUILD:
            if name in built: continue
            residents = sum(1 for (a, r), c in cards.items() if r >= tier for _ in range(c))
            if residents > len(built) and acorns >= cost and got < 1:
                acorns -= cost; built.append(name); log[name] = g; got = 1
        changes.append(got)
    return log, changes


for label, scale, win in (('adult', .5, .5), ('child', .3, .3), ('auto', 1, .85)):
    runs = [run(scale, win) for _ in range(3000)]
    print(label)
    for name, *_ in BUILD:
        vals = sorted(l.get(name, 61) for l, _ in runs)
        print(f'  {name:8s} median {vals[len(vals)//2]:3d}  p90 {vals[int(.9*len(vals))]:3d}')
    print('  built by game 10', round(st.mean(sum(c[:10]) for _, c in runs), 1), 'by game 20', round(st.mean(sum(c[:20]) for _, c in runs), 1))
