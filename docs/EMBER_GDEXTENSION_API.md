# Ember GDExtension API 定义（初稿）

> **版本**: v0.1 draft
> **日期**: 2026-09-08
> **状态**: 初稿，待细化
> **目标**: 将Ember灵魂认知引擎核心能力封装为Godot GDExtension（C++），战策（GDScript）可直接调用，无需HTTP服务器

---

## 一、设计原则

1. **简单易用**: GDScript调用像调用普通类一样简单
2. **性能优先**: 避免不必要的内存分配和拷贝
3. **异步支持**: 耗时操作（AI决策）支持异步回调
4. **数据驱动**: 灵魂数据可序列化/反序列化，支持存档
5. **信号驱动**: 状态变化通过Godot信号通知，不轮询
6. **版本兼容**: API版本化，后续升级不破坏现有调用

---

## 二、核心类定义

### 2.1 SoulData（灵魂数据）

**职责**: 存储灵魂的所有数据，包括属性、状态、记忆、个性等

**属性**:
```
- id: String (灵魂唯一ID)
- name: String (灵魂名称)
- level: int (等级)
- experience: int (经验值)
- personality: Personality (个性数据)
- emotion: EmotionState (当前情绪状态)
- memory: MemorySystem (记忆系统)
- stats: SoulStats (基础属性)
- skills: Array (技能列表)
- relationships: Dictionary (关系列表)
- created_at: int (创建时间戳)
- updated_at: int (最后更新时间戳)
```

**方法**:
```
- serialize() -> Dictionary (序列化为字典，用于存档)
- static deserialize(data: Dictionary) -> SoulData (从字典反序列化)
- clone() -> SoulData (深拷贝)
- validate() -> bool (验证数据完整性)
```

**信号**:
```
- level_up(new_level: int) (升级时触发)
- stats_changed (属性变化时触发)
- emotion_changed (情绪变化时触发)
```

---

### 2.2 Personality（个性系统）

**职责**: 定义灵魂的个性特征，影响决策倾向和行为风格

**属性**（大五人格模型 + 自定义维度）:
```
- openness: float (开放性, 0.0-1.0)
- conscientiousness: float (尽责性, 0.0-1.0)
- extraversion: float (外向性, 0.0-1.0)
- agreeableness: float (宜人性, 0.0-1.0)
- neuroticism: float (神经质, 0.0-1.0)
- aggression: float (攻击性, 0.0-1.0)
- curiosity: float (好奇心, 0.0-1.0)
- loyalty: float (忠诚度, 0.0-1.0)
- courage: float (勇气, 0.0-1.0)
- temperament: String (气质类型: sanguine/choleric/melancholic/phlegmatic)
```

**方法**:
```
- get_decision_bias(context: String) -> Dictionary (获取特定场景下的决策倾向)
- get_behavior_style() -> Dictionary (获取行为风格描述)
- randomize() (随机生成个性)
- static from_template(template_name: String) -> Personality (从模板创建)
```

---

### 2.3 EmotionState（情绪状态）

**职责**: 管理灵魂的当前情绪，影响决策和行为

**属性**（PAD情绪模型 + 基本情绪）:
```
- pleasure: float (愉悦度, -1.0 to 1.0)
- arousal: float (唤醒度, 0.0 to 1.0)
- dominance: float (支配度, -1.0 to 1.0)
- joy: float (喜悦, 0.0-1.0)
- sadness: float (悲伤, 0.0-1.0)
- anger: float (愤怒, 0.0-1.0)
- fear: float (恐惧, 0.0-1.0)
- disgust: float (厌恶, 0.0-1.0)
- surprise: float (惊讶, 0.0-1.0)
- trust: float (信任, 0.0-1.0)
- anticipation: float (期待, 0.0-1.0)
- mood: String (当前心情描述)
- mood_intensity: float (心情强度, 0.0-1.0)
```

**方法**:
```
- update(delta: float) (更新情绪状态，情绪会随时间衰减)
- trigger_emotion(emotion: String, intensity: float, source: String) (触发某种情绪)
- get_dominant_emotion() -> String (获取当前主导情绪)
- get_mood_description() -> String (获取心情描述文本)
- reset() (重置情绪到中性状态)
```

**信号**:
```
- emotion_triggered(emotion: String, intensity: float) (情绪触发时)
- mood_changed(old_mood: String, new_mood: String) (心情变化时)
```

---

### 2.4 CognitiveEngine（认知决策引擎）

**职责**: 核心认知循环，感知→决策→行动，是Ember最核心的模块

**属性**:
```
- soul: SoulData (关联的灵魂数据)
- perception: PerceptionSystem (感知系统)
- decision: DecisionSystem (决策系统)
- action: ActionSystem (行动系统)
- attention: AttentionSystem (注意力系统)
- working_memory: WorkingMemory (工作记忆)
- tick_rate: float (认知循环频率，每秒多少次)
- is_active: bool (是否活跃)
```

**方法**:
```
- start() (启动认知循环)
- stop() (停止认知循环)
- update(delta: float) (手动更新一帧，用于非自动模式)
- perceive(stimuli: Array) -> PerceptionResult (感知输入)
- decide(context: Dictionary) -> Decision (做出决策)
- act(action: Decision) -> ActionResult (执行行动)
- get_current_state() -> Dictionary (获取当前认知状态)
- set_config(config: Dictionary) (设置认知参数)
```

**信号**:
```
- decision_made(decision: Decision) (做出决策时)
- action_executed(action: ActionResult) (执行行动时)
- perception_completed(result: PerceptionResult) (感知完成时)
- state_changed (认知状态变化时)
```

---

### 2.5 MemorySystem（记忆系统）

**职责**: 管理灵魂的各种记忆，包括工作记忆、短期记忆、长期记忆、情景记忆、语义记忆等

**属性**:
```
- working_memory: Array (工作记忆，容量有限，7±2个组块)
- short_term: Array (短期记忆，几分钟到几小时)
- long_term: Array (长期记忆，永久存储)
- episodic: Array (情景记忆，具体事件的记忆)
- semantic: Array (语义记忆，知识和概念)
- procedural: Array (程序性记忆，技能和习惯)
- memory_capacity: int (记忆容量上限)
- forgetting_rate: float (遗忘速率)
```

**方法**:
```
- add_memory(memory: Memory) (添加记忆)
- get_memory(id: String) -> Memory (获取特定记忆)
- search_memories(query: String, limit: int) -> Array (搜索记忆)
- get_recent_memories(count: int) -> Array (获取最近的记忆)
- consolidate() (记忆巩固，将短期记忆转为长期记忆)
- forget() (遗忘，删除不重要的记忆)
- get_memory_summary() -> Dictionary (获取记忆摘要)
```

**信号**:
```
- memory_added(memory: Memory) (新记忆添加时)
- memory_consolidated(memory: Memory) (记忆巩固时)
- memory_forgotten(memory: Memory) (记忆被遗忘时)
```

---

### 2.6 Soul（灵魂主类）

**职责**: 整合所有子系统，提供统一的灵魂接口

**属性**:
```
- data: SoulData (灵魂数据)
- personality: Personality (个性系统)
- emotion: EmotionState (情绪状态)
- cognitive: CognitiveEngine (认知决策引擎)
- memory: MemorySystem (记忆系统)
- relationship: RelationshipSystem (关系系统)
- growth: GrowthSystem (成长系统)
- is_alive: bool (是否存活)
```

**方法**:
```
- static create(config: Dictionary) -> Soul (创建新灵魂)
- static load(path: String) -> Soul (从文件加载灵魂)
- save(path: String) (保存灵魂到文件)
- update(delta: float) (更新灵魂状态)
- perceive(stimuli: Array) (感知输入)
- decide(context: Dictionary) -> Decision (做出决策)
- get_status() -> Dictionary (获取灵魂状态摘要)
- get_description() -> String (获取灵魂描述文本)
- destroy() (销毁灵魂，释放资源)
```

**信号**:
```
- soul_updated (灵魂状态更新时)
- decision_made(decision: Decision) (做出决策时)
- level_up(new_level: int) (升级时)
- emotion_changed (情绪变化时)
- death (灵魂死亡时)
```

---

## 三、数据结构定义

### 3.1 Decision（决策结果）
```
- type: String (决策类型: attack/defend/move/interact/communicate/wait)
- target: String (目标ID)
- position: Vector2 (目标位置)
- action: String (具体动作)
- params: Dictionary (动作参数)
- confidence: float (决策置信度, 0.0-1.0)
- reasoning: String (决策理由)
- emotion_influence: Dictionary (情绪对决策的影响)
- personality_influence: Dictionary (个性对决策的影响)
```

### 3.2 PerceptionResult（感知结果）
```
- objects: Array (感知到的物体列表)
- entities: Array (感知到的实体列表)
- events: Array (感知到的事件列表)
- threats: Array (感知到的威胁列表)
- opportunities: Array (感知到的机会列表)
- attention_focus: String (注意力焦点)
- perception_quality: float (感知质量, 0.0-1.0)
```

### 3.3 Memory（记忆条目）
```
- id: String (记忆ID)
- type: String (记忆类型: episodic/semantic/procedural/working)
- content: Dictionary (记忆内容)
- timestamp: int (记忆时间戳)
- importance: float (重要性, 0.0-1.0)
- emotional_intensity: float (情绪强度, 0.0-1.0)
- recall_count: int (回忆次数)
- last_recalled: int (最后回忆时间)
- associations: Array (关联记忆ID列表)
```

### 3.4 SoulStats（灵魂基础属性）
```
- health: float (生命值)
- max_health: float (最大生命值)
- energy: float (能量值)
- max_energy: float (最大能量值)
- attack: float (攻击力)
- defense: float (防御力)
- speed: float (移动速度)
- intelligence: float (智力)
- wisdom: float (智慧)
- charisma: float (魅力)
- luck: float (幸运)
```

---

## 四、配置参数

### 4.1 CognitiveConfig（认知引擎配置）
```
- tick_rate: float (认知循环频率, 默认10Hz)
- decision_timeout: float (决策超时时间, 默认0.5秒)
- memory_capacity: int (记忆容量, 默认1000)
- forgetting_enabled: bool (是否启用遗忘, 默认true)
- emotion_decay_rate: float (情绪衰减速率, 默认0.1/秒)
- personality_influence_weight: float (个性影响权重, 默认0.3)
- emotion_influence_weight: float (情绪影响权重, 默认0.3)
- memory_influence_weight: float (记忆影响权重, 默认0.2)
- rational_influence_weight: float (理性影响权重, 默认0.2)
```

---

## 五、使用示例（GDScript）

```gdscript
# 创建灵魂
var config = {
    "name": "测试灵魂",
    "personality_template": "warrior",
    "stats": {"health": 100, "attack": 20, "defense": 10}
}
var soul = Ember.Soul.create(config)

# 连接信号
soul.decision_made.connect(_on_decision_made)
soul.emotion_changed.connect(_on_emotion_changed)

# 启动认知循环
soul.cognitive.start()

# 每帧更新
func _process(delta):
    soul.update(delta)

# 感知输入
var stimuli = [
    {"type": "enemy", "position": Vector2(100, 200), "distance": 50},
    {"type": "item", "position": Vector2(50, 100), "name": "health_potion"}
]
soul.perceive(stimuli)

# 做出决策
var context = {"battle_state": "active", "health_percent": 0.8}
var decision = soul.decide(context)
print("决策: ", decision.type, " 置信度: ", decision.confidence)

# 保存/加载
soul.save("user://souls/test_soul.ember")
var loaded_soul = Ember.Soul.load("user://souls/test_soul.ember")
```

---

## 六、待细化项

1. **PerceptionSystem**: 感知系统的详细API（视觉、听觉、触觉等）
2. **DecisionSystem**: 决策系统的详细算法（效用计算、贝叶斯推理、强化学习等）
3. **ActionSystem**: 行动系统的详细API
4. **RelationshipSystem**: 关系系统的详细API
5. **GrowthSystem**: 成长系统的详细API（经验、升级、进化）
6. **LearningSystem**: 学习系统的详细API（监督学习、强化学习、模仿学习）
7. **ConsciousnessSystem**: 意识系统的详细API（全局工作空间、整合信息理论）
8. **SocialSystem**: 社交系统的详细API（沟通、合作、竞争）
9. **DreamSystem**: 梦境系统的详细API
10. **Performance**: 性能优化策略（对象池、多线程、内存管理）
11. **Serialization**: 序列化格式定义（二进制/JSON/自定义）
12. **Debugging**: 调试工具和可视化接口
13. **Testing**: 单元测试和集成测试框架

---

## 七、迁移优先级

### P0（核心，必须先实现）
1. SoulData（灵魂数据结构）
2. Personality（个性系统）
3. EmotionState（情绪状态）
4. CognitiveEngine（认知决策引擎，基础版）
5. Soul（灵魂主类，整合以上）

### P1（重要，第二阶段实现）
1. MemorySystem（记忆系统）
2. PerceptionSystem（感知系统）
3. DecisionSystem（决策系统，完整版）
4. ActionSystem（行动系统）
5. GrowthSystem（成长系统）

### P2（增强，第三阶段实现）
1. RelationshipSystem（关系系统）
2. SocialSystem（社交系统）
3. LearningSystem（学习系统）
4. ConsciousnessSystem（意识系统）
5. DreamSystem（梦境系统）

### P3（优化，后续实现）
1. 性能优化
2. 调试工具
3. 可视化接口
4. 多线程支持
5. 高级AI算法集成

---

**本文档为初稿，后续将根据实际开发持续更新。**
**Ember现有189个认知子系统，需要逐步迁移到C++ GDExtension。**
**优先保证核心功能可用，再逐步增强。**
