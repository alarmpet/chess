# usage: python -I steam_dump_cozy.py <outdir>
# Based on 2026-10-28-popular-wild-crown/steam_dump.py, plus cursor pagination via /homecontent/
import json, re, sys, html, time, urllib.request, urllib.parse, os, statistics
sys.stdout.reconfigure(encoding="utf-8")
OUT = sys.argv[1]
GAMES = [(1291340,"townscaper"),(2198150,"tiny-glade"),(3115220,"town-to-city"),(1046030,"islanders"),
         (2368930,"islanders-new-shores"),(1455840,"dorfromantik"),(413150,"stardew-valley"),
         (1651560,"fabledom"),(1269710,"kainga")]
HDR = {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)","Accept-Language":"en",
       "Cookie":"birthtime=0; wants_mature_content=1; Steam_Language=english"}
def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=HDR),timeout=40) as r:
        return r.read().decode("utf-8","replace")
def strip(s):
    s=re.sub(r"<br\s*/?>","\n",s); s=re.sub(r"<[^>]+>","",s); s=html.unescape(s)
    s=re.sub(r"[ \t]+"," ",s); s=re.sub(r"\n\s*\n+","\n\n",s); return s.strip()
def cards(h):
    out=[]
    for blk in re.split(r'class="apphub_Card ',h)[1:]:
        title=re.search(r'<div class="title">([^<]*)</div>',blk)
        hours=re.search(r'<div class="hours">([^<]*)</div>',blk)
        helpful=re.search(r'<div class="found_helpful">(.*?)</div>',blk,re.S)
        date=re.search(r'<div class="date_posted">([^<]*)</div>(.*?)<div class="UserReviewCardContent_Footer"',blk,re.S)
        if not date: continue
        hp=re.sub(r"\s+"," ",strip(helpful.group(1))) if helpful else ""
        hp=re.sub(r"(helpful).*$",r"\1",hp)
        out.append({"title":title.group(1).strip() if title else "","hours":hours.group(1).strip() if hours else "",
                    "helpful":hp[:60],"date":date.group(1).replace("Posted:","").strip(),
                    "text":strip(re.sub(r'<div class="(early_access_review|received_compensation|refunded)">.*?</div>','',date.group(2),flags=re.S))})
    return out
def pages(appid,flt,lang,n):
    res=[];cursor=None
    for p in range(1,n+1):
        q={"userreviewsoffset":(p-1)*10,"p":p,"numperpage":10,"browsefilter":flt,"appid":appid,"appHubSubSection":10,
           "l":"english","filterLanguage":lang,"searchText":"","maxInappropriateScore":100,"forceanon":1}
        for k in "workshopitemspage readytouseitemspage mtxitemspage itemspage screenshotspage videospage artpage allguidepage webguidepage integratedguidepage discussionspage".split(): q[k]=p
        if cursor: q["userreviewscursor"]=cursor
        h=fetch(f"https://steamcommunity.com/app/{appid}/homecontent/?"+urllib.parse.urlencode(q))
        c=cards(h)
        if not c: break
        res+=c
        m=re.findall(r'name="userreviewscursor" value="([^"]*)"',h)
        cursor=m[0] if m else None
        time.sleep(1.2)
        if not cursor: break
    # dedupe
    seen=set();o=[]
    for r in res:
        k=r["text"][:80]
        if k in seen: continue
        seen.add(k);o.append(r)
    return o
def hrs(r):
    m=re.search(r"([\d,\.]+) hrs",r["hours"]); return float(m.group(1).replace(",","")) if m else None
def stats(rs):
    h=[x for x in map(hrs,rs) if x is not None]
    neg=sum(1 for r in rs if r["title"].startswith("Not"))
    if not h: return f"n={len(rs)} not-recommended={neg}"
    return f"n={len(rs)} not-recommended={neg} hours median={statistics.median(h):.1f} min={min(h)} max={max(h)}"
for appid,slug in GAMES:
    L=[]
    d=json.loads(fetch(f"https://store.steampowered.com/api/appdetails?appids={appid}&cc=us&l=en"))[str(appid)]["data"]
    L.append(f"# {d.get('name')} (Steam appid {appid})")
    L.append(f"Source: https://store.steampowered.com/app/{appid}/ and https://steamcommunity.com/app/{appid}/reviews/ fetched 2026-10-31. Review text is user content.")
    L.append(f"- Release: {d.get('release_date',{}).get('date')}; dev: {', '.join(d.get('developers',[]))}; pub: {', '.join(d.get('publishers',[]))}")
    po=d.get("price_overview"); L.append(f"- Price USD: {po.get('final_formatted') if po else 'n/a'}")
    L.append(f"- Short: {strip(d.get('short_description',''))}")
    try:
        s=fetch(f"https://store.steampowered.com/app/{appid}/?l=english")
        L.append("- Tags: "+", ".join([re.sub(r'\s+',' ',t).strip() for t in re.findall(r'class="app_tag"[^>]*>([^<]*)',s)][:20]))
        for t in re.findall(r'user_reviews_summary_row" href="#app_reviews_hash" data-tooltip-html="([^"]*)"',s)[:2]: L.append("- Review aggregate: "+html.unescape(t))
    except Exception as e: L.append(f"- store page fail {e}")
    L.append("\n## Store description (3000 chars)\n"+strip(d.get("detailed_description",""))[:3000]+"\n")
    tot=0
    for flt,lang,n,cut,name in [("toprated","english",6,900,"Top rated EN"),("mostrecent","english",4,600,"Most recent EN"),("toprated","koreana",3,700,"Top rated KO")]:
        try:
            rs=pages(appid,flt,lang,n)
        except Exception as e:
            L.append(f"## {name}: FAILED {e}"); continue
        L.append(f"## {name}: {stats(rs)}")
        for i,r in enumerate(rs,1):
            L.append(f"### {name[:3]}{i} | {r['title']} | {r['hours']} | {r['helpful']} | {r['date']}\n{r['text'][:cut]}\n")
        tot+=len(rs); print(slug,name,stats(rs),flush=True)
    with open(os.path.join(OUT,f"{slug}.md"),"w",encoding="utf-8") as f: f.write("\n".join(L))
    print("OK",slug,tot,flush=True)
