@echo off
chcp 65001 >nul
cd /d D:\chess
agy --add-dir "D:\chess" --effort high --print-timeout 45m -p="Do not use shell, terminal or command execution tools. Use only file-reading tools. Do not list directories. Read D:\chess\.reports\consult-wild-crown-break\BRIEF.md first and answer exactly as it instructs. You are agy: your area is [A] technical feasibility. Read D:\chess\docs\PLAN.md (sections listed in the brief) and only the [A] files and line ranges listed in BRIEF.md by their absolute paths. Answer in Korean." > D:\chess\.reports\consult-wild-crown-break\r1-agy.md 2>&1
echo EXIT=%ERRORLEVEL% >> D:\chess\.reports\consult-wild-crown-break\r1-agy.md
