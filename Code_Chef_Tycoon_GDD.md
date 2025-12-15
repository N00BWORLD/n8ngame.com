코드 쉐프 타이쿤 (Code Chef Tycoon) - 게임 디자인 문서 (GDD)

1. 개요 (Executive Summary)

타이틀: Code Chef Tycoon (가제)

장르: 하이브리드 캐주얼 오토메이션 (Hybrid Casual Automation)

플랫폼: Web (Mobile Browser First, PC Responsive)

핵심 컨셉: "요리로 배우는 코딩 논리". n8n 스타일의 노드 기반 자동화 설계를 식당 경영 시뮬레이션으로 시각화.

타겟 유저: 최적화와 효율성을 즐기는 게이머(Factorio 유저) + 성장을 즐기는 캐주얼 게이머(Eatventure 유저).

2. 핵심 게임 루프 (Core Gameplay Loop)

2.1 4단계 순환 구조

설계 (Design): 하단 블루프린트 영역에서 노드(조리기구)를 배치하고 와이어(로직)를 연결.

시뮬레이션 (Simulate): 상단 뷰에서 쉐프와 기계가 설계된 로직을 수행. 물리적 이동 및 조리 과정 시각화.

수익화 (Monetize): 완성된 요리를 서빙하여 코인 획득. 병목 현상 발생 시 수익 감소.

확장 (Expand): 코인으로 고성능 노드 구매, 맵 확장, 자동화 로직 고도화.

3. 노드 시스템 명세 (Node Mechanics)

3.1 트리거 (Source)

주문 생성기 (Order Trigger):

Output: 주문 신호 (Signal)

Level Up: 주문 생성 주기 단축 ($Time = BaseTime \times 0.9^{Level}$)

재료 공급기 (Ingredient Spawner):

Input: 주문 신호

Output: 원재료 (Raw Item)

Logic: 신호를 받으면 지정된 재료(고기, 빵 등)를 생성.

3.2 액션 (Processor)

가공 노드 (Grill, Chop, Fry):

Input: 재료

Output: 가공된 재료

Parameters: 작업 시간(Duration), 성공 확률(Success Rate).

조립기 (Assembler):

Input: 재료 A, 재료 B

Output: 결합된 아이템

Logic: 두 입력 포트에 재료가 모두 도착할 때까지 대기(Wait) 후 병합.

3.3 로직 (Control Flow) - 차별화 포인트

검사기 (Inspector / If-Else):

Logic: 재료의 상태(품질)를 검사.

Route: 조건 충족 시 Port A, 미충족 시 Port B로 배출.

예시: 패티가 탔는가? (True -> 쓰레기통, False -> 서빙)

밸런서 (Round Robin Switch):

Logic: 들어오는 재료를 연결된 출력 포트들에 순차적으로 분배. 병렬 처리를 위해 필수.

3.4 싱크 (Destination)

서빙 카운터 (Serving Point): 최종 생산품을 소비하고 코인으로 변환.

쓰레기통 (Trash Bin): 실패한 요리 폐기. 환경 부담금(코인 차감) 발생.

4. 기술적 아키텍처 (Technical Architecture)

4.1 브릿지 패턴 (The Bridge)

Data Store (Zustand): 노드 그래프(nodes, edges)와 게임 상태(money, level)를 관리하는 단일 진실 공급원(Single Source of Truth).

UI Layer (React Flow): 하단 에디터. 유저 상호작용을 통해 Store의 그래프 데이터를 수정.

Simulation Layer (Canvas/Phaser): 상단 뷰. Store를 구독(Subscribe)하여 그래프 데이터를 해석하고, 독자적인 게임 루프(60FPS)를 돌며 시각적 엔티티를 렌더링.

4.2 데이터 스키마 예시

{
  "nodes": [
    { "id": "grill_1", "type": "processor", "data": { "processTime": 2000 } }
  ],
  "edges": [
    { "source": "spawner_1", "target": "grill_1" }
  ],
  "entities": [
    { "id": "burger_12", "currentPosition": { "x": 100, "y": 200 }, "state": "cooking" }
  ]
}
