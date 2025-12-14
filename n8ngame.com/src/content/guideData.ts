
export const GUIDE_DATA = [
    {
        title: "이 게임이 뭔가요?",
        content: [
            "n8n 워크플로우 자동화를 게임으로 배우는 시뮬레이션입니다.",
            "노드(Node)와 엣지(Edge)를 연결하여 로직을 만들고, 실제 n8n 엔진에서 실행해 보상을 획득하세요."
        ]
    },
    {
        title: "1분 시작하기",
        content: [
            "1. 'Right Click'으로 메뉴를 열고 노드(Trigger 등)를 추가하세요.",
            "2. 노드의 핸들(점)을 드래그하여 다른 노드와 연결(Edge)하세요.",
            "3. 상단 툴바의 'Run via n8n' 버튼을 클릭하세요.",
            "4. 하단 터미널에서 실행 로그와 획득한 보상을 확인하세요."
        ]
    },
    {
        title: "버튼 설명",
        content: [
            "▶ Run: 클라이언트(브라우저)에서 시뮬레이션만 실행",
            "⚡ Run via n8n: 서버의 실제 n8n 엔진을 통해 실행 (보상 획득 가능)",
            "💾 Save/Load: 현재 블루프린트를 저장하거나 불러오기",
            "📦 Inventory: 획득한 아이템(Node Fragment 등) 확인",
            "🏆 Missions: 튜토리얼 및 도전 과제 목록",
            "❓ Help: 현재 보고 계신 도움말 창"
        ]
    },
    {
        title: "보상 및 인벤토리",
        content: [
            "실행 성공 시 구조에 따라 Node Fragment, Logic Circuit 등을 얻습니다.",
            "모은 아이템은 추후 더 강력한 노드를 제작(Crafting)하는 데 사용됩니다(예정).",
            "인벤토리(📦) 버튼을 눌러 수량을 확인할 수 있습니다."
        ]
    },
    {
        title: "자주 하는 실수 (Troubleshooting)",
        content: [
            "❌ 연결 안 됨: 노드끼리 선이 끊겨 있으면 데이터가 흐르지 않습니다.",
            "❌ 토큰 없음: (추후 적용) 실행에는 Gas가 필요할 수 있습니다.",
            "❌ 에러 로그: 터미널의 빨간색 메시지를 읽어보세요. n8n 실행 실패 원인이 나옵니다."
        ]
    },
    {
        title: "용어 설명",
        content: [
            "Blueprint: 당신이 설계한 노드 그래프 전체",
            "Node: Trigger, Action, Variable 등 기능 단위",
            "Edge: 노드 간의 연결선 (데이터 흐름)",
            "Webhook: 외부에서 신호를 받아 실행을 시작하는 지점"
        ]
    }
];
