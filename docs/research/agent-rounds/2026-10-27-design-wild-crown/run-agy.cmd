@echo off
chcp 65001 >nul
cd /d D:\chess
agy --add-dir "D:\chess" --add-dir "D:\study-game" --effort high --print-timeout 45m -p="Do not use shell, terminal or command execution tools. Use only file-reading tools. Do not list directories. Read D:\chess\.reports\consult-wild-crown-design\BRIEF.md first and answer exactly as it instructs. You are agy: your area is [A]. Read only D:\chess\docs\PLAN.md and the [A] files listed in BRIEF.md by their absolute paths. Answer in Korean." > D:\chess\.reports\consult-wild-crown-design\r1-agy.md 2>&1
echo EXIT=%ERRORLEVEL% >> D:\chess\.reports\consult-wild-crown-design\r1-agy.md
