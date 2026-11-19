"""문서 연결·근거 파일·산술만 검사한다. 게임 기능을 테스트하지 않는다."""
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent
plan = root.parents[1] / 'plans/2026-11-11-slot-chess-village-plan.md'
missing = []
link_count = 0
for path in [plan, root / 'README.md']:
    text = path.read_text(encoding='utf-8')
    print(f'{path.name}: {len(text)} characters')
    for target in re.findall(r'\]\(([^)]+)\)', text):
        if target.startswith(('https://', 'http://', '#')):
            continue
        link_count += 1
        if not (path.parent / target.split('#')[0]).exists():
            missing.append((path.name, target))
assert not missing, missing
data = json.loads((root / 'mission-audit.json').read_text(encoding='utf-8'))
assert len(data['rows']) == 120
for level in ['easy', 'normal']:
    rows = [r for r in data['rows'] if r['level'] == level]
    assert len(rows) == 60
    for key, summary in data['summary'][level]['candidates'].items():
        hits = [r for r in rows if key in r['hit']]
        assert len(hits) == summary['completed']
        assert sum(r['hit'][key]['color'] == 'w' for r in hits) == summary['white']
        assert sorted(r['hit'][key]['ply'] for r in hits)[len(hits)//2] == summary['completionMedianPly']
for filename in ['quest-world.png', 'npc-noon.png', 'npc-bench-placed.png',
                 'npc-bench-final.png', 'juice-on.png', 'win-chance-test.png',
                 'video/contact-1.jpg', 'video/contact-2.jpg', 'video/transcript-ko.txt']:
    assert (root / filename).is_file(), filename
starting_grain, wins, losses = 3, 3, 3
coins = wins * 18 + losses * 10
work = (wins + losses) * 0.5
cycles = min(int(work), starting_grain)
parts = cycles * 2
assert (coins, parts, starting_grain - cycles, coins - 72) == (84, 6, 0, 12)
print(f'PASS: {link_count} local links; 120 trajectories and summary medians; 9 evidence files; workshop example')
