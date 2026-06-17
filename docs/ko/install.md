# 설치 가이드

PocketRisu Alter는 불안정한 nightly 버전입니다. 실행 전 `save/` 데이터나 Docker 볼륨을 백업하세요.

지원 실행 방식은 두 가지뿐입니다.

- [1. Docker](#1-docker)
- [2. 소스 기반 서버 실행](#2-소스-기반-서버-실행)

그 외 실행 방식과 설치 스크립트는 지원하지 않습니다.

## 시스템 요구사항

| 항목 | 최소 | 권장 |
| --- | --- | --- |
| CPU | 1코어 | 2코어 이상 |
| RAM | 1GB | 4GB 이상 |
| 디스크 | 1GB | 2GB 이상 |
| Node.js | 22.12 이상 | 소스 기반 서버 실행 시 필요 |

Docker 실행에는 Docker 또는 Docker Desktop이 필요합니다. 소스 기반 서버 실행에는 Node.js 22.12 이상과 pnpm이 필요합니다.

## 1. Docker

Docker / Docker Desktop이 설치된 환경에서 동작합니다.

### 실행

```bash
git clone https://github.com/PocketRisu-Alter/PocketRisu-Alter.git
cd PocketRisu-Alter
docker compose up -d
```

기본 `docker-compose.yml` 기준 브라우저에서 `http://localhost:7860`으로 접속합니다. `6001` 포트도 함께 쓰려면 `docker-compose.yml`의 주석 처리된 포트 매핑을 활성화하세요.

### 업데이트

```bash
cd PocketRisu-Alter
git pull
docker compose up -d --build
```

### 데이터 위치

채팅·캐릭터 등 데이터는 Docker 볼륨 `pocketrisu_alter_save`에 저장됩니다. 컨테이너를 다시 빌드해도 볼륨을 지우지 않으면 데이터는 유지됩니다.

이 볼륨은 PocketRisu의 Docker 저장소와 별도입니다. 기존 PocketRisu 데이터와 섞이지 않도록 분리된 이름을 사용합니다. 같은 저장소를 공유하고 싶다면 `docker-compose.yml`의 `volumes` 설정을 직접 수정하세요.

## 2. 소스 기반 서버 실행

소스 코드를 직접 받아 빌드한 뒤 Node 서버를 실행합니다. 코드 수정·디버깅 또는 직접 운영이 필요한 경우 사용합니다.

```bash
git clone https://github.com/PocketRisu-Alter/PocketRisu-Alter.git
cd PocketRisu-Alter
pnpm install
pnpm build
pnpm runserver
```

브라우저에서 `http://localhost:6001`로 접속합니다.

### 업데이트

```bash
cd PocketRisu-Alter
git pull
pnpm install
pnpm build
pnpm runserver
```

이미 서버가 실행 중이면 중지한 뒤 다시 시작하세요.

---

← [README로 돌아가기](../../README.md)
