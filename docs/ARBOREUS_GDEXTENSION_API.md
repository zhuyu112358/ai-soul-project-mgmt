# Arboreus GDExtension API 定义（初稿）

> **版本**: v0.1 draft
> **日期**: 2026-09-08
> **状态**: 初稿，待细化
> **目标**: 将Arboreus世界引擎核心能力封装为Godot GDExtension（C++），战策（GDScript）可直接调用

---

## 一、设计原则

1. **性能优先**: 世界模拟可能涉及大量实体，必须高效
2. **数据导向**: 采用ECS（实体-组件-系统）架构，缓存友好
3. **空间分区**: 高效的空间查询和碰撞检测
4. **事件驱动**: 状态变化通过事件通知，不轮询
5. **可扩展**: 支持自定义组件和系统
6. **确定性**: 相同输入产生相同输出，支持回放和多人同步

---

## 二、核心类定义

### 2.1 World（世界主类）

**职责**: 管理整个世界，包含实体、系统、事件、时间等

**属性**:
```
- entities: EntityManager (实体管理器)
- systems: SystemManager (系统管理器)
- events: EventBus (事件总线)
- spatial: SpatialIndex (空间索引)
- clock: WorldClock (世界时钟)
- config: WorldConfig (世界配置)
- is_running: bool (是否运行中)
```

**方法**:
```
- static create(config: WorldConfig) -> World (创建新世界)
- static load(path: String) -> World (从文件加载世界)
- save(path: String) (保存世界到文件)
- start() (启动世界模拟)
- stop() (停止世界模拟)
- update(delta: float) (更新一帧)
- create_entity() -> Entity (创建新实体)
- remove_entity(id: int) (移除实体)
- get_entity(id: int) -> Entity (获取实体)
- query_entities(filter: QueryFilter) -> Array (查询实体)
- emit_event(event: Event) (发送事件)
- subscribe(event_type: String, callback: Callable) (订阅事件)
- get_status() -> Dictionary (获取世界状态摘要)
- destroy() (销毁世界，释放资源)
```

**信号**:
```
- entity_created(entity: Entity)
- entity_removed(entity_id: int)
- event_emitted(event: Event)
- world_updated (世界更新时)
- simulation_started
- simulation_stopped
```

---

### 2.2 Entity（实体）

**职责**: ECS中的实体，只是一个ID，通过组件附加数据

**属性**:
```
- id: int (实体唯一ID)
- name: String (实体名称)
- tags: Array (标签列表，用于快速筛选)
- active: bool (是否活跃)
- components: Dictionary (组件字典，key=组件类型, value=组件数据)
```

**方法**:
```
- add_component(type: String, data: Dictionary) (添加组件)
- remove_component(type: String) (移除组件)
- get_component(type: String) -> Dictionary (获取组件数据)
- has_component(type: String) -> bool (是否有某组件)
- get_component_types() -> Array (获取所有组件类型)
- set_tag(tag: String) (添加标签)
- remove_tag(tag: String) (移除标签)
- has_tag(tag: String) -> bool (是否有某标签)
- clone() -> Entity (克隆实体)
```

---

### 2.3 内置组件类型

#### Transform2D（2D变换组件）
```
- position: Vector2 (位置)
- rotation: float (旋转角度，弧度)
- scale: Vector2 (缩放)
- velocity: Vector2 (速度)
- angular_velocity: float (角速度)
```

#### Collider2D（2D碰撞体组件）
```
- shape: String (形状: circle/rectangle/polygon)
- radius: float (圆形半径)
- size: Vector2 (矩形尺寸)
- points: Array (多边形顶点)
- is_trigger: bool (是否是触发器，不产生物理碰撞)
- collision_layer: int (碰撞层，位掩码)
- collision_mask: int (碰撞掩码，位掩码)
- friction: float (摩擦系数)
- bounciness: float (弹性系数)
```

#### Health（生命值组件）
```
- current: float (当前生命值)
- max: float (最大生命值)
- regeneration: float (每秒回复)
- invulnerable: bool (是否无敌)
- last_damage_time: int (最后受击时间)
```

#### Movement（移动组件）
```
- speed: float (移动速度)
- acceleration: float (加速度)
- deceleration: float (减速度)
- max_speed: float (最大速度)
- target_position: Vector2 (目标位置)
- path: Array (当前路径)
- path_index: int (当前路径点索引)
- is_moving: bool (是否移动中)
```

#### AI（AI组件）
```
- type: String (AI类型: idle/patrol/chase/attack/flee)
- state: String (当前状态)
- target_id: int (目标实体ID)
- detection_range: float (侦测范围)
- attack_range: float (攻击范围)
- decision_interval: float (决策间隔，秒)
- last_decision_time: int (最后决策时间)
```

---

### 2.4 SpatialIndex（空间索引）

**职责**: 高效的空间查询，支持范围查询、最近邻查询、碰撞检测

**方法**:
```
- insert(entity_id: int, position: Vector2, bounds: Rect2) (插入实体)
- remove(entity_id: int) (移除实体)
- update(entity_id: int, position: Vector2, bounds: Rect2) (更新实体位置)
- query_range(center: Vector2, radius: float) -> Array (圆形范围查询)
- query_rect(rect: Rect2) -> Array (矩形范围查询)
- query_nearest(position: Vector2, max_distance: float, max_count: int) -> Array (最近邻查询)
- query_collisions(entity_id: int) -> Array (查询与某实体碰撞的所有实体)
- get_all_in_layer(layer: int) -> Array (获取某层的所有实体)
- clear() (清空空间索引)
```

---

### 2.5 Pathfinder（路径寻路）

**职责**: A*寻路系统，支持网格地图和导航网格

**属性**:
```
- grid: GridMap (网格地图)
- obstacle_layer: int (障碍物碰撞层)
- agent_radius: float (智能体半径，用于路径平滑)
- allow_diagonal: bool (是否允许对角移动)
- heuristic_weight: float (启发式权重)
```

**方法**:
```
- set_grid(grid: GridMap) (设置网格地图)
- find_path(start: Vector2, goal: Vector2) -> Array (寻找路径，返回路径点数组)
- find_path_async(start: Vector2, goal: Vector2, callback: Callable) (异步寻路)
- is_walkable(position: Vector2) -> bool (某位置是否可行走)
- set_walkable(position: Vector2, walkable: bool) (设置某位置是否可行走)
- smooth_path(path: Array) -> Array (路径平滑)
- get_path_length(path: Array) -> float (计算路径长度)
- cancel_async() (取消异步寻路)
```

**信号**:
```
- path_found(path: Array) (找到路径时)
- path_not_found(reason: String) (找不到路径时)
```

---

### 2.6 GridMap（网格地图）

**职责**: 2D网格地图，用于路径寻路和空间分区

**属性**:
```
- width: int (网格宽度，格数)
- height: int (网格高度，格数)
- cell_size: float (每格大小，像素)
- cells: Array (二维数组，存储每格的数据)
- origin: Vector2 (网格原点，世界坐标)
```

**方法**:
```
- static create(width: int, height: int, cell_size: float) -> GridMap (创建网格)
- world_to_grid(world_pos: Vector2) -> Vector2i (世界坐标转网格坐标)
- grid_to_world(grid_pos: Vector2i) -> Vector2 (网格坐标转世界坐标)
- get_cell(x: int, y: int) -> Dictionary (获取格子数据)
- set_cell(x: int, y: int, data: Dictionary) (设置格子数据)
- is_walkable(x: int, y: int) -> bool (某格是否可行走)
- set_walkable(x: int, y: int, walkable: bool) (设置某格是否可行走)
- get_neighbors(x: int, y: int, allow_diagonal: bool) -> Array (获取相邻格子)
- clear() (清空网格)
```

---

### 2.7 EventBus（事件总线）

**职责**: 发布-订阅模式的事件系统，解耦各系统

**方法**:
```
- emit(event: Event) (发送事件)
- subscribe(event_type: String, callback: Callable) -> int (订阅事件，返回订阅ID)
- unsubscribe(subscription_id: int) (取消订阅)
- subscribe_once(event_type: String, callback: Callable) (只订阅一次)
- get_subscriber_count(event_type: String) -> int (获取某事件的订阅者数量)
- clear() (清空所有订阅)
- process_queue() (处理事件队列，用于延迟事件)
```

---

### 2.8 Event（事件）

**职责**: 事件数据结构

**属性**:
```
- type: String (事件类型)
- source_id: int (发送者实体ID)
- target_id: int (目标实体ID，-1表示无特定目标)
- data: Dictionary (事件数据)
- timestamp: int (事件时间戳)
- priority: int (事件优先级，数字越大越优先)
- is_cancelled: bool (是否已取消)
```

**方法**:
```
- static create(type: String, data: Dictionary) -> Event (创建事件)
- cancel() (取消事件)
```

---

### 2.9 PhysicsSystem（物理系统）

**职责**: 2D物理模拟，包括碰撞检测和响应

**方法**:
```
- update(delta: float) (更新物理模拟)
- add_body(entity_id: int) (添加物理体)
- remove_body(entity_id: int) (移除物理体)
- check_collision(entity_id_a: int, entity_id_b: int) -> bool (检测两个实体是否碰撞)
- get_collisions(entity_id: int) -> Array (获取与某实体碰撞的所有实体)
- ray_cast(start: Vector2, end: Vector2, layer: int) -> RayCastResult (射线检测)
- overlap_circle(center: Vector2, radius: float, layer: int) -> Array (圆形重叠检测)
- overlap_rect(rect: Rect2, layer: int) -> Array (矩形重叠检测)
- set_gravity(gravity: Vector2) (设置重力)
- get_gravity() -> Vector2 (获取重力)
```

**信号**:
```
- collision_started(entity_a: int, entity_b: int, normal: Vector2)
- collision_ended(entity_a: int, entity_b: int)
- trigger_entered(entity_id: int, trigger_id: int)
- trigger_exited(entity_id: int, trigger_id: int)
```

---

### 2.10 MovementSystem（移动系统）

**职责**: 处理实体移动，包括路径跟随、转向、速度控制

**方法**:
```
- update(delta: float) (更新移动系统)
- move_towards(entity_id: int, target: Vector2, speed: float) (移向目标)
- follow_path(entity_id: int, path: Array, speed: float) (沿路径移动)
- stop(entity_id: int) (停止移动)
- set_speed(entity_id: int, speed: float) (设置速度)
- get_velocity(entity_id: int) -> Vector2 (获取速度)
- apply_force(entity_id: int, force: Vector2) (施加力)
- apply_impulse(entity_id: int, impulse: Vector2) (施加冲量)
```

---

### 2.11 WorldClock（世界时钟）

**职责**: 管理世界时间，支持时间缩放、暂停、昼夜循环

**属性**:
```
- time: float (世界时间，秒)
- delta: float (当前帧时间差)
- time_scale: float (时间缩放，1.0=正常速度)
- is_paused: bool (是否暂停)
- day_length: float (一天长度，秒)
- day_time: float (当天时间，0到day_length)
- day_count: int (天数)
```

**方法**:
```
- update(real_delta: float) (更新时钟)
- pause() (暂停)
- resume() (恢复)
- set_time_scale(scale: float) (设置时间缩放)
- get_time_of_day() -> String (获取一天中的时间描述: 黎明/上午/中午/下午/黄昏/夜晚/深夜)
- is_daytime() -> bool (是否白天)
- is_nighttime() -> bool (是否夜晚)
- reset() (重置时钟)
```

**信号**:
```
- day_started(day: int)
- night_started(day: int)
- hour_passed(hour: int)
- time_scale_changed(old_scale: float, new_scale: float)
- paused
- resumed
```

---

## 三、内置事件类型

```
- entity_created (实体创建)
- entity_destroyed (实体销毁)
- entity_moved (实体移动)
- collision_started (碰撞开始)
- collision_ended (碰撞结束)
- trigger_entered (进入触发器)
- trigger_exited (离开触发器)
- damage_dealt (造成伤害)
- entity_died (实体死亡)
- path_found (找到路径)
- path_not_found (找不到路径)
- ai_state_changed (AI状态变化)
- day_started (白天开始)
- night_started (夜晚开始)
- custom (自定义事件)
```

---

## 四、使用示例（GDScript）

```gdscript
# 创建世界
var config = Arboreus.WorldConfig.new()
config.width = 1280
config.height = 720
config.cell_size = 32
var world = Arboreus.World.create(config)

# 连接信号
world.entity_created.connect(_on_entity_created)
world.event_emitted.connect(_on_event)

# 创建玩家实体
var player = world.create_entity()
player.name = "Player"
player.add_component("Transform2D", {"position": Vector2(100, 100)})
player.add_component("Collider2D", {"shape": "circle", "radius": 16, "collision_layer": 1})
player.add_component("Health", {"current": 100, "max": 100})
player.add_component("Movement", {"speed": 200, "max_speed": 300})

# 创建敌人实体
var enemy = world.create_entity()
enemy.name = "Enemy"
enemy.add_component("Transform2D", {"position": Vector2(500, 300)})
enemy.add_component("Collider2D", {"shape": "circle", "radius": 20, "collision_layer": 2})
enemy.add_component("Health", {"current": 80, "max": 80})
enemy.add_component("AI", {"type": "chase", "detection_range": 200, "attack_range": 50})

# 设置网格地图用于寻路
var grid = Arboreus.GridMap.create(40, 23, 32)
world.pathfinder.set_grid(grid)

# 每帧更新
func _process(delta):
    world.update(delta)

# 玩家移动
func _input(event):
    if event is InputEventKey and event.pressed:
        if event.keycode == KEY_W:
            world.movement_system.move_towards(player.id, player.get_component("Transform2D").position + Vector2(0, -50), 200)

# 敌人寻路到玩家
var path = world.pathfinder.find_path(
    enemy.get_component("Transform2D").position,
    player.get_component("Transform2D").position
)
world.movement_system.follow_path(enemy.id, path, 150)

# 发送事件
var damage_event = Arboreus.Event.create("damage_dealt", {
    "amount": 20,
    "source": player.id,
    "target": enemy.id
})
world.emit_event(damage_event)

# 订阅事件
world.subscribe("entity_died", func(event):
    print("实体死亡: ", event.data.entity_name)
)

# 空间查询
var nearby = world.spatial.query_range(player.get_component("Transform2D").position, 100)
print("附近有 ", nearby.size(), " 个实体")

# 射线检测
var hit = world.physics.ray_cast(Vector2(0, 0), Vector2(1280, 720), 1)
if hit.has_hit:
    print("射线命中: ", hit.entity_id)

# 保存/加载
world.save("user://worlds/test_world.arb")
var loaded_world = Arboreus.World.load("user://worlds/test_world.arb")
```

---

## 五、待细化项

1. **ECS架构**: 完整的ECS实现细节（组件存储、系统调度、缓存优化）
2. **PhysicsSystem**: 完整的2D物理引擎（刚体、约束、连续碰撞检测）
3. **NavigationMesh**: 导航网格支持（不仅限于网格地图）
4. **SteeringBehaviors**: 群体行为（分离、对齐、凝聚、躲避、追逐、逃跑）
5. **FlockingSystem**: 集群系统（鸟群、鱼群）
6. **FormationSystem**: 阵型系统
7. **PerceptionSystem**: AI感知系统（视觉、听觉、嗅觉）
8. **BehaviorTree**: 行为树系统
9. **StateMachine**: 状态机系统
10. **UtilityAI**: 效用AI系统
11. **EconomySystem**: 经济系统（资源、生产、交易、市场）
12. **SocialSystem**: 社交系统（关系、声誉、派系、文化）
13. **TerritorySystem**: 领土系统
14. **BuildingSystem**: 建筑系统
15. **ResourceSystem**: 资源系统
16. **WeatherSystem**: 天气系统
17. **DayNightCycle**: 昼夜循环
18. **NarrativeSystem**: 叙事系统
19. **QuestSystem**: 任务系统
20. **DialogueSystem**: 对话系统
21. **SoundSystem**: 声音系统
22. **Persistence**: 持久化系统（存档、加载、序列化）
23. **Networking**: 网络同步（多人游戏）
24. **Performance**: 性能优化（多线程、对象池、空间分区优化）
25. **Debugging**: 调试工具（可视化、性能分析、实体检查器）

---

## 六、迁移优先级

### P0（核心，必须先实现）
1. World（世界主类）
2. Entity（实体）
3. 内置组件（Transform2D, Collider2D, Health, Movement, AI）
4. SpatialIndex（空间索引）
5. Pathfinder（路径寻路，A*）
6. GridMap（网格地图）
7. EventBus（事件总线）
8. Event（事件）
9. PhysicsSystem（物理系统，基础碰撞检测）
10. MovementSystem（移动系统）

### P1（重要，第二阶段实现）
1. WorldClock（世界时钟）
2. SteeringBehaviors（群体行为）
3. PerceptionSystem（AI感知系统）
4. BehaviorTree（行为树）
5. StateMachine（状态机）
6. UtilityAI（效用AI）
7. NavigationMesh（导航网格）
8. Persistence（持久化系统）

### P2（增强，第三阶段实现）
1. EconomySystem（经济系统）
2. SocialSystem（社交系统）
3. TerritorySystem（领土系统）
4. BuildingSystem（建筑系统）
5. ResourceSystem（资源系统）
6. WeatherSystem（天气系统）
7. NarrativeSystem（叙事系统）
8. QuestSystem（任务系统）
9. DialogueSystem（对话系统）
10. FlockingSystem（集群系统）
11. FormationSystem（阵型系统）

### P3（优化，后续实现）
1. 完整物理引擎
2. 网络同步
3. 性能优化（多线程）
4. 调试工具
5. 可视化编辑器
6. SoundSystem（声音系统）

---

**本文档为初稿，后续将根据实际开发持续更新。**
**Arboreus现有44个子系统，需要逐步迁移到C++ GDExtension。**
**优先保证核心功能可用，再逐步增强。**
