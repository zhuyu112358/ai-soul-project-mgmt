# Ember GDExtension API 定义

> **版本**: v0.4
> **日期**: 2026-09-08
> **状态**: P0+P1+P2+P3 全部21个类已实现，243测试全通过
> **目标**: 将Ember灵魂认知引擎核心能力封装为Godot GDExtension（C++），战策（GDScript）可直接调用，无需HTTP服务器
> **构建**: CMake + MSVC, Release DLL ~1142KB, 21个注册类

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

### 2.7 PerceptionSystem（感知系统）

**职责**: 多模态感知处理，包括视觉、听觉、触觉，含注意力过滤和刺激分类

**属性**:
```
- visual_range: float (视觉范围)
- auditory_range: float (听觉范围)
- tactile_range: float (触觉范围)
- attention_focus: String (当前注意力焦点)
- attention_threshold: float (注意力阈值, 0.0-1.0)
- perception_quality: float (整体感知质量, 0.0-1.0)
- visual_buffer: Array (视觉缓冲)
- auditory_buffer: Array (听觉缓冲)
- tactile_buffer: Array (触觉缓冲)
```

**方法**:
```
- perceive(stimuli: Array) -> Dictionary (处理一批刺激)
- process_visual(stimulus: Dictionary) -> Dictionary (处理单个视觉刺激)
- process_auditory(stimulus: Dictionary) -> Dictionary (处理单个听觉刺激)
- process_tactile(stimulus: Dictionary) -> Dictionary (处理单个触觉刺激)
- set_attention_focus(target: String) (设置注意力焦点)
- get_attention_focus() -> String
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- stimulus_detected(stimulus: Dictionary)
- attention_shifted(old_focus: String, new_focus: String)
- threat_detected(threat: Dictionary)
```

---

### 2.8 DecisionSystem（决策系统，完整版）

**职责**: 多种决策模式，包括效用计算、贝叶斯推理、强化学习（Q-learning）、混合模式

**属性**:
```
- decision_mode: String (决策模式: utility/bayesian/reinforcement/hybrid)
- selection_strategy: String (选择策略: greedy/epsilon_greedy/softmax)
- exploration_rate: float (探索率, epsilon_greedy用)
- temperature: float (温度参数, softmax用)
- learning_rate: float (Q学习学习率 α)
- discount_factor: float (Q学习折扣因子 γ)
- q_table: Dictionary (Q值表: state_key -> {action -> q_value})
- decision_history: Array (决策历史, 最多100条)
```

**方法**:
```
- set_decision_mode(mode: String)
- get_decision_mode() -> String
- set_selection_strategy(strategy: String)
- decide(context: Dictionary, actions: Array) -> Dictionary (做出决策, 返回{action, confidence, scores, reasoning})
- bayesian_decide(context: Dictionary, actions: Array) -> Dictionary (贝叶斯决策)
- reinforcement_decide(state: String, actions: Array) -> Dictionary (Q学习决策)
- update_q_value(state: String, action: String, reward: float, next_state: String, discount: float) (Q值更新)
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- decision_made(action: String, confidence: float)
- action_selected(action: Dictionary)
- q_value_updated(state: String, action: String, new_value: float)
- exploration_triggered()
```

---

### 2.9 ActionSystem（行动系统）

**职责**: 行动执行管理，包括行动队列、冷却、成本估算、结果反馈

**属性**:
```
- action_queue: Array (待执行行动队列)
- current_action: Dictionary (当前执行中的行动)
- is_executing: bool (是否正在执行)
- action_progress: float (当前行动进度 0.0-1.0)
- action_history: Array (行动历史, 最多50条)
- cooldowns: Dictionary (行动冷却: type -> remaining_time)
- energy_cost_multiplier: float (能量成本倍率)
- max_queue_size: int (队列最大容量, 默认10)
```

**方法**:
```
- execute_action(action: Dictionary) -> Dictionary (立即执行行动, 返回结果)
- queue_action(action: Dictionary) (加入队列)
- process_queue(delta: float) -> Dictionary (处理队列, 执行下一个)
- cancel_current() (取消当前行动)
- clear_queue() (清空队列)
- is_action_available(action_type: String) -> bool (检查冷却)
- get_cooldown(action_type: String) -> float
- set_cooldown(action_type: String, duration: float)
- update_cooldowns(delta: float)
- estimate_cost(action: Dictionary) -> Dictionary (估算{energy, risk, duration})
- can_execute(action: Dictionary) -> bool (可行性检查)
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**支持的行动类型**: attack, defend, move, interact, communicate, wait, flee, use_item, cast, harvest, build

**信号**:
```
- action_started(action: Dictionary)
- action_completed(result: Dictionary)
- action_failed(action: Dictionary, reason: String)
- action_cancelled(action: Dictionary)
- queue_emptied()
- cooldown_started(action_type: String, duration: float)
```

---

### 2.10 GrowthSystem（成长系统）

**职责**: 经验值、等级、技能点、属性点、天赋、进化阶段

**属性**:
```
- level: int (当前等级, 默认1)
- experience: int (当前等级经验)
- total_experience: int (累计总经验)
- experience_to_next: int (升级所需经验)
- skill_points: int (可用技能点)
- attribute_points: int (可用属性点)
- evolution_stage: int (进化阶段 0-4)
- evolution_name: String (进化阶段名称: Infant/Adolescent/Adult/Elder/Transcendent)
- talents: Dictionary (已解锁天赋: talent_id -> bool)
- unlocked_skills: Array (已解锁技能)
- attributes: Dictionary (6种基础属性: strength/agility/intelligence/vitality/wisdom/charisma)
- level_curve: String (升级曲线: linear/quadratic/exponential)
- base_exp: int (基础经验需求, 默认100)
```

**方法**:
```
- add_experience(amount: int) -> Dictionary (添加经验, 可能触发升级)
- level_up() -> Dictionary (强制升级)
- get_level() -> int
- get_experience_progress() -> float (0.0-1.0)
- calculate_exp_for_level(target_level: int) -> int
- spend_attribute_point(attribute: String, amount: int) -> bool
- spend_skill_point(skill: String) -> bool
- get_attribute_value(attribute: String) -> int
- unlock_talent(talent_id: String) -> bool
- has_talent(talent_id: String) -> bool
- can_evolve() -> bool (进化条件: 等级10/25/50/100)
- evolve() -> Dictionary (进化, 奖励10属性点+3技能点)
- get_growth_summary() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- level_up(new_level: int, skill_points: int, attribute_points: int)
- experience_gained(amount: int, current: int, to_next: int)
- attribute_spent(attribute: String, amount: int)
- skill_unlocked(skill: String)
- talent_unlocked(talent_id: String)
- evolution_triggered(stage: int, name: String)
```

---

### 2.11 RelationshipSystem（关系系统）

**职责**: 管理与其他灵魂/实体的关系，包括信任、尊重、熟悉度、亲和力、恐惧、感激

**属性**:
```
- relationships: Dictionary (target_id -> 关系数据)
- interaction_history: Array (全局交互历史, 最多200条)
- default_attitude: String (默认态度)
- max_relationships: int (最大关系数, 默认100)
```

**关系类型**: friend, enemy, neutral, ally, rival, mentor, student, lover, family

**关系属性**: trust, respect, familiarity, affinity, fear, gratitude (均为 -1.0 到 1.0)

**态度类型**: friendly, cautious, hostile, contemptuous, affectionate, afraid, trusting, neutral

**方法**:
```
- add_relationship(target_id: String, target_name: String, relation_type: String) -> Dictionary
- remove_relationship(target_id: String) -> bool
- get_relationship(target_id: String) -> Dictionary
- has_relationship(target_id: String) -> bool
- update_relationship(target_id: String, changes: Dictionary) -> Dictionary
- interact(target_id: String, interaction: Dictionary) -> Dictionary (交互更新关系, 自动创建关系)
- get_trust(target_id: String) -> float
- get_relationships_by_type(relation_type: String) -> Array
- get_closest_relationships(count: int) -> Array (按亲密度排序)
- get_threats() -> Array (高恐惧/低信任/敌人)
- get_allies() -> Array (高信任/盟友/朋友/家人)
- calculate_attitude(target_id: String) -> String
- get_relationship_summary() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- relationship_added(target_id: String, relation_type: String)
- relationship_removed(target_id: String)
- relationship_changed(target_id: String, changes: Dictionary)
- relation_type_changed(target_id: String, old_type: String, new_type: String)
- interaction_processed(target_id: String, interaction: Dictionary)
```

---

### 2.12 SocialSystem（社交系统）

**职责**: 群体成员资格、声誉、社会地位、影响力、社交规范、社交网络

**属性**:
```
- groups: Dictionary (group_id -> {name, role, joined_at})
- reputation: Dictionary (group_id -> 声誉值 -1.0 到 1.0)
- social_network: Dictionary (entity_id -> {type, strength})
- norms: Array (社交规范: {name, importance, compliance})
- social_events: Array (社交事件历史, 最多100条)
- social_status: float (社会地位 0-100, 自动计算)
- influence: float (影响力 0-100, 自动计算)
```

**群体角色**: novice, member, elder, officer, leader

**社会等级**: outcast, obscure, known, established, respected, legendary

**方法**:
```
- join_group(group_id: String, group_name: String) -> Dictionary
- leave_group(group_id: String) -> bool
- is_member_of(group_id: String) -> bool
- set_group_role(group_id: String, role: String) -> Dictionary
- update_reputation(group_id: String, delta: float) -> Dictionary
- get_reputation(group_id: String) -> float
- get_average_reputation() -> float
- add_connection(entity_id: String, connection_type: String, strength: float)
- remove_connection(entity_id: String) -> bool
- add_norm(norm_name: String, importance: float)
- remove_norm(norm_name: String) -> bool
- update_norm_compliance(norm_name: String, delta: float)
- add_social_event(event: Dictionary)
- calculate_social_standing() -> Dictionary (含social_tier)
- get_social_status() -> float
- get_influence() -> float
- get_social_summary() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- group_joined(group_id: String, group_name: String)
- group_left(group_id: String)
- reputation_changed(group_id: String, new_value: float, delta: float)
- social_event_added(event: Dictionary)
- norm_added(norm_name: String)
- status_changed(new_status: float, old_status: float)
```

---

### 2.13 LearningSystem（学习系统）

**职责**: 技能习得、知识积累、练习、精通度、遗忘曲线

**属性**:
```
- skills: Dictionary (skill_id -> {name, category, level, experience, mastery, practice_count})
- knowledge: Dictionary (topic -> {understanding, confidence, review_count, last_reviewed})
- learning_rate: float (学习速率倍率, 默认1.0)
- focus_level: float (专注度 0.0-1.0, 默认0.5)
- learning_style: String (学习风格: visual/auditory/kinesthetic/reading/balanced)
- learning_history: Array (学习历史, 最多100条)
```

**方法**:
```
- learn_skill(skill_id: String, skill_name: String, category: String) -> Dictionary
- practice_skill(skill_id: String, amount: float) -> Dictionary (练习, 获得经验)
- get_skill(skill_id: String) -> Dictionary
- get_skill_level(skill_id: String) -> int
- get_skill_mastery(skill_id: String) -> float (0.0-1.0)
- has_skill(skill_id: String) -> bool
- get_skills_by_category(category: String) -> Array
- get_top_skills(count: int) -> Array (按精通度排序)
- add_knowledge(topic: String, understanding: float) -> Dictionary
- review_knowledge(topic: String) -> Dictionary (复习, 提升信心)
- has_knowledge(topic: String) -> bool
- apply_forgetting(delta_time: float) (艾宾浩斯遗忘曲线)
- calculate_learning_efficiency() -> float
- get_learning_summary() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- skill_learned(skill_id: String, skill_name: String)
- skill_leveled_up(skill_id: String, new_level: int)
- knowledge_gained(topic: String, understanding: float)
- mastery_achieved(skill_id: String, mastery: float)
- forgetting_applied()
```

---

### 2.14 ConsciousnessSystem（意识系统）

**职责**: 自我觉知、注意力分配、内省、思维流、心理状态、冥想

**属性**:
```
- awareness_level: float (自我觉知 0.0-1.0)
- arousal_level: float (觉醒度 0.0-1.0)
- introspection_depth: float (内省深度 0.0-1.0)
- attention_capacity: float (注意力容量, 默认1.0)
- attention_focus: String (当前注意力焦点)
- attention_intensity: float (注意力强度 0.0-1.0)
- thought_stream: Array (思维流, 最多50条)
- thought_count: int (总思维数)
- mental_state: String (心理状态)
- self_reflection_history: Array (内省历史, 最多30条)
```

**心理状态**: anxious, depressed, alert, drowsy, contemplative, unaware, calm, neutral

**意识等级**: subconscious, semi_conscious, conscious, self_aware, transcendent

**方法**:
```
- focus_attention(target: String, intensity: float) -> Dictionary
- release_attention() -> Dictionary
- set_awareness_level(level: float)
- get_awareness_level() -> float
- set_arousal_level(level: float)
- get_arousal_level() -> float
- generate_thought(context: Dictionary) -> Dictionary (生成思维, 含clarity)
- get_thought_stream(limit: int) -> Array
- introspect(topic: String) -> Dictionary (内省, 返回insight)
- set_introspection_depth(depth: float)
- get_introspection_depth() -> float
- update_mental_state(emotion: Dictionary, stress: float) -> String
- get_mental_state() -> String
- meditate(duration: float) -> Dictionary (冥想: 提升觉知+内省, 降低觉醒)
- get_consciousness_summary() -> Dictionary (含consciousness_level)
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- thought_generated(thought: Dictionary)
- attention_shifted(old_focus: String, new_focus: String)
- awareness_changed(new_level: float)
- introspection_completed(topic: String, insight: Dictionary)
- mental_state_changed(old_state: String, new_state: String)
```

---

### 2.15 DreamSystem（梦境系统）

**职责**: 梦境生成、记忆巩固、潜意识处理、梦境解析、睡眠周期

**属性**:
```
- is_dreaming: bool (是否正在做梦)
- dream_intensity: float (梦境强度 0.0-1.0)
- dream_vividness: float (梦境逼真度 0.0-1.0)
- current_dream: Dictionary (当前梦境)
- sleep_stage: String (睡眠阶段: wake/light/deep/rem)
- memory_consolidation_rate: float (记忆巩固率, 默认0.7)
- processed_memories: int (已巩固记忆数)
- subconscious_content: Array (潜意识内容, 最多100条)
- dream_history: Array (梦境历史, 最多50条)
- total_dreams: int (总做梦次数)
```

**梦境类型**: nightmare, pleasant, anxious, lucid, surreal, ordinary

**梦境主题**: flying, falling, being_chased, lost, water, heights, exams, childhood_home, unknown_city, forest

**方法**:
```
- start_dream(context: Dictionary) -> Dictionary (开始做梦)
- end_dream() -> Dictionary (结束做梦, 返回insights)
- generate_dream_element(theme: String) -> Dictionary (生成梦境元素)
- get_current_dream() -> Dictionary
- get_is_dreaming() -> bool
- get_dream_history(limit: int) -> Array
- interpret_dream(dream: Dictionary) -> Dictionary (解梦: 心理功能+含义+建议)
- consolidate_memories(memories: Array) -> Dictionary (记忆巩固, 概率基于重要性+情绪)
- set_consolidation_rate(rate: float)
- get_consolidation_rate() -> float
- process_subconscious(content: Dictionary) -> Dictionary (潜意识处理)
- get_subconscious_content() -> Array
- set_sleep_stage(stage: String)
- get_sleep_stage() -> String
- get_dream_intensity() -> float
- get_dream_vividness() -> float
- get_dream_summary() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary)
```

**信号**:
```
- dream_started(dream: Dictionary)
- dream_ended(dream: Dictionary, insights: Dictionary)
- memory_consolidated(memory: Dictionary)
- subconscious_processed(content: Dictionary)
- sleep_stage_changed(old_stage: String, new_stage: String)
```

---

### 2.16 SoulPool（灵魂对象池）

**职责**: 高效复用Soul实例，避免频繁创建/销毁的性能开销

**方法**:
```
- initialize(pool_size: int, config: Dictionary) -> void (预创建指定数量的Soul)
- acquire() -> Soul (从池中获取一个Soul，池空时返回null)
- acquire_with_config(config: Dictionary) -> Soul (获取并用配置初始化)
- release(soul: Soul) -> void (将Soul归还池中，自动reset)
- release_all() -> void (归还所有Soul)
- resize(new_size: int) -> void (调整池大小)
- clear() -> void (清空池)
- get_pool_size() -> int (池总容量)
- get_active_count() -> int (当前使用中数量)
- get_available_count() -> int (可用数量)
```

**信号**:
```
- pool_exhausted()
- pool_grew(old_size: int, new_size: int)
- soul_acquired(soul: Soul)
- soul_released(soul: Soul)
```

**性能**: 1000次acquire+release仅7ms（7µs/次）

---

### 2.17 GoalPlanner（目标导向行动规划 GOAP）

**职责**: A*搜索的目标导向行动规划系统，为NPC生成达成目标的行动序列

**方法**:
```
- add_action(name: String, preconditions: Dictionary, effects: Dictionary, cost: float) -> void
- remove_action(name: String) -> void
- has_action(name: String) -> bool
- get_action_count() -> int
- plan(start_state: Dictionary, goal: Dictionary) -> Dictionary
  返回: {success: bool, actions: Array, total_cost: float, iterations: int, final_state: Dictionary, reason: String}
- static state_matches(state: Dictionary, conditions: Dictionary) -> bool
- static merge_state(base: Dictionary, changes: Dictionary) -> Dictionary
```

**示例**:
```gdscript
var planner = GoalPlanner.new()
planner.add_action("draw_weapon", {"weapon_drawn": false}, {"weapon_drawn": true}, 1.0)
planner.add_action("approach", {"enemy_in_range": false}, {"enemy_in_range": true}, 1.5)
planner.add_action("attack", {"enemy_in_range": true, "weapon_drawn": true}, {"enemy_hp_reduced": true}, 1.0)
var result = planner.plan({"weapon_drawn": false, "enemy_in_range": false}, {"enemy_hp_reduced": true})
# result.actions = ["draw_weapon", "approach", "attack"], total_cost = 3.5
```

**性能**: 30µs/plan（典型战斗场景）

---

### 2.18 BayesianNetwork（贝叶斯网络）

**职责**: 概率图模型，用于不确定性推理和威胁评估

**方法**:
```
- add_node(name: String, states: Array) -> void
- add_node_with_parents(name: String, states: Array, parents: Array) -> void
- remove_node(name: String) -> void
- has_node(name: String) -> bool
- get_node_count() -> int
- get_node_names() -> Array
- get_node_states(name: String) -> Array
- get_node_parents(name: String) -> Array
- set_probability(node: String, state: String, parent_values: Dictionary, prob: float) -> void
- set_cpt_row(node: String, parent_values: Dictionary, probabilities: Array) -> void
- get_probability(node: String, state: String, parent_values: Dictionary) -> float
- set_evidence(node: String, state: String) -> void
- set_evidence_dict(evidence: Dictionary) -> void
- clear_evidence(node: String) -> void
- clear_all_evidence() -> void
- get_evidence() -> Dictionary
- has_evidence(node: String) -> bool
- query(node: String) -> Dictionary (各状态概率分布)
- query_state(node: String, state: String) -> float (单状态概率)
- get_mpe() -> Dictionary (最可能解释，含_probability)
- static normalize_probabilities(probs: Dictionary) -> Dictionary
- to_string() -> String
```

**示例**:
```gdscript
var bn = BayesianNetwork.new()
bn.add_node("EnemyVisible", ["yes", "no"])
bn.add_node_with_parents("EnemyAttacking", ["yes", "no"], ["EnemyVisible"])
bn.set_cpt_row("EnemyAttacking", {"EnemyVisible": "yes"}, [0.6, 0.4])
bn.set_evidence("PlayerInDanger", "high")
var p = bn.query_state("EnemyAttacking", "yes")  # 0.703
```

**性能**: 20µs/query（枚举推理+拓扑排序）

---

### 2.19 RLAgent（强化学习智能体）

**职责**: Q-learning强化学习，带经验回放和epsilon-greedy探索，NPC可自适应学习最优策略

**超参数**:
```
- learning_rate (alpha, 默认0.1)
- discount_factor (gamma, 默认0.95)
- epsilon (探索率, 默认1.0)
- epsilon_min (默认0.05)
- epsilon_decay (默认0.995)
- buffer_capacity (经验回放容量, 默认10000)
```

**方法**:
```
- choose_action(state: String, available_actions: Array) -> String (epsilon-greedy)
- choose_best_action(state: String, available_actions: Array) -> String (纯利用)
- get_action_probabilities(state: String, actions: Array, temperature: float) -> Dictionary (softmax)
- learn(state: String, action: String, reward: float, next_state: String, done: bool) -> float
- store_experience(state, action, reward, next_state, done) -> void
- train_from_replay(batch_size: int) -> Dictionary ({updates, avg_td_error})
- decay_epsilon() -> void
- get_q_values(state: String) -> Dictionary
- set_q_value(state: String, action: String, value: float) -> void
- get_state_count() -> int
- get_stats() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary) -> bool
```

**示例**:
```gdscript
var rl = RLAgent.new()
rl.set_learning_rate(0.2)
for episode in 500:
    var state = "enemy_weak" if enemy.hp < 0.3 else "enemy_strong"
    var action = rl.choose_action(state, ["attack", "defend", "heal"])
    var reward = execute_action(action)
    rl.learn(state, action, reward, next_state, done)
    rl.decay_epsilon()
# 训练后: enemy_weak->attack, enemy_strong->defend
```

**性能**: 1µs/learn调用

---

### 2.20 SoulAIController（统一AI控制器）

**职责**: 整合Soul + RLAgent + BayesianNetwork + GoalPlanner的高层控制器，战策NPC只需调用decide()即可获得完整AI决策

**决策流水线**:
```
context → Soul感知 → 贝叶斯威胁评估 → GOAP目标规划
        → 强化学习动作选择 → 认知引擎兜底 → decision
```

**方法**:
```
- initialize(config: Dictionary) -> void
  config: {soul_config, rl_config, use_rl, use_bayes, use_planner}
- is_initialized() -> bool
- decide(context: Dictionary) -> Dictionary
  返回: {action, confidence, reasoning, threat_assessment, state_key, timestamp}
- observe_reward(reward: float, next_context: Dictionary) -> void (学习反馈)
- end_episode() -> void (epsilon衰减 + 回放训练)
- get_soul() -> Soul
- get_rl_agent() -> RLAgent
- get_bayesian_network() -> BayesianNetwork
- get_goal_planner() -> GoalPlanner
- set_use_rl(enabled: bool) / get_use_rl() -> bool
- set_use_bayes(enabled: bool) / get_use_bayes() -> bool
- set_use_planner(enabled: bool) / get_use_planner() -> bool
- perceive(stimulus: Dictionary) -> void
- update(delta: float) -> void
- get_status() -> Dictionary
- get_stats() -> Dictionary
- serialize() -> Dictionary
- deserialize(data: Dictionary) -> bool
```

**示例**:
```gdscript
var ai = SoulAIController.new()
ai.initialize({"soul_config": {"name": "NPC1"}, "rl_config": {"learning_rate": 0.2}})
var decision = ai.decide({"health": 0.8, "enemy_in_range": true, "threat_count": 1})
# decision = {action: "attack", confidence: 0.6, reasoning: "goal_planner", ...}
ai.observe_reward(5.0, next_context)
ai.end_episode()
```

**预配置**: 默认战斗贝叶斯网络(EnemyVisible→EnemyAttacking→PlayerInDanger) + 5个GOAP行动(attack/approach/defend/heal/retreat)

**性能**: 250µs/decide（完整4系统流水线）

---

### 2.21 EmberUnitTest（C++单元测试运行器）

**职责**: 在C++层面运行单元测试，验证内部逻辑、边界条件和边缘情况，GDScript测试无法覆盖的部分。测试运行速度极快（42测试~1ms）。

**方法**:
```
- run_all_tests() -> Dictionary
  返回: {total: int, passed: int, failed: int, duration_ms: float, results: Array}
  results中每个元素: {name: String, passed: bool, message: String}
- run_category(category: String) -> Dictionary (单个类别测试)
- get_test_categories() -> Array (8个类别名称)
- get_test_count() -> int (测试用例总数)
```

**测试类别（8个，42个测试）**:
| 类别 | 测试数 | 覆盖内容 |
|---|---|---|
| Personality | 6 | Big Five读写、clamp、自定义维度、序列化 |
| EmotionState | 6 | PAD模型、情绪触发、衰减、主导情绪 |
| SoulData | 4 | 验证、合法数据、序列化、clone独立性 |
| MemorySystem | 5 | 添加/检索、计数、容量下限、序列化、清空 |
| GoalPlanner | 4 | 简单规划、不可能规划、状态匹配、成本计算 |
| BayesianNetwork | 4 | 简单推理、条件推理、证据管理、归一化 |
| RLAgent | 5 | Q-learning更新、epsilon衰减、最优动作、经验回放 |
| Soul | 8 | 创建、命名、感知、更新、序列化、二进制、reset、子系统 |

**示例**:
```gdscript
var tester = EmberUnitTest.new()
var result = tester.run_all_tests()
print("C++ Tests: %d/%d passed (%.1fms)" % [result.passed, result.total, result.duration_ms])
for r in result.results:
    if not r.passed:
        print("FAIL: %s - %s" % [r.name, r.message])
```

**性能**: 42个C++测试仅需~1ms（GDScript测试需数秒）

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

## 六、实现状态

### 已实现（21个类，243测试全通过）
1. ✅ SoulData（灵魂数据结构）
2. ✅ Personality（个性系统，大五+5自定义维度）
3. ✅ EmotionState（情绪状态，PAD+Plutchik 8情绪）
4. ✅ CognitiveEngine（认知决策引擎，感知→决策→行动）
5. ✅ MemorySystem（记忆系统，6层记忆）
6. ✅ Soul（灵魂主类，整合子系统）
7. ✅ PerceptionSystem（感知系统，多模态+注意力）
8. ✅ DecisionSystem（决策系统，效用/贝叶斯/Q学习）
9. ✅ ActionSystem（行动系统，11种行动+队列+冷却）
10. ✅ GrowthSystem（成长系统，经验/升级/进化）
11. ✅ RelationshipSystem（关系系统，9种关系+6属性）
12. ✅ SocialSystem（社交系统，群体/声誉/地位）
13. ✅ LearningSystem（学习系统，技能/知识/遗忘）
14. ✅ ConsciousnessSystem（意识系统，觉知/内省/思维）
15. ✅ DreamSystem（梦境系统，梦境/记忆巩固/潜意识）
16. ✅ SoulPool（对象池，高效复用Soul实例）
17. ✅ GoalPlanner（GOAP目标导向行动规划，A*搜索）
18. ✅ BayesianNetwork（贝叶斯网络，概率推理+威胁评估）
19. ✅ RLAgent（强化学习，Q-learning+经验回放）
20. ✅ SoulAIController（统一AI控制器，整合4个子系统）
21. ✅ EmberUnitTest（C++单元测试运行器，42测试~1ms）

### 已完成的P3优化
1. ✅ SoulPool对象池（7µs/acquire+release）
2. ✅ 二进制序列化（to_bytes/from_bytes，1113字节/Soul）
3. ✅ SoulDebugPanel运行时调试面板
4. ✅ Godot编辑器Soul Inspector Dock插件（v1.1.0）
5. ✅ 自动化测试运行器（11套件243测试）
6. ✅ 一键构建+测试脚本
7. ✅ C++单元测试框架（42测试，~1ms）
8. ✅ 跨平台编译支持（Windows/Linux/macOS）

### 待实现
1. **高级AI算法**（神经网络、深度学习集成）
2. **多线程**（认知计算并行化）

---

## 七、迁移优先级与完成状态

### P0（核心，✅ 已完成）
1. ✅ SoulData（灵魂数据结构）
2. ✅ Personality（个性系统）
3. ✅ EmotionState（情绪状态）
4. ✅ CognitiveEngine（认知决策引擎，基础版）
5. ✅ MemorySystem（记忆系统）
6. ✅ Soul（灵魂主类，整合以上）

### P1（重要，✅ 已完成）
1. ✅ PerceptionSystem（感知系统）
2. ✅ DecisionSystem（决策系统，完整版）
3. ✅ ActionSystem（行动系统）
4. ✅ GrowthSystem（成长系统）

### P2（增强，✅ 已完成）
1. ✅ RelationshipSystem（关系系统）
2. ✅ SocialSystem（社交系统）
3. ✅ LearningSystem（学习系统）
4. ✅ ConsciousnessSystem（意识系统）
5. ✅ DreamSystem（梦境系统）

### P3（优化，基本完成）
1. ✅ 对象池（SoulPool，7µs/次）
2. ✅ 二进制序列化（to_bytes/from_bytes）
3. ✅ 调试工具（SoulDebugPanel运行时 + Soul Inspector编辑器Dock）
4. ✅ 高级AI算法（GoalPlanner GOAP + BayesianNetwork + RLAgent + SoulAIController）
5. ✅ Godot编辑器插件（v1.1.0，Soul Inspector Dock）
6. ✅ 自动化测试（11套件243测试，一键运行）
7. ✅ C++单元测试框架（EmberUnitTest，42测试~1ms）
8. ✅ 跨平台编译（Linux/macOS构建脚本+文档）
9. ⏳ 多线程并行化

---

**v0.4 更新**: 21个类全部实现，243测试全通过，Release DLL ~1142KB。
- 新增EmberUnitTest（C++单元测试运行器，42测试8类别，~1ms完成）
- P3优化全部完成（对象池、二进制序列化、C++单元测试、跨平台编译）
- 自动化测试扩展到11套件243测试
- Ember现有189个认知子系统，已迁移21个核心类到C++ GDExtension。

**v0.3 更新**: 20个类全部实现，235测试全通过，Release DLL ~1068KB。
- 新增P3优化：SoulPool对象池、二进制序列化、SoulDebugPanel、编辑器Dock插件
- 新增高级AI：GoalPlanner(GOAP)、BayesianNetwork、RLAgent(强化学习)、SoulAIController(统一控制器)
- 自动化测试基础设施：run_all_tests.ps1 + build_and_test.ps1
- Ember现有189个认知子系统，已迁移20个核心类到C++ GDExtension。
