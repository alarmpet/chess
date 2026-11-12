#!/bin/bash
# 화면 평가 실행(읽기 전용 모드만). codex 설정은 실행 앞뒤로 백업·비교한다.
D=D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm
cd "$(dirname "$0")"
IMGS=$(cat imglist.txt | tr '\n' ' ')
LIST=$(cat imglist.txt | sed 's/^/- /')
for m in agy grok codex; do
  { cat BRIEF-screens.md; echo; cat role-$m.md; echo; echo "## 이미지 파일 (모두 열어 보고 답하라. 도구는 파일 읽기만 쓴다)"; echo "$LIST"; } > BRIEF-$m.md
done
agy --mode plan --sandbox --add-dir $D/img --print-timeout 30m -p="$(cat BRIEF-agy.md)" > r1-agy.md 2>&1 &
grok -p "$(cat BRIEF-grok.md)" --output-format plain -m grok-4.6 --permission-mode plan --allow Read --max-turns 40 > r1-grok.md 2>&1 &
codex exec -c model=gpt-6-sol -s read-only $(for f in $IMGS; do printf -- '-i %s ' "$f"; done) - < BRIEF-codex.md > r1-codex.md 2>&1 &
wait
