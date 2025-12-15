Code Chef Tycoon - AI 개발 프롬프트 가이드

이 문서는 Cursor, VS Code AI, 또는 LLM에게 프로젝트를 설명하고 코딩을 시작하게 하기 위한 프롬프트 모음입니다.

1. 프로젝트 착수 (Initial Context Setup)

가장 먼저 AI에게 프로젝트의 정체성과 목표를 학습시키는 프롬프트입니다. Cursor의 채팅창에 입력하세요.

프롬프트:

"지금부터 너는 '수석 웹 게임 개발자(Senior Web Game Developer)'야. 우리는 **'Code Chef Tycoon'**이라는 하이브리드 캐주얼 오토메이션 게임을 만들 거야.

내가 제공한 두 개의 문서 @Code_Chef_Tycoon_GDD.md (기획서)와 @Development_Roadmap.md (로드맵)을 꼼꼼히 읽고 분석해줘.

핵심 요구사항:

장르: n8n 스타일의 노드 에디터 + Eatventure 스타일의 요리 시뮬레이션.

기술 스택: React (Vite), Tailwind CSS, HTML5 Canvas (혹은 Phaser).

아키텍처: GDD에 명시된 **'브릿지 패턴(Bridge Pattern)'**을 반드시 준수해야 해. (React가 상태를 관리하고, Canvas는 렌더링만 담당).

내용을 모두 이해했다면, 이 프로젝트의 핵심 기술적 챌린지가 무엇인지 요약해서 답변해줘."

2. Phase 1 개발 시작 (Phase 1 Implementation)

AI가 기획서를 이해했다면, 로드맵의 첫 단계인 프로토타입 개발을 지시합니다.

프롬프트:

"좋아, 분석이 정확해. 이제 @Development_Roadmap.md의 [Phase 1: 프로토타입] 개발을 시작하자.

우리는 지금 '최소 기능 제품(MVP)'을 만드는 게 목표야. 디자인은 투박해도 좋으니 기능 구현에 집중해줘.

구현 목표:

화면을 상하로 분할해줘 (상단: 시뮬레이션 / 하단: 노드 에디터).

하단 에디터에서 사각형 노드 2개(Start, End)를 생성하고 선으로 연결할 수 있게 해줘.

선이 연결되면 상단 캔버스에서 '점(Dot)'이 Start에서 End로 이동하는 애니메이션을 보여줘.

React State가 변경되면 Canvas가 즉시 반응해야 해.

위 기능을 구현하기 위한 파일 구조를 먼저 제안해주고, 승인하면 코드를 작성해줘."

3. 기능 구체화 및 수정 (Refining Features)

코드가 생성된 후, 디테일을 잡을 때 사용하는 프롬프트 예시입니다.

노드 로직 추가 시:
"현재는 점이 그냥 이동만 하는데, @Code_Chef_Tycoon_GDD.md의 **'3. 노드 시스템 명세'**를 참고해서 'Grill Node(가공 노드)'를 추가해줘. 이 노드를 지나갈 때는 점이 2초간 멈췄다가 색깔이 바뀌어서 나가야 해."

오류 발생 시 (디버깅):
"방금 짠 코드에서 노드를 연결했다가 끊으면 에러가 나. '브릿지 패턴' 관점에서 React State의 연결 정보(edges)가 삭제될 때 Canvas의 엔티티(entities) 처리가 제대로 안 된 것 같아. 이 부분을 확인하고 수정해줘."

4. 코드 스타일 가이드 (Style Guidelines)

AI가 엉뚱한 코드를 짜지 않도록 제약을 거는 프롬프트입니다. (Custom Instructions에 넣어도 좋습니다)

프롬프트:

"코드를 작성할 때 다음 규칙을 지켜줘:

컴포넌트: 모든 UI 컴포넌트는 재사용 가능하도록 분리하고, Tailwind CSS로 스타일링해.

상태 관리: 복잡한 전역 상태(노드 연결 정보 등)는 Context API나 Zustand를 사용해.

주석: 핵심 로직(특히 Canvas 렌더링 루프)에는 한국어로 상세한 주석을 달아줘.

타입: TypeScript Interface를 명확히 정의하고 any 타입 사용을 지양해."