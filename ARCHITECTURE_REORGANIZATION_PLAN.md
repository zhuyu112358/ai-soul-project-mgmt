# 凌栖/Sojourn 架构整理计划（GDExtension重构）

> **决策时间**：2026-09-08
> **决策人**：用户
> **决策内容**：暂停所有功能开发，优先整理架构，将Ember和Arboreus核心能力重构为Godot GDExtension（C++），战策直接调用原生SDK，不再依赖HTTP API或自己造轮子。
> **决策原因**：当前"SDK"名不副实——Ember是Node.js服务器+HTTP API，Arboreus是JS库（战策GDScript根本用不了），导致战策只能自己实现一切，架构混乱。不赶时间，先把地基打牢。

---

## 一、当前架构问题

### 1.1 Ember "SDK"问题
- 实际形式：Node.js服务器（`server/index.js`），需要`npm start`启动
- 调用方式：战策通过HTTP请求调用`http://localhost:3000`
- 问题：
  - 需要单独开服务器，部署复杂
  - HTTP请求延迟高，不适合游戏实时逻辑
  - 服务器会崩溃（Guardian周期性崩溃）
  - 网络错误处理复杂
  - 单机游戏依赖外部服务器不合理

### 1.2 Arboreus "SDK"问题
- 实际形式：TypeScript/JavaScript编译后的库（`.js`+`.d.ts`）
- 调用方式：Node.js环境用`require`/`import`
- 问题：
  - 战策是GDScript写的，**根本没法直接调用JS库**
  - 等于Arboreus的能力战策完全用不了
  - 战策只能自己实现路径寻路、碰撞检测、事件系统等

### 1.3 战策问题
- 因为SDK不好用/用不了，战策只能自己实现一切
- 自己实现了：SoulAIController（AI决策）、SoulUnit（灵魂数据/行为）、A*寻路、ArenaMap（碰撞/空间）、EventBus（事件系统）、GameState（状态管理）等
- 这些都是重复造轮子，质量和能力不如引擎
- 长期来看，战策无法获得引擎能力的持续升级

---

## 二、目标架构

### 2.1 核心思路
- Ember和Arboreus的核心能力用**C++**重写，编译为**Godot GDExtension**
- 战策（GDScript）直接调用GDExtension提供的原生API
- 零延迟、零依赖、不需要外部服务器
- 一份C++代码，多平台可用（Windows/macOS/Linux/Android/iOS）

### 2.2 架构图

```
┌─────────────────────────────────────────────────┐
│                   战策 (GDScript)                 │
│  UI / 玩法规则 / 关卡设计 / 美术表现 / 音效 / 流程  │
└──────────────┬──────────────────┬───────────────┘
               │                  │
    ┌──────────▼──────┐  ┌───────▼──────────┐
    │  Ember GDExtension │  │ Arboreus GDExtension │
    │  (C++ 原生扩展)     │  │  (C++ 原生扩展)       │
    │                    │  │                       │
    │  • 灵魂数据结构     │  │  • 实体系统(ECS)      │
    │  • 认知决策循环     │  │  • 空间/物理碰撞      │
    │  • 情绪系统         │  │  • 路径寻路(A*)       │
    │  • 记忆系统         │  │  • 事件总线            │
    │  • 个性系统         │  │  • 世界状态管理        │
    │  • 关系/社交        │  │  • 经济系统            │
    └────────────────────┘  └───────────────────────┘
```

### 2.3 战策的职责（应用层）
- UI/交互：菜单、HUD、设置、按钮、输入处理
- 玩法规则：胜负条件、计分、难度、游戏模式
- 关卡设计：地图布局、障碍物摆放、出生点
- 美术表现：场景渲染、角色精灵、特效、粒子
- 音效音乐：BGM、音效、音频混合
- 游戏流程：场景切换、存档读档、教程引导
- **不做**：灵魂数据、AI决策、世界模拟、物理碰撞、路径寻路、事件系统

---

## 三、技术方案

### 3.1 GDExtension基础
- Godot版本：4.7.2
- 开发语言：C++17
- 构建系统：SCons（Godot官方推荐）或CMake
- 依赖：godot-cpp（Godot C++绑定库）
- 输出：`.gdextension`文件 + 编译后的动态库（`.dll`/`.so`/`.dylib`）

### 3.2 项目结构
```
sojourn-gdextension/
├── ember/                    # Ember GDExtension
│   ├── src/
│   │   ├── register_types.cpp
│   │   ├── soul_data.h/cpp       # 灵魂数据结构
│   │   ├── cognitive_engine.h/cpp # 认知决策引擎
│   │   ├── emotion_system.h/cpp   # 情绪系统
│   │   ├── memory_system.h/cpp    # 记忆系统
│   │   └── personality.h/cpp      # 个性系统
│   ├── godot-cpp/             # Godot C++绑定（子模块）
│   ├── SConstruct              # SCons构建脚本
│   └── ember.gdextension       # GDExtension配置
├── arboreus/                 # Arboreus GDExtension
│   ├── src/
│   │   ├── register_types.cpp
│   │   ├── entity.h/cpp          # 实体系统(ECS)
│   │   ├── spatial.h/cpp         # 空间/物理碰撞
│   │   ├── pathfinding.h/cpp     # 路径寻路(A*)
│   │   ├── event_bus.h/cpp       # 事件总线
│   │   └── world_state.h/cpp     # 世界状态管理
│   ├── godot-cpp/
│   ├── SConstruct
│   └── arboreus.gdextension
└── docs/                      # API文档
    ├── ember_api.md
    └── arboreus_api.md
```

### 3.3 API设计原则
- 简单易用：战策调用应该像调用普通GDScript类一样简单
- 性能优先：避免不必要的内存分配和拷贝
- 异步支持：耗时操作（如AI决策）支持异步回调
- 错误处理：清晰的错误码和错误信息
- 版本兼容：API版本化，后续升级不破坏现有调用

---

## 四、实施阶段

### 阶段一：架构定义（1-2周）
**目标**：定义清楚所有API接口和模块边界，不写实现代码

产出物：
1. Ember GDExtension API定义文档（所有类、方法、属性、信号）
2. Arboreus GDExtension API定义文档
3. 战策调用GDExtension的架构设计文档
4. 从现有Node.js/JS实现迁移到C++的详细计划
5. GDExtension项目骨架（可编译的空项目，验证构建环境）

**任务分配**：
- 监控：统筹协调，定义整体架构
- Ember任务：梳理现有Node.js实现，定义C++ API
- Arboreus任务：梳理现有JS实现，定义C++ API
- 战策任务：梳理当前自己实现的模块，定义需要的API
- 预研任务：研究GDExtension最佳实践、godot-cpp用法

### 阶段二：核心模块实现（2-4周）
**目标**：实现最核心的模块，战策能跑通基本流程

Ember优先实现：
1. 灵魂数据结构（SoulData）
2. 认知决策循环（CognitiveEngine：感知→决策→行动）
3. 个性系统（Personality：影响决策倾向）

Arboreus优先实现：
1. 实体系统（Entity：基础ECS）
2. 空间/物理碰撞（Spatial：2D碰撞检测）
3. 路径寻路（Pathfinding：A*算法）
4. 事件总线（EventBus：发布/订阅）

战策配合：
1. 替换SoulUnit为Ember SoulData
2. 替换SoulAIController为Ember CognitiveEngine
3. 替换A*寻路为Arboreus Pathfinding
4. 替换ArenaMap碰撞为Arboreus Spatial
5. 替换EventBus为Arboreus EventBus

### 阶段三：完整功能实现（4-8周）
**目标**：实现所有核心能力，战策完全依赖SDK

Ember实现：
- 情绪系统
- 记忆系统
- 关系/社交系统
- 学习系统
- 成长系统

Arboreus实现：
- 世界状态管理
- 经济系统
- 时间系统
- 环境系统
- 通信系统

战策：
- 移除所有自己实现的核心模块
- 完全依赖Ember和Arboreus GDExtension
- 只做应用层（UI、玩法、美术、音效、流程）

### 阶段四：优化和发布（2-4周）
**目标**：性能优化、多平台编译、文档完善

- 性能分析和优化
- Windows/macOS/Linux多平台编译
- 移动端（Android/iOS）编译支持
- API文档完善
- 示例项目
- 发布第一个稳定版本

---

## 五、任务调整

### 5.1 暂停的任务
| 任务 | 原频率 | 调整 | 原因 |
|------|--------|------|------|
| Ember开发 | 每2小时 | **暂停** | 等架构定义清楚再用C++重写 |
| Arboreus开发 | 每2小时 | **暂停** | 等架构定义清楚再用C++重写 |
| 战策应用实现 | 每15分钟 | **暂停功能开发** | 转为架构配合，梳理需要的API |
| 集成测试 | 每2小时 | **暂停** | 没有新功能不需要测试 |

### 5.2 保留/调整的任务
| 任务 | 原频率 | 调整 | 原因 |
|------|--------|------|------|
| 总体监控 | 每小时 | **保留** | 负责架构整理统筹 |
| 游戏设计 | 每15分钟 | **降低到每2小时** | 架构整理期间不需要高频产出 |
| 灵栖预研 | 每3小时 | **保留** | 研究GDExtension相关技术 |

### 5.3 新增任务（待定）
- 架构整理任务：专门负责GDExtension架构定义和实现
- 可能需要创建新的定时任务，频率每小时或每30分钟

---

## 六、风险和注意事项

### 6.1 技术风险
- C++开发难度比GDScript/JS高，需要确保代码质量
- GDExtension API可能有Godot版本兼容性问题
- 多平台编译可能遇到平台特定问题
- 性能优化需要专业知识

### 6.2 进度风险
- 架构整理可能比预期耗时
- C++重写所有核心模块工作量大
- 战策迁移到新API可能遇到兼容性问题

### 6.3 应对策略
- 先定义清楚API再写实现，避免返工
- 分阶段实施，每个阶段都有可验证的产出
- 保留旧实现作为参考，迁移完成后再删除
- 充分的单元测试和集成测试
- 文档先行，API文档和实现同步

---

## 七、成功标准

1. Ember和Arboreus核心能力编译为GDExtension，战策可直接调用
2. 战策不再依赖HTTP API或外部服务器
3. 战策不再自己实现灵魂数据、AI决策、路径寻路、碰撞检测、事件系统等核心模块
4. 战策只做应用层（UI、玩法、美术、音效、流程）
5. 游戏运行性能优于当前HTTP API方案
6. API文档完善，后续开发可直接参考
7. 多平台可编译运行

---

**本计划是项目的重大架构调整，所有任务必须严格遵守。**
**不赶时间，先把架构搞清楚，地基打牢了再盖楼。**
**用户2026-09-08明确决策：都没发布，不差这点时间。**
