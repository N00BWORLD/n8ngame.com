# n8ngame (n8n 기반 텍스트형 자동화 게임) - GDD / Agent Spec

## 0. 한 줄 요약
n8n을 어려워하는 사람도 **노드를 직접 연결**해보며 작동 방식을 자연스럽게 익히고,  
**더 최적화된 워크플로우**로 성장하는 재미를 느끼는 텍스트형 자동화 게임.

---

## 1. 목표 (Goals)
- 코딩이나 n8n이 어려운 유저도 “연결 → 실행 → 결과” 경험을 통해 간접 학습
- 워크플로우 최적화 자체를 게임의 재미(성장/효율)로 설계
- 추후 UM890 Pro(24/7)에서 Self-hosted로 운영, 동접 목표 200

## 2. 비목표 (Non-Goals / 지금은 안함)
- Firebase 같은 외부 관리형 백엔드에 의존한 운영 (셀프호스트 목표와 결이 다름)
- MVP 단계에서 멀티플레이 실시간 동기화
- 결제/상점/대규모 보안 하드닝
- Docker 배포 (UM890 도착 후 진행)

---

## 3. 핵심 루프 (Core Loop)
1) 유저가 노드를 배치/연결한다  
2) 실행(Start) 또는 명령을 입력한다  
3) Token이 흐르고(또는 정산되고) 텍스트 결과/상태가 갱신된다  
4) 점수/재화를 얻는다  
5) 노드 강화/새 노드 해금으로 더 효율적인 워크플로우를 만든다  
6) 더 어려운 미션/상황을 해결한다

> NOTE: 본 게임은 “매초 Tick을 계속 돌리는 방식”보다,  
> 유저 액션 시점에 **현실시간 경과분을 한 번에 정산(Lazy Simulation)** 하는 방향을 우선 채택한다.  
> (운영/성능/구현 난이도에서 유리)

---

## 4. 시스템 아키텍처 (MVP 기준)

### 4.1 구성(권장)
- Game UI: React 웹앱(n8ngame.com)
- Automation Engine: n8n (Webhook 트리거 기반)
- 데이터 저장: MVP는 In-memory + localStorage, 추후 Supabase(Postgres) self-host 예정

### 4.2 “n8n을 그대로 게임 UI로 쓰는” 방식에 대한 정책
- n8n 편집기 자체는 제작 도구 UI이므로, 일반 유저용 게임 UI로 직접 사용하지 않는다
- 대신 게임은 웹앱에서 제공하고, 고급자/학습자를 위해 n8n 작업실은 분리된 진입점으로 제공 가능
  - 예: studio.n8ngame.com / lab.n8ngame.com / workshop.n8ngame.com

---

## 5. Tick & Token System (MVP 스펙 고정)

### 5.1 Tick 개념 (MVP)
- MVP에서는 “실시간 Tick 루프” 대신, 아래의 지연 정산 방식을 기본으로 한다.
  - 유저 상태에 `lastSimulatedAt` 저장
  - 유저가 액션을 하거나 화면을 열 때:
    - `elapsed = now - lastSimulatedAt`을 계산
    - elapsed 동안 발생했어야 하는 Token/점수 변화를 한 번에 적용
    - `lastSimulatedAt = now`로 갱신

### 5.2 Token 규칙 (MVP)
- Token은 **정수(integer)** 기반
- 음수 Token은 허용하지 않음
- Token 계산 결과가 비정상(NaN 등)일 경우 0 처리 + 디버그 로그 기록

### 5.3 그래프 실행 의미론 (MVP)
- 사이클(루프) 연결은 MVP에서 금지 (연결 시 UI 경고 + 연결 차단)
- 실행 순서는 위상정렬(topological order) 기반
- 같은 정산/실행 단위에 여러 입력이 들어오면 합산(sum)
- 출력 반영은 “즉시”가 아니라 “정산 결과”로 한 번에 반영 (Lazy Simulation)

> NOTE: 향후 IF/Delay/쿨다운/캡 등 “중간 사건”이 생기면  
> 사건 시점 기준으로 구간을 쪼개 계산하는 이벤트 기반 정산으로 확장한다.

---

## 6. 노드 설계 (MVP)
### 6.1 필수 노드 3종
- GeneratorNode: 시간당/초당 생산량 기반으로 Token 생성 (config: rate)
- TransformNode: 입력 Token을 변환 (config: multiply, add)
- SinkNode: Token 소비 → score 증가

### 6.2 노드 강화(파밍/강화는 추후 확장 가능)
- MVP에서는 “강화 = 노드 파라미터 상승”으로 단순화
  - 예: Generator rate 증가, Transform 배율 증가, Sink 효율 증가
- 인벤토리/파밍 UI는 MVP에서는 최소화하고, 데이터 모델만 확장 가능하게 설계

---

## 7. 튜토리얼/학습 UX (MVP)
- 목표: “게임하면서 n8n 개념을 체감”
- MVP 튜토리얼 미션(예시)
  1) Generator → Sink 연결해서 점수 얻기 (흐름 이해)
  2) Transform 추가해서 효율 올리기 (변환 이해)
  3) 특정 목표치 달성하도록 rate/배율 튜닝하기 (최적화 이해)
- 디버그/가시화
  - 현재 Token, score, elapsed 시간, 마지막 정산 시간 표시
  - 어떤 노드가 얼마나 기여했는지 간단 로그 제공

---

## 8. 기술 스택 (현재 확정)
- Frontend: React (Vite), TypeScript, Tailwind CSS
- Graph: @xyflow/react (ReactFlow) - 필수
- State: Zustand
- Icons: lucide-react
- Backend(추후): Supabase(PostgreSQL) self-host on Docker

---

## 9. 개발 범위 정의 (MVP)
### Must (반드시)
- 그래프 편집기(노드 추가/연결/삭제/이동)
- Lazy Simulation 기반 Token/score 정산
- 튜토리얼 3단계
- 저장: localStorage (추후 DB로 교체 가능하게 분리)
- 타입 안정성: TS strict, any 금지

### Must NOT (지금은 금지)
- Supabase 연동
- 실시간 멀티플레이
- Docker 배포
- 과한 콘텐츠(수십 개 노드/아이템)

---

## 10. 완료조건 (Acceptance Criteria)
- 유저가 Generator → Transform → Sink 파이프라인을 만들 수 있다
- 실행/정산 시 점수/토큰이 기대대로 증가한다
- 저장/불러오기(localStorage)가 동작한다
- 튜토리얼 3단계가 끝까지 진행된다
- TS strict 유지, 런타임 에러 없이 동작한다

---

## 11. 추후 로드맵 (After MVP)
- UM890 Pro 도착 후: Docker 기반 Self-hosted 배포
- DB/계정/랭킹: Supabase(Postgres) 도입
- 동접 200 목표: 서버 권위 정산 + 동기화(WebSocket/SSE) + 작업 큐 확장
- “파밍/강화/인벤토리” 본격화
- n8n 대표 개념을 게임 노드로 확장(IF/Merge/Delay/RateLimit/Function 등)
