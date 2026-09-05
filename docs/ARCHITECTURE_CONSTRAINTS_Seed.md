# Seed 架构约束（种子世界引擎内核边界）

**版本：** v1.0
**适用仓库：** zhuyu112358/Seed
**维护方：** AI灵魂项目监控任务

> 本文档定义Seed种子世界引擎内核的硬性架构边界。监控任务每次巡检源码，发现越界立即标记为耦合风险。开发时必须遵守。

---

## 一、核心定位

Seed是**通用虚拟世界引擎**，负责：
- 抽象的世界生命周期管理（tick调度、实体管理）
- 通用物理模拟（碰撞、力、速度、空间分区）
- 事件总线（世界事件的产生、传播、订阅）
- 抽象通信层（声音传播/网络通信等可扩展的通信媒介）
- 灵魂桥接层（SoulPerceptionSystem + SoulActionSystem + SoulBridgeAdapter）
- 可靠性机制（日志、快照、事务回滚、异常恢复）
- 安全框架（权限、限流、输入验证）
- 性能优化（四叉树空间分区、对象池）
- 天气/世界事件模拟（WeatherSimulator、WorldEventSystem）

Seed**不负责**：
- 具体世界的剧情、场景设定、任务线
- 具体灵魂的行为逻辑、决策算法（由SoulArena负责）
- 具体游戏的战斗规则、经济系统、数值平衡
- 渲染/图形显示（引擎只负责逻辑模拟，渲染由上层应用负责）
- 具体世界实例的业务配置

---

## 二、硬性边界（禁止越界）

### 2.1 禁止硬编码具体世界属性

❌ **禁止：**
- 在 `src/engine/`、`src/entity/`、`src/physics/` 等内核代码中写入具体世界的名称、地图尺寸、场景设定
- 硬编码特定世界ID的特殊处理逻辑
- 在内核中为某个世界定制专属物理参数（如特定重力值、特定地图边界）

✅ **允许：**
- 通过配置文件/构造参数传入世界参数（如 `new World({ width: 100, height: 100, gravity: 9.8 })`）
- 通用的物理系统（参数可配置，不写死）
- 示例世界（`examples/` 目录）可以有具体配置，但不属于内核

### 2.2 禁止硬编码具体灵魂行为

❌ **禁止：**
- 在内核中实现灵魂的决策逻辑、认知算法、性格计算
- 硬编码特定灵魂ID的特殊行为
- 为某个灵魂定制专属的感知/动作处理

✅ **允许：**
- SoulPerceptionSystem生成标准化的PerceptionFrame（通用格式，不绑定具体灵魂）
- SoulActionSystem执行标准化的ActionRequest（通用动作类型，不绑定具体灵魂）
- SoulClient调用SoulArena API获取灵魂信息和决策（决策由SoulArena负责）
- SoulBridgeAdapter做格式转换和API调用（桥接层，不属于内核）

### 2.3 禁止内核直接依赖SoulArena认知逻辑

❌ **禁止：**
- Seed内核代码中实现认知/心理/情绪/记忆算法
- 直接import SoulArena的认知系统代码
- 在Seed中复制SoulArena的决策逻辑

✅ **允许：**
- 通过HTTP API调用SoulArena（SoulClient）
- SoulBridgeAdapter作为桥接层，负责格式转换和API调用
- Seed只负责"感知生成"和"动作执行"，"决策"完全交给SoulArena

### 2.4 禁止业务逻辑混入内核

❌ **禁止：**
- 在内核中实现具体游戏的战斗规则、经济系统、任务系统、付费逻辑
- 为特定产品（如RTS对战、养成世界）写专属逻辑
- 商业化逻辑出现在内核中

✅ **允许：**
- 通用的事件系统（任何世界事件都可以通过事件总线传播）
- 通用的实体交互系统（交互/使用/攻击是通用动作，具体效果由上层定义）
- 具体游戏逻辑放在独立的应用层/示例层，不混入内核

---

## 三、模块分层规范

```
src/
├── engine/                    # ⭐ 世界引擎内核（tick调度、实体管理、系统注册）
│   ├── World.js
│   └── WorldSystem.ts
├── entity/                    # 通用实体系统
│   ├── Entity.ts / GameObject.ts
│   ├── EntityFactory.ts
│   ├── Vector3.ts
│   ├── SoulPerceptionSystem.ts   # ⭐ 感知层：生成PerceptionFrame（通用格式）
│   └── SoulActionSystem.ts       # ⭐ 执行层：执行ActionRequest（通用动作）
├── physics/                   # 通用物理系统
│   ├── PhysicsSystem.ts
│   └── Quadtree.ts
├── event/                     # 通用事件系统
│   ├── EventSystem.ts
│   ├── ConditionEngine.ts
│   ├── WeatherSimulator.ts       # 天气模拟（通用参数）
│   ├── WorldClock.ts             # 世界时钟
│   └── WorldEventSystem.ts       # 世界事件系统
├── api/
│   └── soulClient.ts          # ⭐ SoulArena API客户端（只做HTTP调用，不做认知逻辑）
├── communication/             # 通用通信抽象
│   └── AcousticPropagation.ts
├── reliability/               # 可靠性机制
│   ├── Logger.ts / SnapshotManager.ts / Transaction.ts
├── security/                  # 安全框架
│   ├── PermissionSystem.ts / RateLimiter.ts / InputValidator.ts
├── sdk/                       # SDK层（供上层应用使用）
├── types/                     # 类型定义（含PerceptionFrame/ActionRequest等接口契约）
└── bridge/                    # ⭐ 桥接层（待创建：SoulBridgeAdapter）
    └── SoulBridgeAdapter.ts   # 感知格式转换 + 动作格式转换 + API调用编排
```

**分层规则：**
1. `engine/`、`entity/`、`physics/`、`event/` 是纯内核，不能出现具体世界/灵魂的业务逻辑
2. `SoulPerceptionSystem` 和 `SoulActionSystem` 是通用桥接组件，只处理标准化格式，不做认知决策
3. `SoulClient` 只做HTTP调用，不实现认知逻辑
4. `SoulBridgeAdapter`（待创建）是唯一允许做格式转换和API编排的模块
5. 具体世界配置和业务逻辑放在 `examples/` 或独立应用层，不混入 `src/` 内核

---

## 四、接口规范

### 4.1 感知输出（世界→灵魂）

- 生成者：SoulPerceptionSystem
- 格式：PerceptionFrame（定义在 `src/types/index.ts`）
- 内容：visibleEntities、nearbySouls、environment、events、communications
- 传递：SoulBridgeAdapter获取PerceptionFrame → 转换格式 → 调用SoulArena API

### 4.2 动作输入（灵魂→世界）

- 执行者：SoulActionSystem
- 格式：ActionRequest（定义在 `src/types/index.ts`）
- 动作类型：move / interact / communicate / use / attack / wait / custom
- 接收：SoulBridgeAdapter接收SoulArena动作 → 转换为ActionRequest → 调用SoulActionSystem.executeAction()

### 4.3 灵魂信息查询

- SoulClient.listSouls() → GET /api/souls
- SoulClient.getSoul(id) → GET /api/souls/:id
- 有mock fallback（SoulArena不可用时使用内置mock灵魂）

---

## 五、巡检清单（监控任务每次执行）

监控任务每次巡检以下项，发现问题记录到BLOCKERS.md：

- [ ] `src/engine/`、`src/physics/` 内核代码中是否出现具体世界名称/地图的硬编码
- [ ] 内核代码中是否出现具体灵魂ID/名字的特殊逻辑
- [ ] 是否有认知/决策/情绪算法实现在Seed代码中（应在SoulArena）
- [ ] SoulPerceptionSystem/SoulActionSystem是否处理标准化格式（无具体灵魂/世界绑定）
- [ ] 是否有 `if (soulId === 'xxx')` 或 `if (worldId === 'xxx')` 形式的特殊逻辑
- [ ] 具体世界配置是否放在 `examples/` 而非 `src/` 内核
- [ ] 接口实现是否对齐 `docs/interface_spec.md`
- [ ] SoulBridgeAdapter是否已创建（当前缺失，P0卡点）

---

## 六、违规处理

1. 发现越界代码 → 记录到BLOCKERS.md，标记为耦合风险
2. 评估影响范围 → 提出重构建议（将业务逻辑移到examples/或独立应用层）
3. 在下一轮开发中修复 → 修复后从卡点清单移除
4. 反复违规 → 考虑在开发定时任务prompt中加强约束

---

*本文档由监控任务维护，与 `docs/interface_spec.md` 配合使用。*
