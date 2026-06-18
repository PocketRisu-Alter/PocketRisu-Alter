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
