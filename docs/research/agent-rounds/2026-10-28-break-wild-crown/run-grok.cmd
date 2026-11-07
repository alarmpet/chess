@echo off
chcp 65001 >nul
cd /d D:\chess
grok -p "Read D:\chess\.reports\consult-wild-crown-break\BRIEF.md first and answer exactly as it instructs. You are grok: your area is [G] regulation, age rating and external facts. Read only D:\chess\docs\PLAN.md from disk. You must verify each row E1..E7 with web search or web fetch and cite the URL for each; quotes must be literal text from the fetched page. Answer in Korean." --output-format plain -m grok-4.6 --effort high --max-turns 80 --allow Read --allow Grep --allow Glob --allow WebFetch --allow WebSearch --deny Write --deny Edit --deny Bash > D:\chess\.reports\consult-wild-crown-break\r1-grok.md 2>&1
echo EXIT=%ERRORLEVEL% >> D:\chess\.reports\consult-wild-crown-break\r1-grok.md
