@echo off
chcp 65001 >nul
cd /d D:\chess
agy --add-dir "D:\chess" --effort high --print-timeout 45m -p="Do not use shell, terminal or command execution tools. Use only file-reading tools. Do not list directories. Read D:\chess\.reports\consult-wild-crown-popular\BRIEF.md first and answer exactly as it instructs. You are agy: your area is [A] chess variants and auto-chess. Read D:\chess\docs\PLAN.md and ONLY the nine dump files A-*.md listed in BRIEF.md under D:\chess\.reports\consult-wild-crown-popular\dumps\ by their absolute paths. Do not read the C-*.md files. Answer in Korean." > D:\chess\.reports\consult-wild-crown-popular\r1-agy.md 2>&1
echo EXIT=%ERRORLEVEL% >> D:\chess\.reports\consult-wild-crown-popular\r1-agy.md
