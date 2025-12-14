@echo off
chcp 65001 > nul
echo ========================================
echo   키움증권 주식매매 프로그램 설치
echo ========================================
echo.

:: 32비트 Python 확인
echo [1/4] Python 32비트 확인 중...
where py >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python Launcher(py)가 없습니다.
    echo    Python을 먼저 설치해주세요.
    pause
    exit /b 1
)

:: 32비트 Python 버전 체크
py -3.10-32 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 3.10 32비트가 설치되지 않았습니다.
    echo.
    echo 👉 설치 방법:
    echo    1. https://www.python.org/downloads/release/python-31011/
    echo    2. "Windows installer (32-bit)" 다운로드
    echo    3. 설치 시 "Add Python to PATH" 체크
    echo.
    pause
    exit /b 1
)

echo ✅ Python 3.10 32비트 발견!
py -3.10-32 --version

echo.
echo [2/4] 가상환경 생성 중...
if exist venv32 (
    echo    기존 가상환경 발견, 건너뜀...
) else (
    py -3.10-32 -m venv venv32
    echo ✅ 가상환경 생성 완료!
)

echo.
echo [3/4] 패키지 설치 중...
call venv32\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
echo ✅ 패키지 설치 완료!

echo.
echo [4/4] 키움 Open API 확인 중...
reg query "HKLM\SOFTWARE\WOW6432Node\Kiwoom\OpenAPI" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  키움 Open API가 설치되지 않았습니다.
    echo.
    echo 👉 설치 방법:
    echo    1. https://www1.kiwoom.com 접속
    echo    2. 트레이딩 → Open API+ → 다운로드
    echo    3. OpenAPI+ 모듈 설치
    echo.
) else (
    echo ✅ 키움 Open API 발견!
)

echo.
echo ========================================
echo   설치 완료!
echo ========================================
echo.
echo 실행 방법: run.bat 더블클릭
echo.
pause



