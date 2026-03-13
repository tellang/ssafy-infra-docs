# Infra Dashboard Guide (Junior FE/BE 대상)

- Actual Dashboard: `docs/infra-dashboard.html`
- Proposal Dashboard (Pre-install Simulation): `docs/infra-dashboard-proposal.html`
- Health Data: `docs/data/infra-health.json`
- Health Collector Script: `scripts/local/refresh-infra-dashboard-data.ps1`

## 빠른 시작

```powershell
pwsh -File scripts/local/refresh-infra-dashboard-data.ps1 -HostAlias ssafy-ec2 -MaxRetries 2 -InitialDelaySeconds 2 -MaxDelaySeconds 8 -AutoRefreshSeconds 60
```

## 로컬 자동 갱신 스케줄러 (Task Scheduler)

경로: `scripts/local/install-dashboard-refresh-schedule.ps1`

```powershell
# 설치 (기본 5분 주기, HostAlias 지정 가능)
pwsh -File scripts/local/install-dashboard-refresh-schedule.ps1 -Action install -HostAlias ssafy-ec2

# 상태 확인
pwsh -File scripts/local/install-dashboard-refresh-schedule.ps1 -Action status

# 제거
pwsh -File scripts/local/install-dashboard-refresh-schedule.ps1 -Action uninstall
```

<details>
<summary>Level 0 - 무엇이 보이나요? (요약)</summary>

- Health score
- Core service 상태
- Security/UFW/Jenkins/Tailscale 상태
- Plan vs Actual 비교
- Raw check 로그

</details>

<details>
<summary>Level 1 - 왜 이렇게 구성했나요?</summary>

1. 주니어 개발자가 운영 흐름을 명령어 나열이 아닌 맥락(Why)로 이해하도록 하기 위함
2. main/dev 분리 운영에서 배포/데이터/보안 정책이 섞이지 않게 시각적으로 강제하기 위함
3. 실제 상태(Actual)와 제안서 시뮬레이션(Proposal)을 분리해 커뮤니케이션 혼선을 줄이기 위함

</details>

<details>
<summary>Level 2 - 어떻게 동작하나요? (Actual Dashboard)</summary>

1. `docs/data/infra-health.json`를 기반으로 카드/구조도/표를 렌더링
2. 구조도 노드 hover 시 check summary/raw 일부를 tooltip으로 표시
3. 갱신 모드는 C:
- 자동 갱신(기본 60초)
- 수동 갱신 버튼(JSON reload)
4. 긴 로그는 `details/summary`로 계층적으로 접어 제공

</details>

<details>
<summary>Level 3 - 선행작업/명령어/증거</summary>

## Precheck
- 선행작업: `.env`/SSH key/host alias
- 명령어:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local\prepare-local.ps1
```
- 증거: `docs/workflow/INSTRUCTION_TRACE.md`

## Bootstrap
- 명령어:
```bash
sudo bash scripts/remote/bootstrap-remote.sh .env
```
- 증거: `scripts/ec2/bootstrap-base.sh`

## Security Verify
- 명령어:
```bash
bash scripts/remote/verify-remote-security.sh
```
- 증거: `scripts/ec2/network-exposure-audit.sh`

## Dashboard Data Refresh
- 명령어:
```powershell
pwsh -File scripts/local/refresh-infra-dashboard-data.ps1 -HostAlias ssafy-ec2
```
- 증거: `docs/data/infra-health.json`

</details>

<details>
<summary>Level 4 - Proposal Dashboard 설명 (Simulation)</summary>

- 초기 상태: 모든 항목 `PLANNED` (미설치/미적용 시나리오)
- 버튼 `설치 시뮬레이션 시작` 클릭 시:
1. 각 항목이 `INSTALLING` → `DONE`으로 변경
2. `fake-exec` 로그 출력
3. 실제 시스템 명령 실행 없음 (simulation only)

주의:
- 이 페이지는 제안서용 인터랙션이며 실제 운영 상태를 의미하지 않음
- 실제 상태는 반드시 Actual Dashboard + health json 기준으로 확인

</details>

<details>
<summary>비동기 배치/재시도 정책</summary>

- Probe 방식: async batch (`Start-Job` 기반 동시 실행)
- Retry: 기본 2~3회 권장
- Delay: exponential backoff (`2s -> 4s -> 8s`, cap 적용)
- Jitter: `0~1500ms`
- 목적: 일시 장애에서 회복성을 확보하면서 thundering herd를 방지

권장값(V1):
- `MaxRetries=2`
- `InitialDelaySeconds=2`
- `MaxDelaySeconds=8`
- `AutoRefreshSeconds=60`

</details>
