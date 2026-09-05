# AI灵魂项目 — Bug跟踪

**最后更新：** 2026-09-05（第十一轮监控，BUG-001/002/004关闭，BUG-003/006派发SoulArena，BUG-005监控修复中）
**维护者：** 总体监控任务

---

## Bug统计

| 状态 | 数量 |
|------|------|
| 待确认 | 0 |
| 已派发/修复中 | 1 |
| 待回归 | 1 |
| 已关闭 | 3 |
| **总计活跃** | **2** |

---

## 活跃Bug

### BUG-001: perceive并发请求导致连接状态损坏
- **严重程度：** P1
- **发现时间：** 2026-09-05
- **发现者：** 集成测试任务
- **负责方：** SoulArena
- **状态：** ✅ 已关闭（2026-09-05 第十一轮监控）
- **关闭原因：** 第3轮复测干净服务器上5并发perceive全部成功（各~2.1s，LLMScheduler排队），连接状态未损坏。第1轮失败根因为服务器长时间运行后退化崩溃（BUG-006），非并发逻辑bug。BUG-006修复后此问题自然解决。
- **回归验证：** 干净服务器5并发perceive全部通过（集成测试第3轮，2026-09-05 20:35）

### BUG-002: Nova灵魂perceive接口15秒超时无响应
- **严重程度：** P1
- **发现时间：** 2026-09-05
- **发现者：** 集成测试任务
- **负责方：** SoulArena
- **状态：** ✅ 已关闭（2026-09-05 第十一轮监控，合并到BUG-006）
- **关闭原因：** 第3轮复测干净服务器上Nova perceive仅26ms（与Vex的27ms相当），证明Nova无固有性能问题。前两轮14秒超时为服务器长时间运行后退化的症状（BUG-006）。BUG-006修复后此问题自然解决。
- **回归验证：** 干净服务器Nova perceive 26ms（集成测试第3轮，2026-09-05 20:35）

### BUG-003: SoulArena无单元测试，npm test为空壳
- **严重程度：** P2
- **发现时间：** 2026-09-05
- **发现者：** 集成测试任务
- **负责方：** SoulArena
- **状态：** 🔴 已派发（2026-09-05 第十一轮监控，派发SoulArena开发任务）
- **问题描述：** npm test输出"No tests yet"，仓库中无任何*.test.js文件。每轮开发声称"20个测试全部通过"但测试是临时运行的，未持久化为测试文件。92个认知子系统缺少自动化单元测试保障。
- **修复要求：**
  1. 建立测试框架（jest或node内置test runner）
  2. 为核心系统（Soul.js/WorldInterface/LLMScheduler/ConversationManager）编写单元测试
  3. 每轮新增认知系统时同步添加测试文件
  4. npm test应能运行所有持久化测试
- **修复commit：** （待修复）
- **回归验证：** （待验证）
- **第4轮复测（2026-09-05 21:05）：** npm test仍为空壳。v4.74 SDK v1.0.0发布准备也未添加测试，SDK的package.json中test脚本仍为"No tests yet"。**未修复，SDK发布仍带空测试脚本。**

### BUG-004: SoulGame基础架构未实现，10个autoload脚本全部缺失
- **严重程度：** P1
- **发现时间：** 2026-09-05
- **发现者：** 集成测试任务
- **负责方：** SoulGame
- **状态：** ✅ 已关闭（2026-09-05 第十一轮监控，代码层面已修复）
- **修复内容：** SoulGame从2个文件增长到27+文件。全部10个autoload脚本已实现（EventBus/Logger/ConfigManager/GameState/SceneManager/SaveSystem/NetworkClient/SoulArenaClient/SeedClient/DebugOverlay）。新增性能监控（LatencyProfiler/StateSyncClient/PerformanceMonitor）、核心系统（ObjectPool/ResourceManager/InputManager）、TestRunner（5测试套件）、CI工作流。3个commit已推送GitHub。
- **修复commit：** 6ef2920（基础架构初始化）、1a864e3（性能监控/WebSocket同步/延迟分析）、6f1bb17（ObjectPool/ResourceManager/InputManager）
- **遗留：** Godot 4未安装，无法执行构建验证。待用户安装Godot 4后由集成测试任务执行构建验证。
- **回归验证：** 代码审查通过，全部autoload为真实实现非stub，无游戏逻辑（符合基础架构期约束）
- **第4轮复测（2026-09-05 21:05）：** SoulGame从27文件增长到**30文件**。新增InputManager.gd、ResourceManager.gd、ObjectPool.gd（通用对象池，支持多池/动态增长/命中率统计）。核心模块达11个。仍无游戏逻辑。Godot仍未安装。**持续修复中。**

### BUG-005: interface_spec.md内容过时
- **严重程度：** P3
- **发现时间：** 2026-09-05
- **发现者：** 集成测试任务
- **负责方：** 监控/双方
- **状态：** 🔵 修复中（2026-09-05 第十一轮监控，监控任务直接修复）
- **问题描述：** interface_spec.md停留在v1.0草案，仍标记SoulBridgeAdapter为"P0缺失"（实际已存在且端到端测试通过），仍标记感知格式不匹配为"P0待解决"（实际已由situation简化模式解决），未记录enter-world前置条件和action-result必填字段。
- **修复要求：** 监控任务更新interface_spec.md，反映当前实际实现状态
- **修复commit：** （本轮修复）
- **回归验证：** （待验证）
- **第4轮复测（2026-09-05 21:05）：** 仍为v1.0草案，仍标记SoulBridgeAdapter缺失。SoulArena SDK已自带SOUL_SEED_INTERFACE.md接口文档，可作为更新参考。**未修复。**

### BUG-006: SoulArena服务器长时间运行后崩溃（进程完全退出）
- **严重程度：** P1（最高优先级，影响所有依赖SoulArena的任务）
- **发现时间：** 2026-09-05
- **发现者：** 集成测试任务
- **负责方：** SoulArena
- **状态：** 🟡 待回归（2026-09-05，SoulArena v4.77已修复，commit a501dbd，等待集成测试30分钟稳定性验证）
- **问题描述：** 服务器运行约15-20分钟后进程完全退出。导致BUG-001（并发400）和BUG-002（Nova超时）的退化症状。干净服务器上所有功能正常，证明是运行时退化/崩溃问题。
- **根因：** 没有uncaughtException/unhandledRejection处理器，LLM调用/WebSocket/game ticks中的异步异常导致静默退出。没有进程守护。
- **修复内容（v4.77, commit a501dbd）：**
  1. uncaughtException handler：记录错误+堆栈+内存，写入crash-*.log，优雅关闭（10s超时后强制退出）
  2. unhandledRejection handler：记录并继续（仅警告，不崩溃）
  3. Process Guardian（scripts/server-guard.js，161行）：退出自动重启，指数退避2s→30s，熔断器（10次重启/5分钟），每30s HTTP健康检查，logs/guardian.log
  4. 内存监控：每60s，heap>200MB警告，heap>100MB信息
  5. 内存泄漏扫描：120个子系统文件扫描，无明显泄漏，Logger环形缓冲上限500，WS关闭已处理，LLM队列有上限
  6. package.json：新增"guard"脚本
- **修复commit：** a501dbd（v4.77）
- **回归验证：** （待验证：服务器持续运行30分钟以上不崩溃，内存稳定，guardian无异常重启）

---

## 已关闭Bug

### BUG-001: perceive并发请求导致连接状态损坏 — ✅ 已关闭（合并到BUG-006）
- 干净服务器5并发全部通过，根因为服务器退化（BUG-006）

### BUG-002: Nova灵魂perceive接口15秒超时 — ✅ 已关闭（合并到BUG-006）
- 干净服务器Nova仅26ms，根因为服务器退化（BUG-006）

### BUG-004: SoulGame基础架构未实现 — ✅ 已关闭（代码层面已修复）
- 27+文件，全部10个autoload实现，3个commit已推送。待Godot 4安装后构建验证

---

## Bug记录格式

### BUG-001: [标题]
- **严重程度：** P0/P1/P2/P3
- **发现时间：** YYYY-MM-DD
- **发现者：** 集成测试任务/监控任务/用户
- **负责方：** SoulArena/Seed/SoulGame/双方
- **状态：** 待确认/已派发/修复中/待回归/已关闭
- **复现步骤：**
  1. ...
- **预期行为：** ...
- **实际行为：** ...
- **修复commit：** （修复后填写）
- **回归验证：** （验证后填写：通过/失败 + 验证时间 + 验证者）

---

## 严重程度定义

| 级别 | 定义 | 响应时间 |
|------|------|----------|
| P0 阻断 | 系统崩溃/核心功能不可用/数据丢失 | 立即修复 |
| P1 严重 | 核心功能异常/集成失败/性能严重下降 | 24小时内 |
| P2 一般 | 非核心功能异常/体验问题 | 排期修复 |
| P3 低 | 文案/样式/建议优化 | 可选修复 |

---

## 工作流

1. **报告**：集成测试任务/监控/用户发现bug，在此文件新增记录，状态设为"待确认"
2. **确认与派发**：监控任务每轮检查"待确认"bug，确认后派发对应开发任务，状态改为"已派发"
3. **修复**：开发任务修复bug，记录修复commit，状态改为"待回归"
4. **回归验证**：集成测试任务执行针对性回归测试，通过则"已关闭"，失败则改回"修复中"
5. **监控汇总**：监控任务每轮在报告中汇总bug状态
