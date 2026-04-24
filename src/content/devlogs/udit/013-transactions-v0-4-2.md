---
title: 'Transactions → v0.4.2'
description: '여러 mutation을 하나의 Undo group으로. begin/commit/rollback/status. 자동화의 안전망.'
pubDate: '2026-04-14'
seq: 13
type: 'feat'
commits: ['10ae76c', '1205991']
tags: ['transactions', 'undo', 'safety', 'v0.4.2', 'release']
draft: false
---

## 왜 트랜잭션이 필요한가

자동화 시나리오:
```bash
udit go create --name "Boss"           # ← 1
udit component add --id go:X --type BossAI   # ← 2
udit component set --id go:X --type BossAI --field hp --value 1000   # ← 3
udit component set --id go:X --type BossAI --field damage --value 50   # ← 4
```

4개 명령 = **4개 Undo entries**. 사용자가 Ctrl+Z 한 번 누르면 마지막 set만 되돌아감. 다 되돌리려면 Ctrl+Z 4번.

더 나쁜 케이스: 명령 3에서 fail → 결과는 "Boss는 만들어졌고 BossAI 추가됐는데 hp 설정 못 함" — **inconsistent state**.

## 해결: 트랜잭션

```bash
udit tx begin "Spawn Boss"
udit go create --name "Boss"
udit component add --id go:X --type BossAI
udit component set --id go:X --type BossAI --field hp --value 1000
udit component set --id go:X --type BossAI --field damage --value 50
udit tx commit
# Editor의 Undo 스택: "Spawn Boss" 1 entry
```

Ctrl+Z 한 번 → 4 명령 모두 되돌아감.

명령 중간 fail이면:
```bash
udit tx begin "Spawn Boss"
udit go create --name "Boss"
udit component add --id go:X --type BossAI
udit component set --id go:X --type BossAI --field hp --value "abc"   # ← fail (type mismatch)
# 자동 또는 명시적
udit tx rollback
# 이전 상태로 복구
```

## API

```bash
udit tx begin [name]              # 새 트랜잭션 시작
udit tx commit                    # 확정 (Undo 스택에 1 entry로)
udit tx rollback                  # 롤백 (모든 mutation undo)
udit tx status                    # 현재 상태
```

### Status

```bash
udit tx status
```

```json
{
  "data": {
    "active": true,
    "name": "Spawn Boss",
    "started_at": "2026-04-14T15:30:00Z",
    "operations": 3,
    "operations_log": [
      "go.create Boss",
      "component.add BossAI",
      "component.set hp=1000"
    ]
  }
}
```

활성 트랜잭션 없으면:
```json
{ "data": { "active": false } }
```

## 구현

### Undo group 활용

Unity의 `Undo.SetCurrentGroupName` + `Undo.CollapseUndoOperations`:

```csharp
public class TransactionManager {
    private int? activeGroup = null;
    private string activeName = null;
    
    public void Begin(string name) {
        if (activeGroup.HasValue) throw new ConflictException("UCI-501");
        Undo.IncrementCurrentGroup();
        activeGroup = Undo.GetCurrentGroup();
        activeName = name;
        Undo.SetCurrentGroupName(name);
    }
    
    public void Commit() {
        if (!activeGroup.HasValue) throw new NoneException("UCI-502");
        Undo.CollapseUndoOperations(activeGroup.Value);
        activeGroup = null;
        activeName = null;
    }
    
    public void Rollback() {
        if (!activeGroup.HasValue) throw new NoneException("UCI-502");
        Undo.RevertAllDownToGroup(activeGroup.Value);
        activeGroup = null;
        activeName = null;
    }
}
```

### 모든 mutation은 group 안에서

기존 GO/Component mutation들이 자동으로 active group에 등록됨. `Undo.RecordObject` 등의 호출이 현재 group으로 들어감.

### 한 번에 한 트랜잭션

```bash
udit tx begin "A"
udit tx begin "B"
# UCI-501: Transaction "A" already active
```

중첩 트랜잭션 안 함. 시나리오 복잡해지고 Unity Undo가 nested group을 잘 처리 못 함. 단순함이 답.

## 사용 시나리오

### AI 에이전트 자동화

```python
session.execute("udit tx begin 'Generate Level'")
try:
    for enemy in level.enemies:
        session.execute(f"udit go create --name {enemy.name} ...")
        session.execute(f"udit component add ...")
    session.execute("udit tx commit")
except Exception:
    session.execute("udit tx rollback")
```

실패 시 깨끗한 상태 보장.

### 사람 작업

10분 작업 시작 전 `udit tx begin "Boss room layout"`. 끝나고 commit. 나중에 마음 바뀌면 Ctrl+Z 한 번.

## v0.4.2 릴리스

들어간 것:
- tx begin/commit/rollback/status
- 모든 mutation 자동 group 등록

이걸로 v0.4 mutation 단계 완성. **CRUD + 트랜잭션** = 신뢰 가능한 자동화.

## 메모

**왜 nested transaction 안 하나**

Unity Undo는 group이 평탄. nested 묘사하려면 별도 가상 stack 관리 — 복잡도 ↑. 95% 케이스에서 nested 안 필요. 5%는 그냥 분리해서 호출.

**Auto-commit에 시간 제한?**

`udit tx begin` 후 30분 commit 안 하면 자동 rollback? — 안 함. 의도된 long transaction (사용자가 작업 중) 망가짐. 명시적 commit/rollback만.

대신 `udit tx status`로 잊어버린 트랜잭션 발견 가능.

## 다음

Project info/validate/preflight + Test runner. v0.4.3.
