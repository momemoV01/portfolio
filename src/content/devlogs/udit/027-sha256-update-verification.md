---
title: 'udit update — SHA256 체크섬 검증'
description: 'GitHub Releases에서 다운받은 바이너리 무결성 검증. HTTPS + SHA256 이중 방어. 자동 업데이트 마지막 안전장치.'
pubDate: '2026-04-16'
seq: 27
type: 'security'
commits: ['f888a5b']
tags: ['security', 'update', 'integrity', 'sha256']
draft: false
---

## 위협 모델

`udit update` = GitHub Releases에서 새 udit 바이너리 다운받아 자기 자신 교체. 위험:

1. **MITM 공격** — HTTPS 중간자가 바이너리 변조
2. **GitHub 자체 침해** — release 자체가 변조됨

대부분 사용자는 (1)도 (2)도 안 당하지만, 도구가 사용자 머신에 자기 자신 덮어쓰는 동작은 **신중**해야 함.

## 방어 Layer 1: HTTPS

다운로드는 무조건 HTTPS:
```go
url := fmt.Sprintf("https://github.com/momemoV01/udit/releases/download/v%s/udit-%s-%s",
    version, runtime.GOOS, runtime.GOARCH)
resp, err := http.Get(url)  // Go 표준 TLS, 시스템 신뢰 루트 사용
```

평문 HTTP 거부 (URL 자체가 https로만 발급).

## 방어 Layer 2: SHA256 체크섬

### Release 구성

각 GitHub Release에:
- `udit-linux-amd64` (바이너리)
- `udit-linux-amd64.sha256` (체크섬 텍스트)

체크섬 파일 내용:
```
a3f9e8d2b1c4e6f8a3f9e8d2b1c4e6f8a3f9e8d2b1c4e6f8a3f9e8d2b1c4e6f8  udit-linux-amd64
```

표준 `sha256sum -c` 형식.

### Release 자동화

GitHub Actions에서 release 빌드 시 자동 체크섬:
```yaml
- name: Build
  run: |
    GOOS=linux GOARCH=amd64 go build -o udit-linux-amd64 .
    sha256sum udit-linux-amd64 > udit-linux-amd64.sha256
- name: Upload to release
  uses: actions/upload-artifact@v7
  with:
    name: release-assets
    path: |
      udit-*
      udit-*.sha256
```

수동 작성 안 함 — CI가 매 release 자동 생성.

### CLI 측 검증

```go
func VerifyDownload(binPath, sumPath string) error {
    // 1. 체크섬 파일 읽기
    sumContent, err := os.ReadFile(sumPath)
    if err != nil { return err }
    
    parts := strings.Fields(string(sumContent))
    if len(parts) < 1 { return errors.New("invalid checksum file") }
    expectedHash := parts[0]
    
    // 2. 다운받은 바이너리 hash 계산
    f, err := os.Open(binPath)
    if err != nil { return err }
    defer f.Close()
    
    hasher := sha256.New()
    if _, err := io.Copy(hasher, f); err != nil { return err }
    actualHash := hex.EncodeToString(hasher.Sum(nil))
    
    // 3. 비교
    if !strings.EqualFold(expectedHash, actualHash) {
        return fmt.Errorf("checksum mismatch:\n  expected: %s\n  got:      %s",
            expectedHash, actualHash)
    }
    
    return nil
}
```

### 사용자 경험

**성공**:
```
$ udit update
Checking for updates... ✓ v1.0.1 available (you: v1.0.0)
Downloading udit-linux-amd64... ✓ (4.2MB)
Verifying checksum... ✓
Replacing binary at /usr/local/bin/udit... ✓
Updated to v1.0.1.
```

**실패** (체크섬 미스매치):
```
$ udit update
Checking for updates... ✓ v1.0.1 available
Downloading udit-linux-amd64... ✓
Verifying checksum...
✗ Checksum verification failed.
  expected: a3f9e8d2...
  got:      b1c2d4e5...
Aborted. Existing binary unchanged.
Temporary file removed.
```

명확한 에러 + 안전 종료. 부분적 교체 안 함 (atomic).

### Atomic replacement

```go
func ReplaceAtomically(currentBin, newBin string) error {
    // 1. 새 바이너리를 임시 위치에 다운로드
    tmpPath := currentBin + ".tmp"
    
    // 2. 검증
    if err := VerifyDownload(tmpPath, tmpPath+".sha256"); err != nil {
        os.Remove(tmpPath)
        return err
    }
    
    // 3. 원자적 rename (POSIX rename(2)이 atomic)
    return os.Rename(tmpPath, currentBin)
}
```

검증 실패하면 rename 안 일어남 → 기존 바이너리 손상 없음.

## 한계 (방어 못 하는 것)

`SECURITY.md`에 명시:

> **Out of scope:** GitHub itself compromised — if the release notes' hash and the binary are both crafted by the same attacker, this passes verification. At that point SemVer and our promises are moot. Stronger defense would be GPG signing — future work.

솔직한 한계 표명. "내 도구가 모든 공격 막는다"는 거짓말이라 안 함.

## v1.x Follow-up: GPG 서명

미래에 추가할 수 있는 layer:
- 각 release에 GPG signature
- udit이 maintainer public key 내장
- 검증 실패 시 reject

복잡도 ↑이지만 supply chain 공격 방어. v1.0엔 안 들어감, 1.x 후속.

## 메모

**왜 작은 변경 (1 커밋)이 release 가치가 있나**

자동 업데이트는 사용자 머신에 자기 자신 덮어씀. 이 한 줄 (`if !checksumMatch return error`)이 **잘못된 코드 실행 차단**의 마지막 라인. 

가장 작은 코드, 가장 큰 책임.

**왜 atomic replacement 신경?**

검증 실패 → 부분 교체 → 새 바이너리 깨짐 + 기존 잃음 = 사용자 더 이상 udit 사용 불가. 망가진 도구를 도구로 못 고침.

`rename(2)`는 POSIX atomic. Windows에선 `MoveFileEx(MOVEFILE_REPLACE_EXISTING)` 비슷하게 atomic. Go의 `os.Rename`이 둘 다 적절히 사용.

## 다음

README slim + docs split.
