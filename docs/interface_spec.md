# 灵魂-种子世界 交互接口协议（统一规范）

**版本：** v1.0
**创建日期：** 2026-09-05
**维护方：** AI灵魂项目监控任务
**状态：** 草案（两边实现尚未完全对齐，需协商确认）

> 本文档是灵魂系统（SoulArena）与种子世界平台（Seed）之间通信交互的**唯一事实来源**。两边的桥接层开发必须以此文档为准。监控任务每次校验两边实现是否对齐本文档，发现漂移立即标记为P0卡点。

---

## 一、架构总览

```
┌─────────────────┐     perceive      ┌──────────────────┐
│                 │ ────────────────> │                  │
│   SoulArena     │   (世界感知输入)   │   Seed 世界引擎   │
│   灵魂系统       │ <──────────────── │                  │
│   (认知/决策)    │     action        │  (感知/执行)      │
│                 │   (灵魂动作输出)   │                  │
└─────────────────┘                   └──────────────────┘
         ↑                                      ↑
         │  enter/exit (生命周期管理)              │
         └──────────────────────────────────────┘
```

**三方组件：**
1. **SoulArena WorldInterface** — 灵魂侧：接收世界感知，运行认知tick，输出动作
2. **Seed SoulPerceptionSystem** — 世界侧感知：每tick为每个灵魂生成PerceptionFrame
3. **Seed SoulActionSystem** — 世界侧执行：接收ActionRequest，在世界中执行灵魂动作

**缺失组件（P0）：** Seed侧缺少 **SoulBridgeAdapter** — 负责将PerceptionFrame转换为SoulArena感知格式、发送到SoulArena API、接收动作、转换为ActionRequest、交给SoulActionSystem执行。这是perceive→decide→act循环的"decide"环节。

---

## 二、生命周期管理接口

### 2.1 灵魂进入世界

**SoulArena API：** `POST /api/soul/:id/enter-world`

**请求体（SoulArena侧定义）：**
```json
{
  "worldId": "string",
  "worldName": "string (可选)",
  "callbackUrl": "string (动作回调URL)",
  "communicationMedium": "direct_api | sound_propagation (可选，默认direct_api)",
  "perceptionConfig": {},
  "worldRules": {}
}
```

**响应：**
```json
{
  "status": "entered",
  "soulId": "string",
  "worldId": "string",
  "worldName": "string",
  "enteredAt": "ISO8601",
  "connectionStatus": "connected",
  "perceptionEndpoint": "http://localhost:3000/api/soul/:id/perceive"
}
```

### 2.2 查询世界连接状态

**SoulArena API：** `GET /api/soul/:id/world-state`

**响应：**
```json
{
  "soulId": "string",
  "inWorld": true,
  "worldId": "string",
  "worldName": "string",
  "connectionStatus": "connected | stale | disconnected",
  "enteredAt": "ISO8601",
  "lastPerceiveTick": 0,
  "lastActionTick": 0,
  "totalPerceptions": 0,
  "totalActions": 0,
  "pendingActions": 0,
  "failedCallbacks": 0
}
```

### 2.3 灵魂离开世界

**SoulArena API：** `POST /api/soul/:id/exit-world`

**请求体（可选）：**
```json
{ "reason": "string (可选，默认unknown)" }
```

**响应：**
```json
{
  "status": "exited",
  "soulId": "string",
  "worldId": "string",
  "exitedAt": "ISO8601",
  "sessionDuration": 0,
  "reason": "string",
  "totalPerceptions": 0,
  "totalActions": 0
}
```

---

## 三、感知输入接口（世界 → 灵魂）

### 3.1 SoulArena感知API

**SoulArena API：** `POST /api/soul/:id/perceive`

**请求体（SoulArena侧当前定义）：**
```json
{
  "tick": 0,
  "perception": {
    "visual": {
      "environment": {
        "location": "string",
        "lighting": "string",
        "weather": "string",
        "temperature": 0
      },
      "objects": [
        {
          "type": "person | item",
          "name": "string",
          "action": "string",
          "distance": 0.0,
          "expression": "string (可选，person类型)"
        }
      ]
    },
    "auditory": {
      "sounds": [
        {
          "type": "speech | sound",
          "source": "string",
          "content": "string (speech类型)"
        }
      ]
    },
    "proprioception": {
      "posture": "string",
      "health": 0,
      "energy": 0
    }
  },
  "events": [
    {
      "description": "string",
      "severity": 0,
      "psychologicalEffects": {}
    }
  ],
  "worldState": {},
  "situation": "string (简化模式：直接提供情境文本)",
  "experiences": ["string"],
  "threatLevel": 0,
  "complexity": 0.4,
  "timePressure": 0.3,
  "activity": "string"
}
```

**简化模式：** 如果提供了 `situation` 字段，SoulArena直接使用该文本作为情境，忽略perception的结构化解析。这是当前推荐的对接方式。

### 3.2 Seed侧PerceptionFrame（当前实现）

Seed的SoulPerceptionSystem每tick生成：
```typescript
interface PerceptionFrame {
  soulId: string;
  timestamp: number;
  worldTime: number;
  position: IVector3;
  visibleEntities: Array<{
    id: string; name: string; type: EntityType;
    position: IVector3; distance: number; visible: boolean;
  }>;
  nearbySouls: Array<{
    id: string; name: string; element: string;
    position: IVector3; distance: number;
  }>;
  environment: {
    temperature: number; pressure: number; humidity: number;
    windSpeed: number; windDirection: IVector3; lightLevel: number;
    weather: WeatherState; timeOfDay: number;
  };
  events: Array<{
    id: string; type: string; name: string;
    severity: string; distance: number; affectsSoul: boolean;
  }>;
  communications: CommunicationMessage[];
}
```

### 3.3 ⚠️ 感知格式不匹配（P0待解决）

| 维度 | SoulArena期望 | Seed生成 | 状态 |
|------|-------------|----------|------|
| 物体列表 | `perception.visual.objects[]` (type: person/item) | `visibleEntities[]` (type: EntityType) | ❌ 需转换 |
| 其他灵魂 | `perception.visual.objects` (type: person) | `nearbySouls[]` (独立字段) | ❌ 需合并转换 |
| 环境 | `perception.visual.environment` (location/lighting/weather/temp) | `environment` (temperature/pressure/humidity/wind/light/weather) | ❌ 字段不同 |
| 声音/语言 | `perception.auditory.sounds[]` (type: speech) | `communications[]` (CommunicationMessage) | ❌ 需转换 |
| 本体感觉 | `perception.proprioception` (posture/health/energy) | 无 | ❌ Seed未生成 |
| 事件 | `events[]` (description/severity/psychologicalEffects) | `events[]` (id/type/name/severity/distance/affectsSoul) | ❌ 字段不同 |
| 简化模式 | `situation` (文本) | 无 | ❌ Seed未生成情境文本 |

**解决方案：** 在Seed侧创建 **SoulBridgeAdapter** 组件，负责：
1. 从SoulPerceptionSystem获取PerceptionFrame
2. 转换为SoulArena的感知格式（推荐使用简化模式：从PerceptionFrame生成situation文本）
3. 调用SoulArena的 `/api/soul/:id/perceive` API
4. 接收SoulArena返回的动作
5. 转换为Seed的ActionRequest格式
6. 交给SoulActionSystem执行

---

## 四、动作输出接口（灵魂 → 世界）

### 4.1 SoulArena动作输出（当前实现）

SoulArena的WorldInterface通过webhook（callbackUrl）发送动作：
```json
{
  "tick": 0,
  "timestamp": "ISO8601",
  "soulId": "string",
  "worldId": "string",
  "actions": [
    {
      "id": "act_xxx_speak",
      "type": "speak | expression",
      "content": "string (speak类型)",
      "modality": "string",
      "volume": 0.7,
      "priority": 0.8,
      "expression": "string (expression类型)",
      "intensity": 0.5
    }
  ],
  "internalState": {
    "emotion": {},
    "attention": "environment",
    "arousal": 0.5
  }
}
```

**SoulArena当前支持的动作类型：** `speak`（说话）、`expression`（表情）

### 4.2 Seed侧ActionRequest（当前实现）

```typescript
interface ActionRequest {
  soulId: string;
  action: 'move' | 'interact' | 'communicate' | 'use' | 'attack' | 'wait' | 'custom';
  targetId?: string;
  parameters: Record<string, unknown>;
  timestamp: number;
}
```

**Seed支持的动作类型：**
- `move` — 移动（参数：{x,y,z} 或 {direction,distance}）
- `interact` — 交互（参数：targetId）
- `communicate` — 交流（参数：{content, medium}）
- `use` — 使用（参数：targetId）
- `attack` — 攻击（参数：{targetId, force}）
- `wait` — 等待
- `custom` — 自定义扩展

### 4.3 ⚠️ 动作格式不匹配（P0待解决）

| 维度 | SoulArena输出 | Seed期望 | 状态 |
|------|-------------|----------|------|
| 动作类型字段 | `type: 'speak'\|'expression'` | `action: 'move'\|'interact'\|'communicate'\|'use'\|'attack'\|'wait'\|'custom'` | ❌ 不匹配 |
| speak → communicate | `type: 'speak', content` | `action: 'communicate', parameters: {content, medium}` | ❌ 需映射 |
| expression | `type: 'expression', expression, intensity` | 无对应动作 | ❌ Seed不支持表情 |
| 移动 | 无 | `action: 'move'` | ❌ SoulArena不输出移动 |
| 攻击/交互/使用 | 无 | `action: 'attack'/'interact'/'use'` | ❌ SoulArena不输出 |
| 传输方式 | webhook callbackUrl (SoulArena主动POST) | 需Seed主动拉取或接收 | ❌ 模式不同 |

**解决方案：**
1. **短期（推荐）：** SoulBridgeAdapter接收SoulArena的webhook回调，将 `speak` 映射为 `communicate`，忽略 `expression`（或扩展Seed支持表情），然后调用SoulActionSystem.executeAction()。
2. **中期：** 扩展SoulArena的动作生成器，支持输出 `move`/`attack`/`interact` 等动作类型，使灵魂可以在世界中主动移动和交互。
3. **长期：** 统一动作枚举，两边协商确定完整的动作类型列表。

---

## 五、灵魂信息查询接口

### 5.1 SoulArena灵魂列表

**API：** `GET /api/souls`

**Seed SoulClient已实现：** 调用此接口获取灵魂列表，有mock fallback。

### 5.2 SoulArena灵魂详情

**API：** `GET /api/souls/:id`

**Seed SoulClient已实现：** 调用此接口获取单个灵魂详情（性格/情绪/价值系统）。

### 5.3 ⚠️ API路径确认

Seed SoulClient使用 `/api/souls` 和 `/api/souls/:id`。需确认SoulArena实际路由路径是否一致（SoulArena的WorldInterface使用 `/api/soul/:id/...`，注意是单数 `soul` 而非复数 `souls`）。

---

## 六、接口对齐任务清单（P0）

| 优先级 | 任务 | 负责方 | 说明 |
|--------|------|--------|------|
| P0 | 创建SoulBridgeAdapter组件 | Seed | 感知格式转换 + 动作格式转换 + API调用 |
| P0 | 确认SoulArena灵魂列表API路径 | 双方 | `/api/souls` vs `/api/soul` 一致性 |
| P0 | 实现SoulArena webhook回调接收端 | Seed | 接收SoulArena主动POST的动作 |
| P1 | 扩展SoulArena动作生成器 | SoulArena | 支持输出move/attack/interact等动作 |
| P1 | 扩展Seed支持表情动作 | Seed | SoulArena输出expression时Seed能处理 |
| P1 | 统一动作枚举 | 双方 | 协商确定完整的动作类型列表 |
| P2 | 生成简化模式situation文本 | Seed SoulBridgeAdapter | 从PerceptionFrame生成情境文本，推荐对接方式 |
| P2 | 端到端联调测试 | 双方 | 1灵魂进入世界，运行100tick，感知→认知→动作闭环 |

---

## 七、版本变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-09-05 | 初始版本，记录两边当前实现和格式不匹配，提出SoulBridgeAdapter方案 |

---

*本文档由监控任务维护，每次监控时校验两边实现是否对齐，发现漂移立即更新本文档并标记为P0卡点。*
