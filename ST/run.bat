@echo off
chcp 65001 > nul
echo 🚀 키움증권 주식매매 프로그램 실행 중...
echo.

:: 가상환경 확인
if not exist venv32\Scripts\activate.bat (
    echo ❌ 가상환경이 없습니다. setup.bat을 먼저 실행하세요.
    pause
    exit /b 1
)

:: 가상환경 활성화 및 실행
call venv32\Scripts\activate.bat
python main.py

pause



