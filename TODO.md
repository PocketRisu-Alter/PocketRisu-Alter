# RP REST API 레이어

## 목적
PocketRisu-Alter 서버에 `/api/v1` REST API 추가. Telegram bot 등 외부 클라이언트에서 캐릭터 RP 사용.

## 선행 조건
- `dev` 브랜치
- localhost 인증 스킵, 외부 기존 JWT
- 응답 JSON
- 기존 서버 내부 모듈 재사용 (db.cjs, chatJob.cjs, utils.cjs)
- 기존 프론트엔드 동작에 영향 없음

## 엔드포인트
- [ ] `GET  /api/v1/characters` 캐릭터 목록
- [ ] `GET  /api/v1/characters/:chaId` 캐릭터 상세
- [ ] `GET  /api/v1/characters/:chaId/chats` 대화 목록 (stub)
- [ ] `POST /api/v1/characters/:chaId/chats` 새 대화 생성
- [ ] `GET  /api/v1/characters/:chaId/chats/:chatId` 대화 전체 메시지
- [ ] `POST /api/v1/characters/:chaId/chats/:chatId/send` 메시지 전송 + AI 생성 (SSE)

## 구현 순서
- [ ] `server/node/apiV1.cjs` 생성 — Express Router
- [ ] `GET /api/v1/characters` — kvGet → decodeRisuSave → characters[] → JSON
- [ ] `GET /api/v1/characters/:chaId` — chaId 매칭 → 상세 반환
- [ ] `GET /api/v1/characters/:chaId/chats` — chats[] stub 반환
- [ ] `POST /api/v1/characters/:chaId/chats` — firstMessage로 빈 채팅 생성, fullChatStore 저장, database.bin 업데이트
- [ ] `GET /api/v1/characters/:chaId/chats/:chatId` — fullChatStore/disk에서 전체 Chat → JSON
- [ ] `POST /api/v1/characters/:chaId/chats/:chatId/send` — 유저 메시지 추가 + AI 요청 + SSE
- [ ] server.cjs에 라우터 마운트
- [ ] localhost 인증 스킵 미들웨어

## 핵심 난관
`/send` AI 요청 빌드: 프론트엔드 sendChat()이 1400줄 프롬프트 엔지니어링 수행.
초기 방안: 서버는 유저 메시지만 저장 + 캐릭터 systemPrompt 기반 간단한 messages 구성. 고도화는 나중에.

## 파일 구조
- `server/node/apiV1.cjs` (새 파일)
- `server/node/server.cjs` (수정 — 라우터 마운트)

---

## 결정: 프롬프트 빌드 전략 (왜 "추후 구현"인가)
`/send`의 프롬프트(messages) 빌드는 **기존 프론트 발송로직을 재사용하지 않고 서버에서 새로 구현**한다. 선택이 아니라 구조적 제약:

- `sendChat()`(`src/ts/process/index.svelte.ts`, ~1937줄)은 **프론트 전용**. `DBState.db`(브라우저 Svelte 반응성 상태)·Svelte 스토어·`lorebook.svelte`·토크나이저·UI 사이드이펙트에 결합 → Node 서버에서 import/호출 불가.
- 현재 서버는 프롬프트를 만들지 않는다. 프론트가 `sendChat → requestChatData`로 **완성된 descriptor**(`{url, headers, body:{messages}}`)를 만들어 `/api/chat-job/start`로 넘기고, `chatJob.cjs::executeProvider`는 그것을 그대로 `fetch` POST만 한다.
- REST는 호출해줄 브라우저가 없으므로 **descriptor를 서버에서 직접 구성**해야 한다.

**재사용 경계:**
- ✅ 재사용 — 실행계층: `executeProvider` / SSE 스트림 / 결과 persist (`chatJob.cjs`)
- ❌ 재사용 불가 — 프롬프트 빌드: 로어북·메모리·프롬프트템플릿·페르소나·정규식·CoT (전부 프론트 `sendChat`)
- ⚠️ 추가 필요 — 프로바이더/키 해석: url·headers도 프론트 모델프리셋 어댑터에 있음 → 서버에서 최소 엔드포인트+키 결정 로직 필요

**단계:** 초기 = `systemPrompt + 최근 history + user`만으로 messages 구성(OpenAI 호환 가정). 고도화(풀 피델리티)는 후속 — 서버 일부 재구현 또는 프롬프트 빌더를 브라우저/Node 공용 모듈로 분리하는 별도 리팩터로 분리.

## 유의사항 — 모듈화 (fork 패치셋 정합성)
이 레포는 upstream 위에 12개 모듈 패치셋(`patch` 브랜치)으로 fork 변경을 얹는 구조. 새 기능도 그 위에 깔끔히 재적용되도록:

- [ ] **새 파일에 몰기.** 로직은 전부 `apiV1.cjs`(+ 필요시 `apiV1.*.cjs`)에. upstream 기존 파일 수정은 최소화.
- [ ] **`server.cjs` 변경은 라우터 마운트 한 곳만.** upstream이 `server.cjs`를 건드려도 충돌면이 1줄이라 재적용 쉬움. (가능하면 `app.use('/api/v1', require('./apiV1.cjs'))` 한 줄)
- [ ] **프론트엔드 코드는 건드리지 않는다.** 선행조건의 "기존 프론트 동작 영향 없음"을 지키려면 변경을 `server/node/`에 가둘 것.
- [ ] **새 패치 모듈로 분리.** 후보: `13-rp-rest-api.patch` 신설(권장) 또는 기존 `01-backend-jobs.patch` 확장. main 머지 후 `patch` 재생성 시 이 파일들이 한 모듈로 떨어지게 파일 경계를 의식.

## 유의사항 — DB 동시성/일관성
- [ ] **직접 write 주의.** REST가 `database.bin`/kv를 직접 수정하면, 활성 브라우저 세션의 in-memory `DBState` 저장이 그 변경을 덮어쓸 수 있음(기존 backendJob 결과 복구가 같은 위험을 다룸). 가능하면 기존 저장 경로/ETag 체계를 재사용하고, 충돌 시 동작을 정의.
- [ ] **chat 저장은 기존 경로 재사용.** `fullChatStore`/disk 저장과 `database.bin` 갱신 로직을 그대로 타고, 새 직렬화 경로를 만들지 말 것.
- [ ] **decodeRisuSave 캐싱.** 매 요청마다 전체 save 디코드는 비쌈 — 캐시 + 무효화 전략 둘 것.

## 유의사항 — 인증 / 외부 계약
- [ ] **인증 일관성.** localhost 스킵 + 외부 JWT는 기존 `risu-auth`/`createAuth` 체계와 어긋나지 않게. 토큰 검증은 별도 미들웨어로 분리해 라우터에만 적용.
- [ ] **`/v1`은 외부 계약.** Telegram 봇 등이 의존하므로 응답 스키마를 안정적으로 유지(버전드). 깨는 변경은 `/v2`로.
- [ ] **SSE 포맷 통일.** `/send` 스트림을 기존 chat-job 스트림(`data: {type:'chunk'|'status'|...}`)과 맞추면 클라이언트/파서 재사용 가능.
