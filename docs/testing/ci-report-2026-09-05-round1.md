# AI灵魂项目 — 集成测试报告

**测试轮次：** 第1轮（基础架构测试期首次运行）
**测试时间：** 2026-09-05 20:00 ~ 20:15 (UTC+8)
**测试者：** 集成测试定时任务
**当前阶段：** 基础架构测试期（设计v1.1未冻结，只测基础架构和SDK连通性）

---

## 一、测试范围与总结论

| 测试大类 | 状态 | 说明 |
|----------|------|------|
| 1. SDK连通性测试 | 🟡 部分通过 | 基础API通，并发和超时存在问题 |
| 2. 应用实现基础架构测试 | 🔴 未通过 | SoulGame仅空壳，无法构建 |
| 3. 引擎层回归测试 | 🟡 部分通过 | Seed 411测试全绿，SoulArena无单元测试 |
| 4. 性能基线测试 | 🟡 部分完成 | 单灵魂perceive 19ms，并发不稳定 |

**总体结论：** 引擎层（Seed）状态良好，411测试全通过，端到端集成测试闭环正常。SoulArena API基础连通但并发稳定性不足，且无自动化单元测试。应用实现（SoulGame）基础架构尚未实际开发，仅有project.godot和空目录。本轮发现5个待确认bug/问题。

---

## 二、SDK连通性测试详细结果

### 2.1 SoulArena API连通性（localhost:3000）

| # | 测试项 | 结果 | 详情 |
|---|--------|------|------|
| 1 | GET /api/souls 列表 | ✅ 通过 | HTTP 200，返回24个灵魂（含历史测试数据） |
| 2 | GET /api/souls/:id 详情 | ✅ 通过 | HTTP 200 |
| 3 | POST /api/souls/:id/enter-world | ✅ 通过 | Vex和Nova均成功进入世界 |
| 4 | POST /api/souls/:id/perceive (Vex) | ✅ 通过 | 延迟19ms，返回0个action（平静情境下正常） |
| 5 | POST /api/souls/:id/perceive (Nova) | ❌ 失败 | 15秒超时，无响应 |
| 6 | POST /api/souls/:id/action-result | ✅ 通过 | Vex动作结果反馈成功 |
| 7 | GET /api/souls/:id/world-state | ✅ 通过 | inWorld=true, totalPerceptions=1 |
| 8 | 多灵魂并发perceive (5并行) | ❌ 失败 | 5/5全部返回400 SOUL_NOT_IN_WORLD |
| 9 | POST /api/souls/:id/exit-world (Nova) | ✅ 通过 | 正常退出 |
| 10 | POST /api/souls/:id/exit-world (Vex) | ❌ 失败 | 400 SOUL_NOT_IN_WORLD（并发测试后状态异常） |

**关键发现：**
- 单灵魂顺序调用链路完整：enter→perceive→action-result→world-state→exit 全部正常
- Nova perceive超时可能与LLM调度有关（LLMScheduler maxConcurrent=2）
- 并发测试中，5个并行请求全部400，且导致Vex的world connection状态变为disconnected，疑似连接管理存在竞态条件或异常清理bug
- 并发测试后Vex无法正常exit-world，状态已损坏

### 2.2 Seed SDK集成测试

| # | 测试项 | 结果 | 详情 |
|---|--------|------|------|
| 1 | SoulBridgeAdapter感知-决策-动作循环 | ✅ 通过 | 端到端集成测试60tick完整运行 |
| 2 | 端到端集成测试 (examples/integration-test.ts) | ✅ 通过 | 12感知发送/0失败, 12动作接收/11执行/0失败 |
| 3 | 多灵魂场景 (2灵魂) | ✅ 通过 | 包含在单元测试中，multi-soul-communication.test.ts全绿 |
| 4 | 声学通信验证 | ✅ 通过 | AcousticPropagation.test.ts + multi-soul-communication.test.ts (7测试) |
| 5 | 碰撞系统验证 | ✅ 通过 | collision-system.test.ts (13测试) AABB碰撞+位置分离+速度响应 |

**集成测试详细数据：**
```
Mode: Single-soul, World ticks: 60
Global perceptions: 12 sent, 0 failed
Global actions: 12 received, 11 executed, 0 failed
Soul Vex (wind): 11 actions received, 11 executed, 0 failed
Final position: (0.60, 0.00, 0.30)
Verdict: PASS — perceive -> decide -> act loop fully operational
```

---

## 三、应用实现基础架构测试（SoulGame）

| # | 测试项 | 结果 | 详情 |
|---|--------|------|------|
| 1 | Godot 4项目结构 | 🟡 部分 | project.godot存在，目录结构已创建 |
| 2 | Godot项目构建 | ❌ 失败 | 无法构建，10个autoload脚本全部缺失 |
| 3 | SDK调用封装层 | ❌ 未实现 | scripts/sdk/目录为空 |
| 4 | 场景管理系统 | ❌ 未实现 | scripts/autoload/SceneManager.gd缺失，scenes/为空 |
| 5 | 状态管理 | ❌ 未实现 | scripts/autoload/GameState.gd缺失 |
| 6 | 网络层连通性 | ❌ 未实现 | scripts/core/NetworkClient.gd缺失 |
| 7 | 数据持久化 | ❌ 未实现 | scripts/autoload/SaveSystem.gd缺失 |
| 8 | 事件总线 | ❌ 未实现 | scripts/autoload/EventBus.gd缺失 |
| 9 | 主场景 | ❌ 缺失 | project.godot指定res://scenes/main.tscn，文件不存在 |

**SoulGame项目文件清单（仅2个文件）：**
- `.gitignore`
- `project.godot`（配置了10个autoload引用，但所有引用的.gd文件均不存在）

**project.godot中声明但缺失的autoload脚本：**
1. EventBus.gd (事件总线)
2. Logger.gd (日志)
3. ConfigManager.gd (配置管理)
4. GameState.gd (状态管理)
5. SceneManager.gd (场景管理)
6. SaveSystem.gd (数据持久化)
7. NetworkClient.gd (网络层)
8. SoulArenaClient.gd (SDK封装)
9. SeedClient.gd (SDK封装)
10. DebugOverlay.gd (调试层)

**结论：** SoulGame基础架构尚未实际开发。应用实现任务可能刚启动仓库初始化，所有核心模块均为待实现状态。Godot IDE打开此项目会报10个autoload加载错误，无法运行。

---

## 四、引擎层回归测试

### 4.1 SoulArena单元测试

| 测试项 | 结果 | 详情 |
|--------|------|------|
| npm test | ⚠️ 空壳 | 输出"No tests yet"，无任何测试文件 |
| 测试文件数量 | 0 | 仓库中无*.test.js文件（node_modules除外） |

**严重问题：** PROJECT_STATUS.md声称"86认知子系统，每轮20个单元测试全部通过"，但实际仓库中没有任何单元测试文件，npm test脚本仅输出占位文本。这是文档与实际严重不符的问题。

### 4.2 Seed单元测试

| 测试项 | 结果 | 详情 |
|--------|------|------|
| npm test | ✅ 全部通过 | **411 tests, 411 pass, 0 fail** |
| 测试套件数 | 40 suites | 总耗时1947ms |
| TypeScript编译 | ✅ 通过 | 测试运行即验证编译 |

**对比PROJECT_STATUS.md：** 报告称386测试，实际411测试（新增25个，可能是近期开发任务新增）。

### 4.3 接口兼容性检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| API路径一致性 | 🟡 注意 | 存在两套路径：/api/soul/:id（单数，313行）和/api/souls/:id（复数，465行），可能造成调用方混淆 |
| perceive接口格式 | ✅ 一致 | 支持situation简化模式，与interface_spec.md一致 |
| action-result必填字段 | ⚠️ 文档缺失 | 代码要求actionId和type必填，但interface_spec.md未明确记录 |
| 动作类型映射 | ⚠️ 不一致 | SoulArena支持10种动作(move/speak/interact/expression/observe/gesture/sleep/attack/flee/custom)，Seed支持7种(move/interact/communicate/use/attack/wait/custom)，speak↔communicate需SoulBridgeAdapter映射 |
| interface_spec.md时效性 | ❌ 过时 | 文档仍标记"SoulBridgeAdapter缺失(P0)"，实际已存在且端到端测试通过；文档状态为"草案" |
| enter-world前置条件 | ⚠️ 文档缺失 | perceive/action-result/exit-world均要求先enter-world，interface_spec.md未明确此依赖关系 |

---

## 五、性能基线数据

| 指标 | 测量值 | 测试条件 | 备注 |
|------|--------|----------|------|
| SoulArena单灵魂perceive响应 | **19ms** | Vex, 平静情境, situation模式 | 不含LLM调用（直接返回） |
| SoulArena多灵魂并发响应 | **不稳定** | 5并行请求, 全部400失败 | 并发场景存在严重问题 |
| SoulArena Nova perceive | **>15s (超时)** | Nova, 相同情境 | 疑似LLM调度阻塞或灵魂状态异常 |
| Seed端到端集成(含API) | ~25ms/tick | 60tick共1.5s, 含SoulArena API调用 | 每10tick发送一次感知 |
| Seed纯引擎tick | 未完成 | 性能测试脚本因API签名不匹配卡住 | 待下一轮补充 |
| Godot 2D渲染帧率 | 无法测试 | 项目无法构建 | 待基础架构完成后测试 |
| SoulArena服务器内存 | 运行中 | 进程正常，未测量具体值 | 下一轮补充 |

---

## 六、新增Bug列表

| Bug ID | 标题 | 严重程度 | 负责方 | 状态 |
|--------|------|----------|--------|------|
| BUG-001 | perceive并发请求导致连接状态损坏（全部400 SOUL_NOT_IN_WORLD） | P1 | SoulArena | 待确认 |
| BUG-002 | Nova灵魂perceive接口15秒超时无响应 | P1 | SoulArena | 待确认 |
| BUG-003 | SoulArena无单元测试，npm test为空壳（与状态报告不符） | P2 | SoulArena | 待确认 |
| BUG-004 | SoulGame基础架构未实现：10个autoload脚本全部缺失，项目无法构建 | P1 | SoulGame | 待确认 |
| BUG-005 | interface_spec.md内容过时（仍标记SoulBridgeAdapter为P0缺失） | P3 | 监控/双方 | 待确认 |

---

## 七、待回归Bug验证结果

**当前无待回归bug**（BUG_TRACKER.md活跃bug数为0）。

---

## 八、风险与建议

1. **🔴 SoulGame基础架构严重滞后：** 应用实现任务已启用但产出为零（仅空目录），建议监控任务确认应用实现任务是否正常运行，是否需要调整prompt或优先级。
2. **🟡 SoulArena并发稳定性：** perceive接口在并发场景下会损坏连接状态，这对多灵魂同屏场景是阻断性问题，建议SoulArena开发任务优先排查WorldInterface连接管理的竞态条件。
3. **🟡 SoulArena测试覆盖缺失：** 86个子系统无任何自动化测试，完全依赖手动验证，建议建立基础测试框架（至少覆盖API路由和WorldInterface状态机）。
4. **🟢 Seed引擎状态优秀：** 411测试全绿，端到端闭环正常，多灵魂/声学/碰撞均验证通过，可作为SDK打包发布的候选版本。
5. **🟡 接口文档需更新：** interface_spec.md应从"草案"升级，反映SoulBridgeAdapter已实现、动作类型映射方案、enter-world前置条件等实际状态。

---

## 九、下一轮测试计划

1. 回归验证BUG-001~005（如已修复）
2. 补充Seed纯引擎性能基线（修正API调用方式）
3. 测试SoulArena 3灵魂并发场景（如BUG-001修复后）
4. 检查SoulGame基础架构进展
5. 测量SoulArena服务器内存和CPU基线
6. 验证SDK打包状态（dist/sdk/目录）

---

*报告生成时间：2026-09-05 20:15 UTC+8*
*测试环境：Windows本地，SoulArena localhost:3000，Node.js，Godot 4.2（未安装/未验证）*
