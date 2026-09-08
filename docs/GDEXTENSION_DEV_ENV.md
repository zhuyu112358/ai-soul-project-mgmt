# GDExtension 开发环境与分工

> **版本**: v1.0
> **日期**: 2026-09-08
> **状态**: 环境已就绪，待启动开发

## 一、开发环境（已验证就绪）

### 1.1 编译器与构建工具

| 工具 | 版本 | 路径 |
|------|------|------|
| Visual Studio | 2022 Community 17.13.35919.96 | `D:\Program Files\Microsoft Visual Studio\2022\Community` |
| MSVC (cl.exe) | 19.43.34809 | `D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\bin\Hostx64\x64\cl.exe` |
| CMake | 3.30.5-msvc23 | `D:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe` |
| MSBuild | 17.13.19 | `D:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe` |
| Windows SDK | 10.0.22621.0 | `D:\Windows Kits\10` |

### 1.2 其他工具

| 工具 | 版本 | 说明 |
|------|------|------|
| Python | 3.14.7 | `C:\Python314\python.exe` |
| Git | 2.45.2 | `D:\Program Files\Git\cmd\git.exe` |
| Godot | 4.7.2.stable | `D:\Godot\Godot.exe` |
| SCons | ❌ 安装失败 | Python user site-packages被禁用，**用CMake替代** |

### 1.3 构建系统选择

**使用CMake**（而非SCons），原因：
1. SCons安装失败（Python环境限制）
2. CMake已随VS2022安装，版本3.30.5
3. CMake对Visual Studio支持更好，可直接生成.sln解决方案
4. godot-cpp官方同时支持CMake和SCons

### 1.4 开发命令

```powershell
# 设置MSVC环境变量（每次编译前执行）
& "D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

# 或者用完整路径调用cl.exe
$env:PATH = "D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\bin\Hostx64\x64;$env:PATH"
$env:INCLUDE = "D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\include;D:\Windows Kits\10\Include\10.0.22621.0\ucrt;D:\Windows Kits\10\Include\10.0.22621.0\um;D:\Windows Kits\10\Include\10.0.22621.0\shared"
$env:LIB = "D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\lib\x64;D:\Windows Kits\10\Lib\10.0.22621.0\ucrt\x64;D:\Windows Kits\10\Lib\10.0.22621.0\um\x64"
```

## 二、项目结构

### 2.1 GDExtension项目根目录

`D:\Sojourn\gdextension\`

```
gdextension/
├── ember/                          # Ember灵魂引擎GDExtension
│   ├── ember.gdextension           # GDExtension配置文件
│   ├── CMakeLists.txt              # CMake构建配置（待创建）
│   ├── godot-cpp/                  # Godot C++绑定（待克隆）
│   └── src/
│       ├── register_types.h/cpp    # 模块注册
│       ├── soul_data.h/cpp         # 灵魂数据结构
│       ├── personality.h/cpp       # 个性系统
│       ├── emotion_state.h/cpp     # 情绪状态
│       ├── cognitive_engine.h/cpp  # 认知决策引擎
│       ├── memory_system.h/cpp     # 记忆系统
│       └── soul.h/cpp              # 灵魂主类
├── arboreus/                       # Arboreus世界引擎GDExtension
│   ├── arboreus.gdextension        # GDExtension配置文件
│   ├── CMakeLists.txt              # CMake构建配置（待创建）
│   ├── godot-cpp/                  # Godot C++绑定（待克隆）
│   └── src/
│       ├── register_types.h/cpp    # 模块注册
│       ├── world.h/cpp             # 世界主类
│       ├── entity.h/cpp            # 实体（ECS）
│       ├── spatial_index.h/cpp     # 空间索引
│       ├── pathfinder.h/cpp        # 路径寻路（A*）
│       ├── grid_map.h/cpp          # 网格地图
│       ├── event_bus.h/cpp         # 事件总线
│       ├── event.h/cpp             # 事件数据结构
│       ├── physics_system.h/cpp    # 物理系统
│       ├── movement_system.h/cpp   # 移动系统
│       └── world_clock.h/cpp       # 世界时钟
├── docs/                           # 文档
├── examples/                       # 示例代码
├── README.md                       # 项目说明
└── .gitignore                      # Git忽略规则
```

### 2.2 Git仓库

- 本地路径：`D:\Sojourn\gdextension\`
- 初始提交：`7a7f659 feat: GDExtension项目骨架初始化`
- 远程仓库：**待创建**（建议GitHub: `github.com/zhuyu112358/sojourn-gdextension`）

## 三、分工说明

### 3.1 总体原则

**监控任务（我）只做协调和调度，不写代码。** 具体的GDExtension开发由对应的开发agent执行。

### 3.2 任务分工

| 任务 | 负责内容 | 仓库写权限 |
|------|----------|-----------|
| **Ember开发** | Ember GDExtension开发：灵魂数据、个性、情绪、认知引擎、记忆系统、灵魂主类 | `D:\Sojourn\gdextension\ember\` |
| **Arboreus开发** | Arboreus GDExtension开发：世界、实体、空间索引、路径寻路、网格地图、事件总线、物理系统、移动系统、世界时钟 | `D:\Sojourn\gdextension\arboreus\` |
| **战策应用实现** | 战策游戏开发：调用GDExtension SDK，实现游戏逻辑、UI、关卡等（架构整理完成后启动） | `D:\Sojourn\battleplan\` |
| **游戏设计** | 游戏设计：UI原型图、概念图、音效、关卡设计等（按需触发） | `D:\Sojourn\management\docs\game-design\` |
| **集成测试** | 集成测试：GDExtension与战策集成测试、回归测试（架构整理完成后启动） | `D:\Sojourn\battleplan\tests\` |
| **总体监控** | 协调调度、环境配置、文档维护、进度跟踪、问题协调、Git管理 | `D:\Sojourn\management\` + `D:\Sojourn\gdextension\`（仅文档和配置） |

### 3.3 开发流程

1. **监控任务**：每15分钟执行一次，按需触发Ember/Arboreus开发任务
2. **Ember/Arboreus开发任务**：被触发后执行一轮开发，完成后报告进度
3. **监控任务**：检查开发结果，更新文档，协调问题，决定下一轮触发哪个任务
4. **战策应用实现**：GDExtension核心模块完成后，触发战策集成SDK

### 3.4 接口变更流程

1. Ember/Arboreus开发需要变更API时，先更新 `D:\Sojourn\management\docs\interface_spec.md`
2. 通知监控任务，监控任务协调战策和其他相关任务
3. 确认无冲突后，再修改代码
4. 修改完成后，更新API文档和CHANGELOG

## 四、API定义文档

详细的API定义：
- Ember: `D:\Sojourn\management\docs\EMBER_GDEXTENSION_API.md`
- Arboreus: `D:\Sojourn\management\docs\ARBOREUS_GDEXTENSION_API.md`

## 五、开发优先级

### P0（核心，必须先实现）
- Ember: SoulData, Personality, EmotionState, CognitiveEngine(基础版), Soul
- Arboreus: World, Entity, SpatialIndex, Pathfinder, GridMap, EventBus, Event, PhysicsSystem(基础), MovementSystem

### P1（重要，第二阶段）
- Ember: MemorySystem, PerceptionSystem, DecisionSystem(完整版), ActionSystem, GrowthSystem
- Arboreus: WorldClock, SteeringBehaviors, PerceptionSystem, BehaviorTree, NavigationMesh

### P2（增强，第三阶段）
- Ember: RelationshipSystem, SocialSystem, LearningSystem, ConsciousnessSystem, DreamSystem
- Arboreus: EconomySystem, SocialSystem, TerritorySystem, BuildingSystem, WeatherSystem

### P3（优化，后续）
- 性能优化、多线程、调试工具、可视化编辑器、网络同步

## 六、注意事项

1. **不赶时间**：架构整理优先，先把API定义清楚，再写实现代码
2. **一次做好**：避免为了赶进度写临时代码，后面又推倒重来
3. **设计驱动**：战策开发必须参考设计原型图，不自己按想象搞界面
4. **数据可视化**：游戏数据以可视化形式表现，不做工业软件式数据罗列
5. **SDK优先**：战策只做应用层，核心能力完全依赖Ember/Arboreus GDExtension
6. **监控不写代码**：具体开发由Ember/Arboreus开发任务执行，监控只做协调调度
7. **CMake构建**：用CMake而非SCons，因为SCons安装失败
8. **godot-cpp绑定**：需要先克隆godot-cpp仓库，编译绑定库
