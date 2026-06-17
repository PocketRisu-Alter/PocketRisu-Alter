<p align="center">
  <img src="assets/pocketrisu-banner-1024.png" alt="PocketRisu Alter — 셀프호스팅 AI 롤플레이 채팅" width="900" />
</p>

<h1 align="center">PocketRisu Alter</h1>

<p align="center">
  <strong>한국어</strong> | <a href="i18n/README.en.md">English</a>
</p>

<p align="center">
  <a href="LICENSE">
    <img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-blue" />
  </a>
  <a href="https://nodejs.org/">
    <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A522.12-brightgreen" />
  </a>
</p>

PocketRisu Alter는 [PocketRisu](https://github.com/PocketRisu/PocketRisu)를 기반으로 개조한 셀프호스팅 AI 롤플레이 채팅 플랫폼입니다. PC나 개인 서버에 실행해두고, PC·태블릿·스마트폰에서 브라우저로 접속해 사용합니다.

개조 기준은 2026년 6월 8일 PocketRisu v1.7.3 커밋(`9eeccfd2`)입니다. 그 뒤 Alter 쪽에서 실험 기능과 UI 변경을 더한 nightly 빌드입니다.

> **주의:** 이 저장소는 불안정한 nightly 버전입니다. 기능이 바뀌거나 깨질 수 있으며, 안정성이 필요한 환경에서는 사용 전 백업을 권장합니다.

<p align="center">
  <table>
    <tr>
      <td align="center"><img src="assets/screenshots/screenshot-pc-chat.png" alt="PC 채팅" height="420" /></td>
      <td align="center"><img src="assets/screenshots/screenshot-mobile-chat.png" alt="모바일 채팅" height="420" /></td>
    </tr>
    <tr>
      <td align="center"><b>PC</b></td>
      <td align="center"><b>모바일</b></td>
    </tr>
  </table>
</p>

## 지원 실행 방식

PocketRisu Alter는 Docker 실행과 소스 기반 서버 실행만 지원합니다.

- [설치 가이드](docs/ko/install.md)
- [RisuAI 데이터 이전 가이드](docs/ko/migration.md)
- [원격 접속 가이드](docs/ko/remote.md)

그 외 실행 방식은 지원하지 않습니다.

Docker로 실행하면 기본적으로 PocketRisu와 별도 저장소를 사용합니다. `docker-compose.yml`의 볼륨 이름은 `pocketrisu_alter_save`라 기존 PocketRisu/PocketRisu NodeOnly 데이터와 섞이지 않습니다. 같은 저장소를 공유하고 싶다면 `docker-compose.yml`의 `volumes` 설정을 직접 수정해야 합니다.

## PocketRisu와 주요 차이

- **텍스트 스트리밍 안정화**: 모델 프리셋 스트리밍 출력 갱신을 조정해 모바일 렌더링 지연과 끊김을 줄였습니다.
- **서버 측 API 호출**: 지원되는 OpenAI 호환 요청은 서버 작업으로 실행됩니다. 생성 중 화면을 끄거나 브라우저 연결이 끊겨도 서버에서 계속 처리할 수 있습니다.
- **테마와 색상 변경**: Alter 전용 디자인 토큰, 색상 체계, 채팅 말풍선/설정 화면 스타일을 추가했습니다.
- **모델 프리셋 보강**: 백엔드 실행 지원 표시, 이미지/시스템·역할 능력 토글, 일부 프리셋 호환 처리를 보강했습니다.
- **UI 조정**: 사이드바, 채팅 목록, 모델 프로필 브라우저, 모바일 헤더 등 일부 화면 레이아웃과 상호작용을 다듬었습니다.
- **MARP 멀티에이전트 RP**: 백엔드 통합 다중 에이전트 롤플레이 파이프라인 — 여러 AI 에이전트가 병렬로 동작해 더 풍부한 캐릭터 상호작용을 제공합니다. [MARP](https://github.com/Sallos725/MARP) by Sallos 포팅.

## 주요 기능

기본 기능은 PocketRisu를 따릅니다. 지원 AI, 캐릭터/채팅, 로어북, 프리셋, 플러그인, 백업/복원 등 일반 기능은 [PocketRisu](https://github.com/PocketRisu/PocketRisu)를 참고하세요.

## RisuAI 호환

PocketRisu Alter는 RisuAI/PocketRisu 계열 데이터를 가져올 수 있습니다.

- RisuRealm 캐릭터 다운로드
- 캐릭터 카드 (`.charx`, `.risum`, `.risup` 등)
- 모듈, 로어북, 프리셋
- 백업 파일 (`.bin`)

기존 RisuAI에서 이전하는 방법은 [데이터 이전 가이드](docs/ko/migration.md)를 참고하세요.

## 라이선스

[GPL-3.0](LICENSE)
