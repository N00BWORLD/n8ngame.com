# AGENT_CONTRACT (Must Follow)

## Hard Rules
- Stack fixed: Vite + React + TypeScript + Tailwind + Zustand + @xyflow/react + lucide-react
- TypeScript strict 유지, any 금지 (unknown은 좁혀서 사용)
- 한 단계에 목표는 1개만 수행
- 내가 지정한 파일만 생성/수정
- 완료조건 충족하면 반드시 멈추고, 다음 단계 기다리기 (추가 기능 금지)

## Output Rules
- 항상 아래 순서로 출력:
  1) 변경/생성 파일 리스트
  2) 각 파일의 전체 코드(복붙 가능)
  3) 실행/테스트 명령어
- 계획 단계에서는 코드 작성 금지 (파일 목록 + 계획 + 리스크만)
