import json, re, sys, html, time, urllib.request, os

OUT = sys.argv[1]
GAMES = [
    ("A", 1064340, "chess-evolved-online"),
    ("A", 1831830, "chessarama"),
    ("A", 1972440, "shotgun-king"),
    ("A", 1142080, "pawnbarian"),
    ("A", 1349230, "5d-chess"),
    ("A", 518060, "chess-ultra"),
    ("A", 1571220, "chessplosion"),
    ("A", 1046930, "dota-underlords"),
    ("A", 1530300, "auto-chess"),
    ("C", 646570, "slay-the-spire"),
    ("C", 2868840, "slay-the-spire-2"),
    ("C", 1997040, "marvel-snap"),
    ("C", 2379780, "balatro"),
    ("C", 2427700, "backpack-battles"),
    ("C", 1717640, "mahokenshi"),
]
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept-Language": "en",
       "Cookie": "birthtime=0; wants_mature_content=1; Steam_Language=english"}

def fetch(url):
    req = urllib.request.Request(url, headers=HDR)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")

def strip(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n\n", s)
    return s.strip()

def cards(h):
    out = []
    for blk in re.split(r'class="apphub_Card ', h)[1:]:
        title = re.search(r'<div class="title">([^<]*)</div>', blk)
        hours = re.search(r'<div class="hours">([^<]*)</div>', blk)
        helpful = re.search(r'<div class="found_helpful">(.*?)</div>', blk, re.S)
        date = re.search(r'<div class="date_posted">([^<]*)</div>(.*?)<div class="UserReviewCardContent_Footer"', blk, re.S)
        if not date:
            continue
        hp = strip(helpful.group(1)) if helpful else ""
        hp = re.sub(r"\s+", " ", hp)
        hp = re.sub(r"(helpful).*$", r"", hp)
        out.append({
            "title": title.group(1).strip() if title else "",
            "hours": hours.group(1).strip() if hours else "",
            "helpful": hp,
            "date": date.group(1).replace("Posted:", "").strip(),
            "text": strip(re.sub(r'<div class="(early_access_review|received_compensation|refunded)">.*?</div>', '', date.group(2), flags=re.S)),
        })
    return out

for area, appid, slug in GAMES:
    lines = []
    try:
        d = json.loads(fetch(f"https://store.steampowered.com/api/appdetails?appids={appid}&cc=us&l=en"))[str(appid)]["data"]
    except Exception as e:
        print("FAIL details", appid, e); continue
    lines.append(f"# [{area}] {d.get('name')} (Steam appid {appid})")
    lines.append(f"출처: https://store.steampowered.com/app/{appid}/ 및 https://steamcommunity.com/app/{appid}/reviews/ · 받은 날 2026-10-28 · 글자 그대로(HTML 태그만 제거)")
    lines.append("")
    lines.append(f"- 출시: {d.get('release_date',{}).get('date')} · 개발: {', '.join(d.get('developers',[]))} · 배급: {', '.join(d.get('publishers',[]))}")
    po = d.get("price_overview")
    lines.append(f"- 가격(USD): {po.get('final_formatted') if po else ('무료(Free to Play)' if d.get('is_free') else '정보 없음')}")
    lines.append(f"- 장르: {', '.join(g['description'] for g in d.get('genres',[]))}")
    lines.append(f"- 카테고리: {', '.join(c['description'] for c in d.get('categories',[]))}")
    lines.append(f"- 플랫폼: {', '.join(k for k,v in d.get('platforms',{}).items() if v)}")
    lines.append(f"- 한 줄: {strip(d.get('short_description',''))}")
    try:
        s = fetch(f"https://store.steampowered.com/app/{appid}/?l=english")
        tags = [re.sub(r"\s+", " ", t).strip() for t in re.findall(r'class="app_tag"[^>]*>([^<]*)', s)][:20]
        tips = re.findall(r'user_reviews_summary_row" href="#app_reviews_hash" data-tooltip-html="([^"]*)"', s)
        lines.append(f"- 사용자 태그(상위 20): {', '.join(tags)}")
        for t in tips[:2]:
            lines.append(f"- 리뷰 집계: {html.unescape(t)}")
    except Exception as e:
        lines.append(f"- (스토어 페이지 실패: {e})")
    lines.append("")
    lines.append("## 상세 설명 (스토어 원문, 4000자 절단)")
    lines.append(strip(d.get("detailed_description", ""))[:4000])
    lines.append("")
    time.sleep(1.0)
    try:
        top = []
        for p in (1, 2):
            top += cards(fetch(f"https://steamcommunity.com/app/{appid}/reviews/?browsefilter=toprated&filterLanguage=english&p={p}"))
            time.sleep(1.0)
        lines.append(f"## 도움됨 상위 리뷰 {len(top)}개 (영어 · 각 700자 절단)")
        for i, r in enumerate(top, 1):
            lines.append(f"### R{i} · {r['title']} · {r['hours']} · {r['helpful']} · {r['date']}")
            lines.append(r["text"][:700])
            lines.append("")
        rec = cards(fetch(f"https://steamcommunity.com/app/{appid}/reviews/?browsefilter=mostrecent&filterLanguage=english&p=1"))
        lines.append(f"## 최근 리뷰 {len(rec)}개 (영어 · 각 500자 절단)")
        for i, r in enumerate(rec, 1):
            lines.append(f"### N{i} · {r['title']} · {r['hours']} · {r['date']}")
            lines.append(r["text"][:500])
            lines.append("")
        n = len(top) + len(rec)
    except Exception as e:
        lines.append(f"(리뷰 받기 실패: {e})"); n = 0
    with open(os.path.join(OUT, f"{area}-{slug}.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("OK", area, appid, d.get("name"), "reviews", n, flush=True)
    time.sleep(1.0)
