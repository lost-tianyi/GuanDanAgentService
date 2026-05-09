# guandan-core

## Purpose

描述本仓库「掼蛋」实时对局的**核心协作边界**：服务端为规则与状态的唯一来源，客户端负责呈现与输入；设计文档（如 `docs/` 下教练 PRD）可在后续单独拆分为更多 OpenSpec 能力。

## Requirements

### Requirement: Authoritative game state on server

系统 SHALL 在 Node.js 服务端维护完整对局状态（座位、手牌、当前出牌圈、级牌、进贡队列等），并通过 Socket.IO 向房间内客户端广播增量更新。

#### Scenario: Play accepted

- **GIVEN** 轮到某座位玩家且其出牌合法
- **WHEN** 服务端处理 `play-cards` 成功
- **THEN** 广播 `cards-played` 且状态中包含更新后的 `playedCards` 与当前玩家指针

### Requirement: Rule validation server-side

系统 SHALL 仅在服务端执行牌型解析（如 `analyzePattern`）、压制判定（`canBeat`）与回合推进；客户端不得单独裁定胜负或改变等级。

#### Scenario: Invalid play rejected

- **GIVEN** 玩家提交不符合规则的牌组
- **WHEN** 服务端校验失败
- **THEN** 返回失败消息且不广播状态变更

### Requirement: Local PvE mode

系统 SHALL 支持 `mode=local`：人类玩家与填充 AI 同桌；AI 回合由服务端在同房内自动驱动（含托管真人时的代打路径）。

#### Scenario: AI chain after human

- **GIVEN** 本地房间内下一行动者为 AI 或托管中的真人
- **WHEN** 服务端调度 AI/托管逻辑成功
- **THEN** 客户端收到与普通玩家一致的 `cards-played` / `player-passed` 事件

### Requirement: Online multiplayer baseline

系统 SHALL 支持多真人 Socket 加入同一房间并进行出牌、过、进贡/还牌与聊天；离开房间的客户端 SHALL 触发服务端清理座位或断开逻辑（具体策略以实现为准）。

## Notes

- 语音播报、教练提示、BGM 等体验能力可另建 `openspec/specs/*` 能力文件，避免本文件无限膨胀。
- 与教练产品相关的详细需求仍以 `docs/PRD-guandan-coach-v1.md` 等为参考，OpenSpec 变更可通过 `openspec/changes/` 跟踪落地增量。
