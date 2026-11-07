@echo off
chcp 65001 >nul
cd /d D:\chess
grok -p "Read D:\chess\.reports\consult-wild-crown-meta\BRIEF.md first and answer exactly as it instructs. You are grok: your area is [G] external facts and regulation. Read only D:\chess\docs\PLAN.md from disk. You must verify each row E1..E8 with web search or web fetch and cite the URL for each. Answer in Korean." --output-format plain -m grok-4.6 --effort high --max-turns 60 --allow Read --allow Grep --allow Glob --allow WebFetch --allow WebSearch --deny Write --deny Edit --deny Bash > D:\chess\.reports\consult-wild-crown-meta\r1-grok.md 2>&1
echo EXIT=%ERRORLEVEL% >> D:\chess\.reports\consult-wild-crown-meta\r1-grok.md
