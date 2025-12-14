
import type { I18nKey } from "./keys";

export const ko: Record<I18nKey, string> = {
    "ui.theme.dark": "다크",
    "ui.theme.light": "라이트",
    "ui.lang.en": "EN",
    "ui.lang.ko": "KO",
    "ui.controls.aria.theme": "테마 전환",
    "ui.controls.aria.language": "언어 선택",

    "btn.run": "실행",
    "btn.runViaN8n": "n8n으로 실행",
    "btn.save": "저장",
    "btn.load": "불러오기",
    "btn.inventory": "인벤토리",
    "btn.missions": "미션",
    "btn.help": "도움말",
    "btn.close": "닫기",
    "btn.reset": "초기화",
    "btn.settings": "설정",

    "title.inventory": "인벤토리",
    "title.missions": "미션",
    "title.terminal": "터미널",
    "title.help": "사용설명서",

    "mission.status.locked": "잠김",
    "mission.status.active": "진행 가능",
    "mission.status.completed": "완료",

    "terminal.reward": "보상",
    "terminal.mission": "미션",
    "terminal.error": "오류",
    "terminal.info": "안내",

    "help.heading.what": "이 게임은 무엇인가요?",
    "help.body.what":
        "n8ngame은 n8n(자동화 도구)의 기본 개념을 게임처럼 배우는 웹게임입니다. 노드를 연결해 자동화를 만들고, 실행 결과에 따라 보상을 얻습니다.",

    "help.heading.quickstart": "1분 시작하기",
    "help.qs.1": "왼쪽에서 노드를 추가하세요(드래그/클릭).",
    "help.qs.2": "노드의 포트를 연결해 데이터 흐름을 만드세요.",
    "help.qs.3": "‘n8n으로 실행’을 눌러 실행하세요.",
    "help.qs.4": "아래 터미널에서 로그/보상을 확인하세요.",

    "help.heading.buttons": "버튼 설명",
    "help.buttons.run": "실행: 게임 내 시뮬레이터로 빠르게 테스트합니다.",
    "help.buttons.runViaN8n": "n8n으로 실행: 실제 n8n 워크플로우(웹훅)를 호출해 결과를 받습니다.",
    "help.buttons.saveLoad": "저장/불러오기: 현재 블루프린트를 저장하고 복원합니다.",
    "help.buttons.inventory": "인벤토리: 획득한 아이템을 확인합니다.",
    "help.buttons.missions": "미션: 튜토리얼 목표를 따라가며 보상을 받습니다.",

    "help.heading.rewards": "보상과 성장",
    "help.body.rewards":
        "실행 성공, 연결 구조, 변수 사용 등 조건을 만족하면 아이템이 지급됩니다. 인벤토리에서 누적된 보상을 확인할 수 있습니다.",

    "help.heading.troubleshooting": "자주 하는 실수(3가지)",
    "help.trouble.1": "노드가 연결되지 않았어요: 엣지가 1개 이상 연결되어 있는지 확인하세요.",
    "help.trouble.2": "실행이 실패해요: 터미널의 [오류] 로그를 먼저 확인하세요.",
    "help.trouble.3": "보상이 안 나와요: ok=true 실행이어야 하며, 이미 완료한 미션은 중복 보상이 안 나옵니다.",

    "help.heading.glossary": "용어 짧게",
    "help.glossary.blueprint": "Blueprint: 내가 만든 노드 그래프(설계도).",
    "help.glossary.node": "Node: 기능 단위(트리거/액션/변수 등).",
    "help.glossary.edge": "Edge: 노드와 노드를 잇는 연결선.",
    "help.glossary.webhook": "Webhook: 외부에서 호출해 실행시키는 URL.",
    "help.glossary.gasToken": "Gas/Token: 실행에 드는 가상 자원(무한 실행 방지).",

    "ui.status.ready": "준비됨",
    "ui.status.running": "실행 중...",
    "ui.status.completed": "실행 완료",
    "ui.status.empty": "데이터 없음",
    "ui.status.loading": "로딩 중...",
};
