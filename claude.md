# 사랑의교회 대학부 Admin 에이전트 지침

## 브랜치와 PR 규칙

- 항상 최신 `origin/dev`에서 브랜치를 만든다. `master`에서 분기하지 않는다.
- 여러 repo를 함께 수정하는 작업은 각 repo마다 최신 `origin/dev`에서 별도 브랜치를 만들고 PR도 따로 연다.
- 여러 repo가 엮인 작업은 각 PR 본문에 병합 순서나 의존 PR을 적는다.
- 브랜치를 만들기 전 실행한다:
  - `git fetch origin dev`
  - `git switch -c <branch-name> origin/dev`
- 병합 전이나 ready 상태로 바꾸기 전, 브랜치 분기 이후 `dev`가 앞서가지 않았는지 확인한다:
  - `git fetch origin dev`
  - `git rev-list --count HEAD..origin/dev`
  - 결과는 반드시 `0`이어야 한다. `0`이 아니면 병합 전에 최신 `origin/dev`를 rebase하거나 merge한다.
- 필요한 경우 PR 본문이나 코멘트에 브랜치 최신성 확인 결과를 남긴다.

## 커밋 메시지 규칙

- 형식은 `<type>: <content>`를 사용한다.
- 허용되는 type은 `chore`, `docs`, `feat`, `fix`, `refactor`만이다.
- 콜론 뒤 content는 반드시 영어로 작성한다.
- 커밋 메시지는 짧고 구체적으로 쓴다.

## 엔지니어링 규칙

- 코드를 구현하거나 구현 방향을 논의할 때는 현재 best practice를 공식 문서나 신뢰 가능한 웹 자료로 크로스 체크한다.
- 일회성 코드, 이름만 바뀌는 얇은 wrapper, 사람이 로직을 읽는 흐름을 끊는 추상화는 피한다.
- 재사용 경계가 분명하지 않은 helper, mapper, predicate, local type alias, local interface는 추가하지 않는다.
- 라이브러리 계약이 이미 보장하는 내용을 중복 검증하지 않는다.
- route 문자열, role 이름, env var 이름, status enum 값, API path는 정확히 보존한다.
- 사용자의 변경을 덮어쓰거나 되돌리지 않는다. 수정 전과 staging 전에 `git status --short --branch`를 확인한다.
- secret은 출력하지 않는다. secret 값은 노출하지 않고 비교하거나 복사한다.

## Admin 앱 규칙

- 이 repo는 Next.js admin 앱이다. 기존 App Router, SWR, Zustand, ShadCN/Radix, TanStack Table 패턴을 우선 사용한다.
- 서버 상태는 SWR 또는 기존 API hook에 둔다. UI 상호작용에 꼭 필요한 경우가 아니면 fetch 결과를 local state로 중복 보관하지 않는다.
- mutation flow에서는 서버 권한과 검증을 최종 기준으로 둔다. 브라우저는 사용자를 안내할 수 있지만, API가 권한과 대상 상태를 다시 확인해야 한다.
- 새 UI primitive를 만들기 전에 기존 confirmation, toast, sidebar, table, badge 컴포넌트를 먼저 사용한다.
- table을 수정할 때는 안정적인 row identity, filtering, sorting, virtualization 동작을 보존한다.
- SMS, file download, data deletion 같은 외부 효과가 있는 동작은 명시적인 확인을 보여주고 성공/실패를 분명히 알린다.
- role 기반 navigation은 데이터 기반 동작으로 본다. sidebar 상수, DB navigation/role assignment, server role middleware를 함께 맞춘다.
- superuser 전용 전역 수양회 관리는 수양회별 role access와 별개다. superuser가 모든 수양회 페이지 role을 조용히 우회하도록 만들지 않는다.
- route access를 바꾸면 의도한 role과 최소 하나의 비인가 role을 함께 테스트한다.
- client action이 서버 enum이나 status에 의존하면 기존 shared enum label을 사용하고 실제 문자열 값을 그대로 유지한다.

## 검증 원칙

- 데이터가 바뀌거나 side effect가 발생하는 기능은 브라우저 확인만으로 끝내지 않는다.
- UI 변경은 프로젝트에서 정의한 local 실행 방법으로 실제 화면을 띄워 주요 interaction과 상태 변화를 확인한다.
- 데이터 mutation은 대상 row를 먼저 조회하고, 브라우저 action을 수행한 뒤, 같은 row를 다시 조회해서 저장 여부를 확인한다.
- download 기능을 바꾸면 실제 파일을 열어 주요 형식, header, formatting, row count를 확인한다.
- timezone 작업은 DB timestamp, API timestamp, browser display 값을 비교한다.
- QA 중 임시 console log가 필요했다면 commit 전에 제거한다.
- 권한이나 데이터 문제라고 결론 내리기 전에 admin log와 server log를 모두 확인한다.
- local HTTPS 문제가 있으면 TLS 검증을 우회하지 말고 프로젝트의 인증서 신뢰 설정을 확인한다.
- DB 확인이 필요할 때는 현재 연결 대상, database, schema가 의도한 환경인지 먼저 확인한다.
- DB 연결 상태가 의심되면 코드 변경으로 해결하려 하기 전에 연결 설정과 credential을 다시 확인한다.

## 한 번의 확인으로 증명하기 어려운 항목

- 외부 콘솔 설정, infra 설정, 실제 provider delivery, production DB state는 단일 local 화면 확인만으로 결론 내리지 않는다.
- 이런 항목은 DB query, server log, infra 설정, external console, 여러 session, deployment checklist 등 작업에 맞는 증거로 확인한다.

## 유용한 확인 명령

- `node_modules`가 오래되었으면 `yarn install --frozen-lockfile`로 dependency를 설치한다.
- TypeScript 확인은 `npm run typecheck`를 실행한다.
- production build output에 영향을 줄 수 있는 변경은 PR을 열거나 갱신하기 전에 `npm run build`를 실행한다.
- UI 동작 변경은 static code inspection만 하지 말고 사용 가능한 브라우저 검증 도구로 실제 local page를 확인한다.
