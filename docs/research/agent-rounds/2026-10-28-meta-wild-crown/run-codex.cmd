@echo off
chcp 65001 >nul
cd /d D:\chess
codex exec -s read-only - < D:\chess\.reports\consult-wild-crown-meta\C_prompt.md > D:\chess\.reports\consult-wild-crown-meta\r1-codex.md 2>&1
echo EXIT=%ERRORLEVEL% >> D:\chess\.reports\consult-wild-crown-meta\r1-codex.md
