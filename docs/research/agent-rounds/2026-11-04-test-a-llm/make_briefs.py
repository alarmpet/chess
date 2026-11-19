# 하네스 로그 → 모델별 브리핑(BRIEF-<player>.md). 각 모델은 자기 기록만 받는다.
# 절단은 전부 그 자리에서 밝힌다(10-31 교훈: 기보 600자 잘림을 게임 결함으로 보고).
import json, pathlib, sys, statistics

BASE = pathlib.Path(r"C:\Users\petbl\ego\chess-test-a-20261104")
LOGS = BASE / "logs"
OUT = pathlib.Path(r"D:\chess\.reports\consult-test-a")
OUT.mkdir(parents=True, exist_ok=True)
PLAYERS = sys.argv[1:] or ["agy", "grok", "codex"]
ROLE = {
    "agy": "체스를 막 배운 여덟 살 어린이",
    "grok": "체스 규칙만 아는 어른 초보(말을 잃는 것이 아깝고, 무엇을 모으고 얻는지에 관심)",
    "codex": "체스를 오래 둔 어른(빠른 수, 연출 싫어함, 수집에 냉담)",
}
TEXT_CAP = 900
BOILER = set()

def cut(s, n=TEXT_CAP):
    s = s or ""
    # 첫 화면에 있던 상단 공통 글자(제목·버튼·조작법)는 이후 덤프에서 빼고 몇 줄을 뺐는지 적는다. 명령줄 인수 길이 제한 때문이다.
    if BOILER:
        lines = s.split("\n")
        kept = [l for l in lines if l not in BOILER]
        removed = len(lines) - len(kept)
        s = "\n".join(kept)
        if removed:
            s = f"(첫 화면과 같은 상단 공통 글자 {removed}줄 생략)\n" + s
    return s if len(s) <= n else s[:n] + f"\n[… 여기서 {len(s)-n}자를 하네스가 잘랐다. 화면 결함이 아니다]"

def game_block(g):
    lines = [f"## {g['id']}판: {g['label']}", f"기보: {g.get('pgn','')}"]
    end = g.get("end") or g.get("final") or {}
    lines.append(f"끝: 차례 표시 '{end.get('hud','')}' / {end.get('tray','')} / 콘솔 오류 {len(end.get('errors') or [])}건" + (f" {end.get('errors')}" if end.get('errors') else ""))
    model_rows = [p for p in g["plies"] if p["source"] == "model"]
    auto_rows = [p for p in g["plies"] if p["source"] != "model"]
    for p in model_rows:
        lines.append(f"{p['ply']+1} {p['san']} [model] 내 차례까지 {p['msUntilMyTurn']}ms 표시'{p['hud']}' {p['tray']} 이유:{p['why']}")
    if auto_rows:
        ms = [p["msUntilMyTurn"] for p in auto_rows]
        lines.append(f"[auto] 이후 {len(auto_rows)}수는 자동으로 두었다(네가 고르지 않았다). 그 수들의 내 차례까지 중앙값 {int(statistics.median(ms))}ms, 최대 {max(ms)}ms")
    for ev in g.get("events", []):
        lines.append(f"\n### 판 중간 사건: {ev.get('kind')}")
        for k, v in ev.items():
            if k in ("kind",): continue
            if k == "text": lines.append("화면에 보이는 글자(위에서 아래):\n" + cut(v, 1200))
            else: lines.append(f"{k}: {v}")
    return "\n".join(lines)

def after_block(a):
    lines = [f"### {a['id']}판 끝난 뒤 화면 (하네스가 순서대로 눌렀다. 각 단계의 '보이는 글자'만 적었다)"]
    for s in a["steps"]:
        lines.append(f"\n#### 단계: {s['name']}")
        for k, v in s.items():
            if k == "name": continue
            if k == "text":
                if s["name"] in ("결과 카드 닫기", "표식 닫기·체스로", "외형 닫기"): lines.append("(글자는 앞 단계와 거의 같아 생략)"); continue
                lines.append(cut(v))
            else: lines.append(f"{k}: {v}")
    if a.get("errors"): lines.append(f"\n콘솔 오류: {a['errors']}")
    return "\n".join(lines)

HEAD = """너는 {role} 역할로 WILD CROWN(귀여운 동물 3D 체스. 체스 규칙은 그대로이고, 판이 끝나면 잡은 동물이 카드가 되고 도토리로 섬을 키운다)을 방금 세 판 플레이했다.
아래는 네가 실제 게임에서 고른 수와, 게임이 화면에 실제로 보여 준 글자다. 사람 플레이 테스트(「사람 시험 A」)를 네가 대신한다.

주의:
- 너는 화면과 소리를 직접 보거나 듣지 못했다. 글자 기록에 있는 것만 말하고, 귀여웠다·예뻤다·시끄러웠다를 지어내지 마라.
- 기록에 없는 숫자·문구·기능을 인용하면 그 항목 전체를 버린다. 근거는 기록의 글자 그대로 인용한다.
- 파일이나 도구를 쓰지 마라. 여기 준 내용으로만 답한다.
- 「보이는 글자」는 하네스가 화면에 실제로 보이는 텍스트만 위에서 아래로 뽑은 것이다. 2열 격자도 한 줄씩 나오므로 배치는 알 수 없다. 잘린 곳은 그 자리에 적었다.
- [auto] 수는 끝까지 가기 위해 하네스가 자동으로 둔 것이다. 네 판단이 아니다.
- '내 차례까지' 는 네가 둔 순간부터 AI 응수가 끝나 다시 네 차례가 될 때까지의 ms 다.

이미 알고 있어서 다시 내지 않아도 되는 것:
- 세 모델이 화면을 못 보므로 「귀여움·소리·역할 식별(동물 그림으로 역할이 읽히나)」은 이 라운드에서 판정하지 않는다.

답 형식 (한국어, 전체 3500자 이내). 번호마다 기록 인용을 붙인다:
1. 말 구분: 차례 표시·잡은 말 표시로 내 말과 상대 말이 헷갈린 순간이 있었나.
2. 판 길이: 네 역할에게 한 판이 길었나 짧았나. 근거는 ms 수치.
3. 봐줬다는 느낌: AI 가 봐준다고 느꼈나(이유를 기록에서).
4. 한 판 더: 판이 끝난 뒤 화면의 글자 가운데 무엇이 다음 판을 두게 했고, 무엇이 막았나.
5. 다음 목표: 판 끝·섬·도감 화면을 보고 「다음에 무엇을 하면 무엇을 얻는지」를 네 말로 한 줄 적어라. 기록의 어느 글자에서 알았는지 인용. 알 수 없었으면 「알 수 없었다」.
6. 갖고 싶다 ♡: 화면의 글자 가운데 갖고 싶어진 것이 있나. 없으면 없다고.
7. 산 것/번 것: 이 게임에서 돈으로 사는 것과 플레이로 얻는 것이 구분되나. 기록 인용.
8. 기권 확인창(3판): 글자를 읽고 무엇을 고를지 바로 알았나. 헷갈린 단어.
9. 새로고침(3판): 새로고침 뒤 화면이 벌처럼 느껴졌나(판이 날아갔나, 안내가 있었나).
10. 불편하거나 헷갈린 점 최대 5개(심각도 상·중·하, 기록 인용).
11. 바꾸지 말아야 할 것 최대 2개.
12. 이 평가에서 네가 틀릴 수 있는 곳 2개.

"""

for pl in PLAYERS:
    parts = [HEAD.format(role=ROLE[pl])]
    first = LOGS / f"{pl}-first.json"
    if first.exists():
        fs = json.loads(first.read_text(encoding="utf-8")).get("firstScreen", "")
        BOILER.clear()
        parts.append("## 첫 화면 (로딩 뒤 9초, 아무것도 누르기 전)\n" + cut(fs, 1200))
        BOILER.update(l for l in fs.split("\n") if l.strip())
    for gid in (1, 2, 3):
        g = LOGS / f"{pl}-g{gid}.json"
        if not g.exists():
            parts.append(f"## {gid}판: 기록 없음(하네스가 이 판을 끝내지 못했다)")
            continue
        if gid == 2:
            e = LOGS / f"{pl}-g2-entrance.json"
            if e.exists():
                ent = json.loads(e.read_text(encoding="utf-8"))
                parts.append("## 2판 시작 전: 라이벌 입장식 화면(시작 뒤 0.8초 · 2.3초 · 3.8초의 보이는 글자)\n" + "\n".join(f"--- {t['atMs']}ms 뒤 누적 ---\n{cut(t['text'], 900)}" for t in ent["texts"]))
        parts.append(game_block(json.loads(g.read_text(encoding="utf-8"))))
        a = LOGS / f"{pl}-g{gid}-after.json"
        if a.exists():
            parts.append(after_block(json.loads(a.read_text(encoding="utf-8"))))
    text = "\n\n".join(parts)
    (OUT / f"BRIEF-{pl}.md").write_text(text, encoding="utf-8", newline="\n")
    print(pl, len(text), "chars")
