# 灵魂-种子世界 交互接口协议（统一规范）

**版本：** v1.1
**创建日期：** 2026-09-05
**最后更新：** 2026-09-06（第二十二轮监控，BUG-005修复）
**维护方：** AI灵魂项目监控任务
**状态：** 已对齐（SoulBridgeAdapter已实现，集成测试连续5轮PASS）
**兼容SDK版本：** SoulArena SDK v1.1.0 + Seed SDK v1.1.0

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

**三方组件（全部已实现）：**
1. **SoulArena WorldInterface** — 灵魂侧：接收世界感知，运行认知tick，输出动作（非阻塞webhook，v4.92）
2. **Seed SoulPerceptionSystem** — 世界侧感知：每tick为每个灵魂生成PerceptionFrame（碰撞/触发器/路径/天气事件）
3. **Seed SoulActionSystem** — 世界侧执行：接收ActionRequest，在世界中执行灵魂动作（move/interact/communicate/use/attack/wait/harvest/craft）

**桥接组件（已实现）：** Seed侧 **SoulBridgeAdapter** — 负责将PerceptionFrame转换为SoulArena感知格式、发送到SoulArena API、接收动作、转换为ActionRequest、交给SoulActionSystem执行。perceive→decide→act闭环已验证通过。

---

## 二、生命周期管理接口

### 2.1 灵魂进入世界

**SoulArena API：** `POST /api/soul/:id/enter-world`

**请求体：**
```json
{
  "worldId": "string",
  "worldName": "string (可选)",
  "callbackUrl": "string (动作回调URL，Seed侧接收端)",
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

**请求体（SoulArena侧定义）：**
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

**简化模式（推荐）：** 如果提供了 `situation` 字段，SoulArena直接使用该文本作为情境，忽略perception的结构化解析。SoulBridgeAdapter从PerceptionFrame生成situation文本。

**响应：**
```json
{
  "status": "perceived",
  "soulId": "string",
  "tick": 0,
  "cognitiveTick": 0,
  "processingTimeMs": 0,
  "actionsGenerated": 0
}
```

**性能基线（SDK v1.1.0）：**
- 单灵魂perceive响应时间：<500ms（实际24-58ms）
- 5并发perceive：5/5成功，各~2.1s（LLMScheduler排队）
- 非阻塞webhook：动作发送不阻塞perceive返回（v4.92）

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
  // M3新增：资源节点感知
  resourceNodes: Array<{
    id: string; type: ResourceType; position: IVector3;
    distance: number; harvestable: boolean;
  }>;
}
```

### 3.3 感知格式转换（SoulBridgeAdapter已实现）

| 维度 | SoulArena期望 | Seed生成 | 转换方式 | 状态 |
|------|-------------|----------|----------|------|
| 物体列表 | `perception.visual.objects[]` | `visibleEntities[]` | SoulBridgeAdapter映射type/name/distance | ✅ 已实现 |
| 其他灵魂 | `perception.visual.objects` (type: person) | `nearbySouls[]` | 合并到objects，type设为person | ✅ 已实现 |
| 环境 | `perception.visual.environment` | `environment` | 映射temperature/weather，生成location/lighting文本 | ✅ 已实现 |
| 声音/语言 | `perception.auditory.sounds[]` | `communications[]` | 映射为speech类型 | ✅ 已实现 |
| 本体感觉 | `perception.proprioception` | 无 | SoulBridgeAdapter生成默认值（posture/health/energy） | ✅ 已实现 |
| 事件 | `events[]` | `events[]` | 映射description/severity | ✅ 已实现 |
| 简化模式 | `situation` (文本) | 无 | SoulBridgeAdapter从PerceptionFrame生成情境文本 | ✅ 已实现（推荐方式） |
| 资源节点（M3） | 扩展字段 | `resourceNodes[]` | 映射到events或扩展perception | ✅ M3已实现 |

---

## 四、动作输出接口（灵魂 → 世界）

### 4.1 SoulArena动作输出（当前实现，非阻塞webhook v4.92）

SoulArena的WorldInterface通过webhook（callbackUrl）**非阻塞**发送动作（v4.92+）：
- `_sendActions()`改为fire-and-forget，不阻塞perceive返回
- 熔断器：5次连续失败后跳过webhook，30秒探测恢复
- pendingActions上限50

```json
{
  "tick": 0,
  "timestamp": "ISO8601",
  "soulId": "string",
  "worldId": "string",
  "actions": [
    {
      "id": "act_xxx_speak",
      "type": "speak | expression | move | attack | interact",
      "content": "string (speak类型)",
      "modality": "string",
      "volume": 0.7,
      "priority": 0.8,
      "expression": "string (expression类型)",
      "intensity": 0.5,
      "target": "string (move/attack/interact类型)",
      "direction": {"x": 0, "y": 0, "z": 0}
    }
  ],
  "internalState": {
    "emotion": {},
    "attention": "environment",
    "arousal": 0.5
  }
}
```

**SoulArena当前支持的动作类型：** `speak`（说话）、`expression`（表情）、`move`（移动，M3扩展）、`attack`（攻击，M3扩展）、`interact`（交互，M3扩展）

### 4.2 Seed侧ActionRequest（当前实现）

```typescript
interface ActionRequest {
  soulId: string;
  action: 'move' | 'interact' | 'communicate' | 'use' | 'attack' | 'wait' | 'harvest' | 'craft' | 'custom';
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
- `harvest` — 采集（M3，参数：{resourceNodeId, tool?}）
- `craft` — 合成（M3，参数：{recipeId, ingredients?}）
- `custom` — 自定义扩展

### 4.3 动作格式映射（SoulBridgeAdapter已实现）

| SoulArena输出 | Seed期望 | 映射方式 | 状态 |
|-------------|----------|----------|------|
| `type: 'speak', content` | `action: 'communicate', parameters: {content, medium}` | 直接映射 | ✅ 已实现 |
| `type: 'expression', expression, intensity` | 无对应动作（扩展Seed或忽略） | 记录到soul状态，不执行世界动作 | ✅ 已实现 |
| `type: 'move', target/direction` | `action: 'move', parameters: {x,y,z}` | 映射坐标 | ✅ M3已实现 |
| `type: 'attack', target` | `action: 'attack', parameters: {targetId, force}` | 映射目标 | ✅ M3已实现 |
| `type: 'interact', target` | `action: 'interact', parameters: {targetId}` | 映射目标 | ✅ M3已实现 |
| webhook callbackUrl（SoulArena主动POST） | Seed SoulBridgeAdapter接收端 | SoulBridgeAdapter监听callbackUrl，接收后转换并调用SoulActionSystem | ✅ 已实现 |

---

## 五、灵魂信息查询接口

### 5.1 SoulArena灵魂列表

**API：** `GET /api/souls`

**Seed SoulClient已实现：** 调用此接口获取灵魂列表，有mock fallback。

### 5.2 SoulArena灵魂详情

**API：** `GET /api/souls/:id`

**Seed SoulClient已实现：** 调用此接口获取单个灵魂详情（性格/情绪/价值系统/认知子系统状态）。

### 5.3 API路径确认（已对齐）

| 用途 | SoulArena路径 | 说明 |
|------|-------------|------|
| 灵魂列表 | `GET /api/souls` | 复数souls |
| 灵魂详情 | `GET /api/souls/:id` | 复数souls |
| 进入世界 | `POST /api/soul/:id/enter-world` | 单数soul |
| 离开世界 | `POST /api/soul/:id/exit-world` | 单数soul |
| 世界状态 | `GET /api/soul/:id/world-state` | 单数soul |
| 感知输入 | `POST /api/soul/:id/perceive` | 单数soul |
| 动作结果反馈 | `POST /api/soul/:id/action-result` | 单数soul |

**注意：** 列表/详情用复数 `/api/souls/`，世界操作/感知/动作用单数 `/api/soul/`。SoulBridgeAdapter已正确处理此差异。

---

## 六、SDK接口（应用层使用）

### 6.1 SoulArena SDK v1.1.0

**打包位置：** `dist/sdk/`（136文件）
**Git tag：** `soularena-sdk-v1.1.0`
**对应引擎版本：** v4.94（100认知子系统，197测试）

**核心API：**
- `SoulArenaClient` — 客户端封装（连接/感知/动作/灵魂管理）
- `Soul.create()` — 创建灵魂
- `Soul.perceive()` — 发送感知
- `Soul.getState()` — 获取灵魂状态
- `Soul.train()` — 训练灵魂（M3新增）
- `KnowledgeImport.import()` — 基础知识导入（M3新增）

### 6.2 Seed SDK v1.1.0

**Git tag：** `seed-sdk-v1.1.0`
**对应引擎版本：** Physics & Perception Deepening（550测试，M3后608测试）

**核心API：**
- `World` — 世界创建/配置/运行
- `SoulBridgeAdapter` — 灵魂-世界桥接（感知转换+动作映射+API调用）
- `SoulPerceptionSystem` — 感知生成
- `SoulActionSystem` — 动作执行
- `ResourceSystem` — 资源系统（M3新增）
- `CraftingSystem` — 合成系统（M3新增）

---

## 七、接口对齐状态（已验证）

| 检查项 | 状态 | 验证方式 |
|--------|------|----------|
| SoulBridgeAdapter实现 | ✅ 已实现 | Seed examples/integration-test.ts |
| 感知格式转换 | ✅ 已实现 | 集成测试PerceptionFrame→SoulArena perceive |
| 动作格式映射 | ✅ 已实现 | 集成测试speak→communicate |
| 生命周期管理 | ✅ 已实现 | enter-world/exit-world/world-state |
| API路径一致性 | ✅ 已对齐 | 复数souls（列表）/单数soul（操作） |
| 非阻塞webhook | ✅ 已实现（v4.92） | perceive 24-58ms，不阻塞动作发送 |
| 端到端集成测试 | ✅ 连续5轮PASS | 集成测试ci-report-round9-13 |
| 多灵魂并发 | ✅ 5/5成功 | 集成测试5并发perceive |
| SDK打包发布 | ✅ 双SDK v1.1.0 | git tag + dist/sdk/ |

---

## 八、已知限制与后续规划

### 当前限制
1. **SoulArena动作类型有限** — 当前主要speak/expression，move/attack/interact在M3扩展中
2. **Seed表情动作** — SoulArena输出expression时Seed不执行世界动作，仅记录状态
3. **感知结构化解析** — 推荐使用简化模式（situation文本），结构化perception字段部分未被SoulArena深度解析
4. **声学通信** — communicationMedium=sound_propagation已实现但测试覆盖有限

### 后续规划（M3/M4）
- **M3 SoulArena：** 灵魂训练API + 基础知识导入接口 + 训练效果评估（进行中，v4.95-v4.96）
- **M3 Seed：** 资源系统+经济规则+成长规则（进行中，608测试）
- **M4 SoulArena：** 多灵魂协作+灵魂间通信
- **M4 Seed：** 持久化世界+世界存档+世界生成器

---

## 九、版本变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-09-05 | 初始版本，记录两边当前实现和格式不匹配，提出SoulBridgeAdapter方案 |
| v1.1 | 2026-09-06 | BUG-005修复：全面更新反映当前实现状态。SoulBridgeAdapter从"P0缺失"改为"已实现并验证"；感知/动作格式转换标记为已实现；API路径确认对齐；新增非阻塞webhook（v4.92）说明；新增SDK v1.1.0接口文档；新增接口对齐状态表（连续5轮PASS）；新增M3资源节点感知/采集/合成动作；新增已知限制与后续规划 |

---

*本文档由监控任务维护，每次监控时校验两边实现是否对齐，发现漂移立即更新本文档并标记为P0卡点。*
