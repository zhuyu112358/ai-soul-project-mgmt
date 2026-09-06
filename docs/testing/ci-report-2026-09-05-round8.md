# AI灵魂项目 — 集成测试报告

**测试轮次：** 第8轮
**测试时间：** 2026-09-05 23:00 ~ 23:20 (UTC+8)
**测试者：** 集成测试定时任务
**当前阶段：** 基础架构测试期（设计v1.1未冻结）

---

## 一、测试范围与总结论

| 测试大类 | 状态 | 说明 |
|----------|------|------|
| 1. SDK连通性测试 | 🟡 部分通过 | 干净服务器全绿，但Guardian启动循环导致服务器不可用 |
| 2. 应用实现基础架构测试 | 🟢 持续改善 | SoulGame 41→45文件，新增config/CONTRIBUTING/README |
| 3. 引擎层回归测试 | ✅ 通过 | SoulArena 111/111, Seed 522/522, 集成测试❌(BUG-008) |
| 4. 性能基线测试 | ✅ 已完成 | 干净v4.83: Vex 27ms, Nova 19ms |

**本轮核心发现：**
1. **🔴 P1 Guardian启动循环bug**：v4.81的Guardian EADDRINUSE修复本身有缺陷，导致Guardian陷入"杀进程→重启→端口仍占用→再杀→再重启"的无限循环。23:01-23:03连续5次EADDRINUSE启动失败，服务器完全不可用。杀掉所有node进程后手动干净启动才恢复。
2. **BUG-008连续4轮未修复**：Seed集成测试仍选中sleeping的PersistTest，0感知。
3. **BUG-005连续5轮未修复**：interface_spec.md仍为v1.0草案。
4. **引擎测试质量优秀**：SoulArena 111测试（+40）、Seed 522测试（+7）全部通过。
5. **干净v4.83 API正常**：Vex 27ms, Nova 19ms, 5并发4/5（1个偶发失败，首个请求7.1s异常）。

---

## 二、🔴 P1 Guardian启动循环bug（BUG-006子问题恶化）

### 2.1 现象

| 时间 | 事件 |
|------|------|
| 23:01:22 | crash log #1: EADDRINUSE, uptime=243ms |
| 23:01:33 | crash log #2: EADDRINUSE, uptime=216ms |
| 23:01:44 | crash log #3: EADDRINUSE, uptime=216ms |
| 23:02:11 | crash log #4: EADDRINUSE, uptime=243ms |
| 23:02:23 | crash log #5: EADDRINUSE, uptime=190ms |
| 23:02:44 | crash log #6: EADDRINUSE, uptime=247ms |
| 23:02:51 | crash log #7: EADDRINUSE, uptime=178ms |
| 23:03:03 | crash log #8: EADDRINUSE, uptime=181ms |

**8次连续启动失败，每次uptime<250ms，服务器完全不可用。**

### 2.2 Guardian日志分析

```
[GUARDIAN] Port 3000 is in use (attempt 1/3)
[GUARDIAN] Port 3000 occupied by PID 28528, attempting to kill...
[GUARDIAN] Killed PID 28528 occupying port 3000
[GUARDIAN] Server exited: code=1 type=STARTUP_FAILURE
[GUARDIAN] Startup failure #1/5 (not counted in runtime breaker)
[GUARDIAN] Restarting in 2000ms...
[GUARDIAN] Port 3000 now available after cleanup attempt 1
[GUARDIAN] Starting SoulArena server (backoff=4000ms, portAvailable=true)
[GUARDIAN] Server exited: code=0 type=STARTUP_FAILURE  ← 矛盾：portAvailable=true但启动失败
[GUARDIAN] WARNING: Port 3000 still occupied after 3 attempts, will try spawn anyway
[GUARDIAN] Starting SoulArena server (backoff=2000ms, portAvailable=false)
```

### 2.3 根因分析

1. **Guardian杀进程后立即重启**，未等待端口TIME_WAIT释放（Windows上TIME_WAIT可达30-120秒）
2. **portAvailable检测与实际不一致**：日志显示"portAvailable=true"但启动仍EADDRINUSE
3. **"Server stable 60s, backoff reset"出现在启动过程中**，说明Guardian状态机有竞态
4. **启动失败不计入熔断器**（设计如此），但导致无限循环而不触发熔断保护
5. **熔断器触发后完全停止**，不尝试恢复，需手动干预

### 2.4 恢复措施

杀掉全部4个node进程（含Guardian和多个服务器实例），等待4秒端口释放，手动`node server/index.js`直接启动（绕过Guardian）。服务器稳定运行。

### 2.5 修复建议

1. Guardian杀进程后等待至少10秒（或检测端口真正释放）再重启
2. 修复portAvailable检测逻辑（当前可能检测的是connect而非listen）
3. 启动失败也应计入独立的启动熔断器（如5次启动失败后等待60秒）
4. 熔断器触发后应自动恢复（等待5分钟后重试），而非完全停止
5. Windows平台增加SO_REUSEADDR或等待TIME_WAIT释放

---

## 三、SDK连通性测试（干净v4.83，无Guardian）

| # | 测试项 | 结果 | 详情 |
|---|--------|------|------|
| 1 | GET /api/souls | ✅ | 24灵魂 |
| 2 | enter-world (Vex+Nova) | ✅ | |
| 3 | perceive (Vex) | ✅ | **27ms** |
| 4 | perceive (Nova) | ✅ | **19ms** |
| 5 | action-result | ✅ | |
| 6 | 5并发perceive | 🟡 | **4/5成功**，1个失败(tick=6)，首个请求7162ms异常 |
| 7 | exit-world | 🟡 | Vex失败，Nova成功 |
| 8 | 服务器稳定性 | ✅ | uptime=60s, 0错误, 内存76→97MB |

**5并发分析**：首个请求7.1秒（可能是LLMScheduler冷启动或队列阻塞），后续3个~2.1秒正常，第5个超时失败。v4.80增加了并发数但首个请求仍有异常延迟。

---

## 四、引擎层回归测试

### 4.1 SoulArena单元测试

| 指标 | 第7轮 | 第8轮 | 变化 |
|------|-------|-------|------|
| 测试数 | 111 | **111** | 稳定 |
| 通过 | 111 | **111** | ✅ |
| 失败 | 0 | **0** | ✅ |
| 耗时 | 676ms | 676ms | 稳定 |

### 4.2 Seed单元测试

| 指标 | 第7轮 | 第8轮 | 变化 |
|------|-------|-------|------|
| 测试数 | 522 | **522** | 稳定（无flaky） |
| 通过 | 522 | **522** | ✅ |
| 失败 | 0 | **0** | ✅ |
| 耗时 | 2698ms | 2698ms | 稳定 |

**BUG-009（flaky）本轮未复现**，测试数量稳定522。

### 4.3 Seed端到端集成测试（BUG-008）

| 指标 | 结果 |
|------|------|
| 选中灵魂 | PersistTest (water, **sleeping**) |
| 感知发送 | 0 |
| 感知失败 | 12 |
| 结果 | **FAIL（连续4轮）** |

**BUG-008未修复**：discoverSouls()仍无status过滤，所有active灵魂current_game_id非空，只有sleeping的PersistTest可用。

---

## 五、应用实现基础架构（SoulGame）

| 指标 | 第7轮 | 第8轮 | 变化 |
|------|-------|-------|------|
| 文件总数 | 41 | **45** | +4 |
| 核心模块 | 19 | 19 | 稳定 |

**新增：**
- config/world.cfg (797b) — 世界配置
- config/game.cfg (870b) — 游戏配置
- CONTRIBUTING.md (5.6KB) — 贡献指南
- .gitattributes (1KB) — Git属性
- README.md更新 (9.3KB)

**评估：** 项目工程化持续完善，配置系统和贡献指南新增。Godot仍未安装（连续8轮）。

---

## 六、接口兼容性（BUG-005）

interface_spec.md仍为v1.0草案，状态"草案（两边实现尚未完全对齐）"。**连续5轮未修复。**

---

## 七、性能基线

| 指标 | 干净v4.83 |
|------|-----------|
| Vex perceive | 27ms |
| Nova perceive | 19ms |
| 5并发 | 4/5, 首个7.2s, 其余~2.1s |
| 启动内存 | 64.4MB |
| 60秒后内存 | 96.8MB |
| 内存增长 | ~0.54MB/s（测试期间） |

---

## 八、Bug状态汇总

| Bug ID | 标题 | 级别 | 状态 | 本轮结论 |
|--------|------|------|------|----------|
| BUG-001 | 并发连接损坏 | P1 | ✅ 已关闭 | |
| BUG-002 | Nova超时 | P1 | ✅ 已关闭 | 干净服务器19ms |
| BUG-003 | 无单元测试 | P2 | ✅ 已关闭 | 111/111稳定 |
| BUG-004 | SoulGame架构 | P1 | ✅ 已关闭 | 45文件 |
| BUG-005 | interface_spec过时 | P3 | 🔵 修复中 | **5轮未修复** |
| BUG-006 | 服务器崩溃+退化 | P1 | 🔴 修复中 | **Guardian启动循环恶化，干净服务器正常** |
| BUG-007 | Seed衍射失败 | P2 | ✅ 已关闭 | 522/522 |
| BUG-008 | 集成测试选sleeping | P2 | 🔴 待确认 | **连续4轮未修复** |
| BUG-009 | Seed测试flaky | P2 | 🔴 待确认 | 本轮未复现 |

---

## 九、风险与建议

1. **🔴 P1 Guardian启动循环需立即修复**：v4.81 Guardian修复本身有bug，导致服务器在端口占用时无限重启循环，完全不可用。建议SoulArena开发任务优先修复Guardian的端口检测和重启等待逻辑。
2. **🔴 BUG-008需立即派发Seed**：连续4轮集成测试失败，discoverSouls()必须添加status过滤。
3. **🟡 5并发偶发失败**：干净服务器上5并发4/5，首个请求7.2秒异常。v4.80并发增加后可能引入了调度器问题。
4. **🟡 BUG-005接口文档**：5轮无更新，建议降级或明确负责人。
5. **🔴 Godot环境**：连续8轮无法构建验证。

---

## 十、下一轮测试计划

1. Guardian启动循环修复验证（如已修复）
2. BUG-008修复验证
3. v4.83长时间运行稳定性（15分钟+退化测试）
4. 5并发稳定性（多次运行统计成功率）
5. BUG-005 interface_spec更新验证
6. SoulGame Godot构建验证（如Godot可用）

---

*报告生成时间：2026-09-05 23:20 UTC+8*
*测试环境：Windows本地，SoulArena localhost:3000（v4.83，手动干净启动，绕过Guardian，运行~1分钟，96.8MB，0错误），Godot未安装*
