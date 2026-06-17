# 리서치: LLM 업체 UI 분석 + 2026 트렌드

2026-06 조사. AlterRisu 디자인 시스템(`SYSTEM.md`, `tokens.css`)의 근거 자료.

## 1. 대형 LLM 업체별 챗 UI 분석

### Anthropic Claude — "에디토리얼 미니멀"

- **팔레트**: 부드러운 라벤더 배경(라이트 `#f4f0fb`, 다크 `#14111d`), 바이올렛 액센트(`#7c3aed`).
  채도 낮은 바이올렛 톤으로 "지적인 차분함"을 연출 — 업계의 네온·그라데이션 클리셰를 의도적으로 거부.
- **타이포**: 본문까지 세리프를 적극 사용하는 에디토리얼 스타일. 잡지/출판물 같은 인상.
- **메시지 렌더링**: 그림자·아바타 없음, 최소한의 크롬. AI 응답은 말풍선 없이 페이지에
  녹아드는 플랫 텍스트, 사용자 메시지만 얇은 보더의 옅은 블록.
- **시사점**: 장문 위주 제품에서 "읽기 좋은 문서" 메타포가 말풍선 채팅 메타포를 이긴다.

### OpenAI ChatGPT — "컴포저 중심 단순화"

- 2025년 GPT-5 직전 대규모 단순화: 도구 버튼들을 "+" 하나로 통합, **입력창(컴포저)이
  화면의 주인공**인 필(pill) 형태. 모델 피커는 상단에 작게.
- 무채색 그레이스케일 팔레트, AI 응답은 풀폭 플랫 텍스트, 사용자 메시지는 우측 정렬의
  옅은 말풍선 — 현재 챗 UI의 사실상 표준 패턴.
- **시사점**: 기능이 늘어도 1차 화면에는 "입력창 + 대화"만. 부가 기능은 컴포저 안의
  단일 진입점(＋ 메뉴)이나 설정으로 숨긴다.

### Google Gemini — "Material 3 Expressive"

- 블루-퍼플 그라데이션 액센트, 큰 라운드의 카드·칩, 구글 생태계(Docs/Gmail) 임베드 중심.
- 단독 챗 경험보다 "어디에나 끼어드는 보조" 포지션. 풍부한 모션과 명확한 상태 표시.
- **시사점**: 상태(생성 중/완료/오류)를 색+모양+텍스트 3중으로 표현하는 머티리얼 관행은
  접근성 측면에서 따라할 가치가 있다.

### 캐릭터 챗 도메인 (SillyTavern, Character.AI 계열)

- SillyTavern: 기능 밀도 극대화형 — 강력하지만 진입장벽과 시각적 노이즈가 큼.
- Character.AI: 모바일 우선, 아바타가 큰 전통적 말풍선 채팅. 캐주얼하지만 장문 독서에 약함.
- **AlterRisu의 틈새**: SillyTavern의 기능(카드 호환·메모리)을 Claude급의 조용한
  독서 UI에 담는 것. 아바타는 작게 유지하되 캐릭터의 정체성(이름·아바타)은
  헤더에서 명확히.

## 2. 2026 UI 트렌드 중 채택할 것

| 트렌드 | 채택 | 적용 |
|---|---|---|
| **다크 퍼스트 워크플로** (다크를 먼저 설계, 라이트를 파생) | ✅ | tokens.css가 다크 기본, `[data-theme=light]` 파생 |
| 순수 검정 대신 **깊은 웜 다크 + 절제된 액센트** | ✅ | 웜 차콜 배경 + 앰버 계열 액센트 |
| 다크모드에서 **본문 굵기 +50, 자간·행간 여유** | ✅ | body 400→425(가변폰트) 또는 행간 1.65 |
| **타이포그래피가 주인공** (디스플레이 세리프, 가변 폰트) | ✅ | 캐릭터명·헤더에 세리프, 본문은 산세리프 유지 |
| 말풍선 → **플랫 문서형 메시지** (AI 응답) | ✅ | char 메시지 풀폭 플랫, user만 옅은 블록 |
| 글래스모피즘·네온 글로우·과도한 그라데이션 | ❌ | 독서 방해. 웜톤 미니멀로 차별화 |
| 키네틱 타이포·히어로 애니메이션 | ❌ | 도구형 앱에 부적합. 모션은 마이크로 인터랙션만 |

## 3. 챗 UI 베스트 프랙티스 (기능적)

- **스트리밍**: 토큰마다 전체 리플로우 금지(레이아웃 스래시), 정지/재시도 컨트롤 상시 노출,
  스크린리더용 `aria-live` 영역.
- **접근성**: 본문 대비 4.5:1 이상(다크에서도), 터치 타깃 44×44px, 상태 표시는
  색+모양+텍스트 3중, 전체 키보드 내비게이션.
- **백그라운드 생성 가시화** (AlterRisu 고유): "창을 닫아도 계속됩니다"가 제품의 핵심
  약속이므로, 생성 중 상태는 어디서 돌아와도 즉시 보이는 1급 UI 요소여야 한다.

## 출처

- [Design System Analysis: Claude (getdesign.md)](https://getdesign.md/claude/design-md)
- [The quiet genius of Claude's branding (Medium/Bootcamp)](https://medium.com/design-bootcamp/the-quiet-genius-of-claudes-branding-less-hype-more-humanity-f4f5567051cc)
- [ChatGPT App Makeover Ahead of GPT-5 (BGR)](https://www.bgr.com/1933698/chatgpt-app-redesign-ahead-of-gpt-5-release/)
- [UI Design Trends for 2026 (Midrocket)](https://midrocket.com/en/guides/ui-design-trends-2026/)
- [Dark Mode Design Best Practices in 2026 (tech-rz)](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)
- [Top Web Design Trends for 2026 (Figma)](https://www.figma.com/resource-library/web-design-trends/)
- [AI Chat UI Best Practices (thefrontkit)](https://thefrontkit.com/blogs/ai-chat-ui-best-practices)
- [Chat UI Design 2026 (UXPin)](https://www.uxpin.com/studio/blog/chat-user-interface-design/)
- [SillyTavern vs Character.AI (sider.ai)](https://sider.ai/blog/ai-tools/sillytavern-vs-character_ai-which-ai-chat-platform-fits-your-style-in-2025)
- [Claude vs ChatGPT vs Copilot vs Gemini 2026 (IntuitionLabs)](https://intuitionlabs.ai/articles/claude-vs-chatgpt-vs-copilot-vs-gemini-enterprise-comparison)
