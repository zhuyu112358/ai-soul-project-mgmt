# 战策 Battleplan - UI交互音效集成指南

> **版本**: v1.0
> **创建日期**: 2026-09-09
> **状态**: 设计稿
> **适用范围**: 战策 Battleplan Godot 4 音效系统集成
> **配合文档**: UI_AUDIO_DESIGN.md（音效设计规格）

---

## 一、概述

### 1.1 目标
- 为战策 Battleplan 提供完整的Godot 4音效集成实现指南
- 确保UI交互音效、战斗音效、环境音效、背景音乐正确集成
- 提供音效对象池、音量管理、优先级冲突处理的实现方案
- 配合已产出的P0音效文件（11个）和UI_AUDIO_DESIGN.md设计规格

### 1.2 已产出音效文件（P0核心音效）
| 文件名 | 类型 | 大小 | 用途 |
|--------|------|------|------|
| `ui_button_hover.wav` | UI交互 | 312.6KB | 按钮悬停 |
| `ui_button_click.wav` | UI交互 | 312.6KB | 按钮点击 |
| `ui_button_back.wav` | UI交互 | 312.6KB | 返回按钮 |
| `ui_panel_open.wav` | UI交互 | 312.6KB | 面板打开 |
| `ui_panel_close.wav` | UI交互 | 312.6KB | 面板关闭 |
| `skill_fireball.wav` | 战斗 | 312.6KB | 火球技能 |
| `skill_waterjet.wav` | 战斗 | 312.6KB | 水箭技能 |
| `skill_rockspike.wav` | 战斗 | 312.6KB | 岩刺技能 |
| `skill_windblade.wav` | 战斗 | 312.6KB | 风刃技能 |
| `hit_critical.wav` | 战斗 | 312.6KB | 暴击命中 |
| `battle_victory.wav` | 战斗 | 468.8KB | 战斗胜利 |

### 1.3 音效文件位置
- **设计源文件**: `D:\Sojourn\management\docs\game-design\assets\audio\`
- **战策项目位置**: `D:\Sojourn\battleplan\assets\audio\`（战策任务同步）
- **Godot导入**: 复制到战策项目后，在Godot编辑器中打开自动生成.import文件

---

## 二、Godot 4 音频架构

### 2.1 AudioBus 分层设计
在Godot的AudioBus布局中创建以下总线：

| 总线名称 | 父总线 | 默认音量 | 用途 |
|----------|--------|----------|------|
| `Master` | — | 0 dB | 主总线，所有音频最终输出 |
| `BGM` | Master | -8 dB | 背景音乐 |
| `SFX_UI` | Master | -3 dB | UI交互音效 |
| `SFX_Battle` | Master | -2 dB | 战斗音效 |
| `SFX_Ambient` | Master | -10 dB | 环境音效 |
| `Voice` | Master | 0 dB | 旁白/语音（预留） |

**设置方法**：
1. 打开Godot编辑器 → 底部面板 → Audio
2. 点击"+"添加总线，重命名为上述名称
3. 设置每个总线的音量滑块
4. 保存项目（自动保存到`default_bus_layout.tres`）

### 2.2 音频节点类型
| 节点类型 | 用途 | 适用场景 |
|----------|------|----------|
| `AudioStreamPlayer` | 2D/非定位音效 | UI交互音效、背景音乐、旁白 |
| `AudioStreamPlayer2D` | 2D定位音效 | 战斗技能音效、单位动作音效（带位置衰减） |
| `AudioStreamPlayer3D` | 3D定位音效 | 战策是2D游戏，不使用 |

---

## 三、音效管理器（AudioManager）实现

### 3.1 单例设计
创建`AudioManager.gd`作为全局单例（Autoload），统一管理所有音效播放。

**注册Autoload**：
1. 项目 → 项目设置 → 自动加载
2. 添加`AudioManager.gd`，节点名`AudioManager`
3. 确保启用

### 3.2 AudioManager.gd 核心代码
```gdscript
extends Node
# AudioManager.gd - 战策音效管理器单例
# 管理UI音效、战斗音效、环境音效、背景音乐的播放
# 包含音效对象池、音量管理、优先级冲突处理

# 音效资源缓存（避免重复加载）
var _sfx_cache: Dictionary = {}

# 音效对象池（复用AudioStreamPlayer节点）
var _pool: Array = []
var _pool_size: int = 16  # 对象池大小

# 当前播放的音效列表（用于优先级管理）
var _active_sfx: Array = []

# 音量设置（从设置界面读取/保存）
var _volume_master: float = 1.0
var _volume_bgm: float = 0.8
var _volume_sfx_ui: float = 0.9
var _volume_sfx_battle: float = 0.95
var _volume_sfx_ambient: float = 0.6

# BGM播放器
var _bgm_player: AudioStreamPlayer = null

func _ready():
    # 初始化音效对象池
    for i in _pool_size:
        var player = AudioStreamPlayer.new()
        player.bus = "SFX_UI"
        player.finished.connect(_on_sfx_finished.bind(player))
        _pool.append(player)
        add_child(player)
    
    # 初始化BGM播放器
    _bgm_player = AudioStreamPlayer.new()
    _bgm_player.bus = "BGM"
    _bgm_player.volume_db = -8.0
    add_child(_bgm_player)
    
    # 加载音量设置
    _load_volume_settings()
    
    print("[AudioManager] 初始化完成，对象池大小: ", _pool_size)

# 播放UI音效
func play_ui_sfx(sfx_name: String, priority: int = 2) -> void:
    var stream = _get_sfx_stream(sfx_name)
    if stream == null:
        return
    
    var player = _get_pooled_player()
    if player == null:
        # 对象池满，按优先级替换
        player = _replace_lowest_priority(priority)
        if player == null:
            return  # 所有音效优先级都更高，不播放
    
    player.bus = "SFX_UI"
    player.stream = stream
    player.volume_db = _db_from_linear(_volume_sfx_ui)
    player.play()
    
    _active_sfx.append({
        "player": player,
        "name": sfx_name,
        "priority": priority,
        "type": "ui"
    })

# 播放战斗音效（2D定位）
func play_battle_sfx(sfx_name: String, position: Vector2 = Vector2.ZERO, priority: int = 2) -> void:
    var stream = _get_sfx_stream(sfx_name)
    if stream == null:
        return
    
    # 战斗音效使用AudioStreamPlayer2D（带位置衰减）
    var player = AudioStreamPlayer2D.new()
    player.bus = "SFX_Battle"
    player.stream = stream
    player.position = position
    player.volume_db = _db_from_linear(_volume_sfx_battle)
    player.max_distance = 800.0
    player.finished.connect(_on_battle_sfx_finished.bind(player))
    add_child(player)
    player.play()
    
    _active_sfx.append({
        "player": player,
        "name": sfx_name,
        "priority": priority,
        "type": "battle"
    })

# 播放BGM
func play_bgm(bgm_name: String, fade_in: float = 1.0) -> void:
    var stream = load("res://assets/audio/bgm/" + bgm_name + ".wav")
    if stream == null:
        print("[AudioManager] BGM未找到: ", bgm_name)
        return
    
    _bgm_player.stream = stream
    _bgm_player.volume_db = -80.0  # 从静音开始淡入
    _bgm_player.play()
    
    # 淡入效果
    var tween = create_tween()
    tween.tween_property(_bgm_player, "volume_db", _db_from_linear(_volume_bgm), fade_in)

# 停止BGM（淡出）
func stop_bgm(fade_out: float = 1.0) -> void:
    if _bgm_player.playing:
        var tween = create_tween()
        tween.tween_property(_bgm_player, "volume_db", -80.0, fade_out)
        tween.tween_callback(_bgm_player.stop)

# 获取对象池中的空闲播放器
func _get_pooled_player() -> AudioStreamPlayer:
    for player in _pool:
        if not player.playing:
            return player
    return null

# 替换最低优先级的音效
func _replace_lowest_priority(new_priority: int) -> AudioStreamPlayer:
    var lowest = null
    var lowest_priority = 999
    
    for sfx in _active_sfx:
        if sfx.priority < lowest_priority and sfx.type == "ui":
            lowest = sfx
            lowest_priority = sfx.priority
    
    if lowest != null and lowest_priority < new_priority:
        lowest.player.stop()
        _active_sfx.erase(lowest)
        return lowest.player
    return null

# 音效播放完成回调
func _on_sfx_finished(player: AudioStreamPlayer) -> void:
    for i in _active_sfx.size() - 1:
        if _active_sfx[i].player == player:
            _active_sfx.remove_at(i)
            break

# 战斗音效播放完成回调（销毁节点）
func _on_battle_sfx_finished(player: AudioStreamPlayer2D) -> void:
    for i in _active_sfx.size() - 1:
        if _active_sfx[i].player == player:
            _active_sfx.remove_at(i)
            break
    player.queue_free()

# 加载音效流（带缓存）
func _get_sfx_stream(sfx_name: String) -> AudioStream:
    if _sfx_cache.has(sfx_name):
        return _sfx_cache[sfx_name]
    
    var path = "res://assets/audio/sfx/" + sfx_name + ".wav"
    var stream = load(path)
    if stream == null:
        print("[AudioManager] 音效未找到: ", sfx_name)
        return null
    
    _sfx_cache[sfx_name] = stream
    return stream

# 线性音量转dB
func _db_from_linear(linear: float) -> float:
    if linear <= 0.0:
        return -80.0
    return 20.0 * log(linear) / log(10.0)

# 加载音量设置
func _load_volume_settings() -> void:
    if FileAccess.file_exists("user://audio_settings.cfg"):
        var config = ConfigFile.new()
        config.load("user://audio_settings.cfg")
        _volume_master = config.get_value("audio", "master", 1.0)
        _volume_bgm = config.get_value("audio", "bgm", 0.8)
        _volume_sfx_ui = config.get_value("audio", "sfx_ui", 0.9)
        _volume_sfx_battle = config.get_value("audio", "sfx_battle", 0.95)
        _volume_sfx_ambient = config.get_value("audio", "sfx_ambient", 0.6)

# 保存音量设置
func save_volume_settings() -> void:
    var config = ConfigFile.new()
    config.set_value("audio", "master", _volume_master)
    config.set_value("audio", "bgm", _volume_bgm)
    config.set_value("audio", "sfx_ui", _volume_sfx_ui)
    config.set_value("audio", "sfx_battle", _volume_sfx_battle)
    config.set_value("audio", "sfx_ambient", _volume_sfx_ambient)
    config.save("user://audio_settings.cfg")

# 设置音量（供设置界面调用）
func set_volume(channel: String, value: float) -> void:
    match channel:
        "master": _volume_master = value
        "bgm": _volume_bgm = value
        "sfx_ui": _volume_sfx_ui = value
        "sfx_battle": _volume_sfx_battle = value
        "sfx_ambient": _volume_sfx_ambient = value
    save_volume_settings()
```

---

## 四、UI音效集成点

### 4.1 按钮音效集成
在自定义按钮脚本或全局UI脚本中连接按钮信号：

```gdscript
# 在UI场景的_ready()中为所有按钮添加音效
func _ready():
    _add_sfx_to_buttons(self)

func _add_sfx_to_buttons(node: Node) -> void:
    if node is Button:
        node.mouse_entered.connect(_on_button_hover.bind(node))
        node.pressed.connect(_on_button_click.bind(node))
    for child in node.get_children():
        _add_sfx_to_buttons(child)

func _on_button_hover(button: Button) -> void:
    if button.disabled:
        return
    AudioManager.play_ui_sfx("ui_button_hover", priority=1)

func _on_button_click(button: Button) -> void:
    if button.disabled:
        return
    # 返回按钮使用不同音效
    if button.name == "BackButton" or button.text.contains("返回"):
        AudioManager.play_ui_sfx("ui_button_back", priority=2)
    else:
        AudioManager.play_ui_sfx("ui_button_click", priority=2)
```

### 4.2 面板/窗口音效集成
```gdscript
# 面板打开时
func open_panel(panel: Control) -> void:
    panel.visible = true
    AudioManager.play_ui_sfx("ui_panel_open", priority=2)
    # 可选：淡入动画
    panel.modulate.a = 0.0
    var tween = create_tween()
    tween.tween_property(panel, "modulate:a", 1.0, 0.15)

# 面板关闭时
func close_panel(panel: Control) -> void:
    AudioManager.play_ui_sfx("ui_panel_close", priority=2)
    # 可选：淡出动画
    var tween = create_tween()
    tween.tween_property(panel, "modulate:a", 0.0, 0.15)
    tween.tween_callback(panel.set_visible.bind(false))
```

### 4.3 场景切换BGM集成
```gdscript
# 场景切换时更换BGM
func _enter_tree():
    match get_tree().current_scene.name:
        "MainMenu":
            AudioManager.play_bgm("bgm_main_menu", fade_in=2.0)
        "SoulSelect":
            AudioManager.play_bgm("bgm_soul_select", fade_in=1.5)
        "RTSArena":
            AudioManager.play_bgm("bgm_battle_normal", fade_in=1.0)
        "BattleResult":
            AudioManager.stop_bgm(fade_out=0.5)
        "SoulHome":
            AudioManager.play_bgm("bgm_soul_home", fade_in=2.0)
        "Settings":
            pass  # 保持当前BGM
```

---

## 五、战斗音效集成点

### 5.1 技能释放音效
```gdscript
# 在技能释放函数中播放对应音效
func cast_skill(skill_type: String, caster: Node2D) -> void:
    match skill_type:
        "fireball":
            AudioManager.play_battle_sfx("skill_fireball", caster.position, priority=3)
        "waterjet":
            AudioManager.play_battle_sfx("skill_waterjet", caster.position, priority=3)
        "rockspike":
            AudioManager.play_battle_sfx("skill_rockspike", caster.position, priority=3)
        "windblade":
            AudioManager.play_battle_sfx("skill_windblade", caster.position, priority=3)
        "heal":
            AudioManager.play_battle_sfx("skill_heal", caster.position, priority=3)
        "shield":
            AudioManager.play_battle_sfx("skill_shield", caster.position, priority=3)
```

### 5.2 命中/暴击音效
```gdscript
# 在伤害计算函数中
func apply_damage(target: Node2D, damage: int, is_critical: bool) -> void:
    target.hp -= damage
    _show_damage_text(target, damage, is_critical)
    
    if is_critical:
        AudioManager.play_battle_sfx("hit_critical", target.position, priority=4)
        # 屏幕震动
        get_viewport().add_child(_create_screen_shake())
    else:
        AudioManager.play_battle_sfx("hit_normal", target.position, priority=2)
```

### 5.3 战斗事件音效
```gdscript
# 战斗开始
func _on_battle_start() -> void:
    AudioManager.play_battle_sfx("battle_start", Vector2.ZERO, priority=5)
    # 战斗开始横幅动画

# 战斗胜利
func _on_battle_victory() -> void:
    AudioManager.stop_bgm(fade_out=0.5)
    await get_tree().create_timer(0.5).timeout
    AudioManager.play_battle_sfx("battle_victory", Vector2.ZERO, priority=5)
    # 胜利结算界面

# 战斗失败
func _on_battle_defeat() -> void:
    AudioManager.stop_bgm(fade_out=0.5)
    await get_tree().create_timer(0.5).timeout
    AudioManager.play_battle_sfx("battle_defeat", Vector2.ZERO, priority=5)
    # 失败结算界面
```

---

## 六、音效优先级与冲突处理

### 6.1 优先级定义（L1-L5）
| 优先级 | 级别 | 示例 | 可被打断 |
|--------|------|------|----------|
| L1 | 最低 | 按钮悬停、列表滚动 | 是 |
| L2 | 低 | 按钮点击、面板打开/关闭 | 是 |
| L3 | 中 | 技能释放、普通命中 | 是 |
| L4 | 高 | 暴击命中、单位死亡 | 否（仅L5可打断） |
| L5 | 最高 | 战斗开始/胜利/失败、升级 | 否（不可打断） |

### 6.2 冲突处理规则
1. **同优先级**: 新音效可与旧音效同时播放（最多同时8个UI音效）
2. **高优先级打断低优先级**: L4可打断L1-L3，L5可打断所有
3. **对象池满时**: 替换最低优先级的正在播放音效
4. **重要事件闪避（Ducking）**: L5事件播放时，临时降低BGM和其他音效音量30%

### 6.3 闪避效果实现
```gdscript
# L5事件播放时触发闪避
func _trigger_ducking(duration: float) -> void:
    # 降低BGM音量
    var original_bgm_db = _bgm_player.volume_db
    var tween = create_tween()
    tween.tween_property(_bgm_player, "volume_db", original_bgm_db - 6.0, 0.1)
    tween.tween_interval(duration)
    tween.tween_property(_bgm_player, "volume_db", original_bgm_db, 0.3)
```

---

## 七、设置界面音量控制

### 7.1 音量滑块集成
```gdscript
# 设置界面音量滑块
func _on_master_volume_changed(value: float) -> void:
    AudioManager.set_volume("master", value)
    # 更新显示
    master_volume_label.text = str(int(value * 100)) + "%"

func _on_bgm_volume_changed(value: float) -> void:
    AudioManager.set_volume("bgm", value)

func _on_sfx_volume_changed(value: float) -> void:
    AudioManager.set_volume("sfx_ui", value)
    AudioManager.set_volume("sfx_battle", value)
    # 播放测试音效
    AudioManager.play_ui_sfx("ui_button_click", priority=2)
```

---

## 八、性能优化

### 8.1 音效对象池
- UI音效使用对象池（16个AudioStreamPlayer），避免频繁创建/销毁
- 战斗音效使用AudioStreamPlayer2D，播放完成后自动销毁
- 音效资源缓存（Dictionary），避免重复load

### 8.2 同时播放限制
- UI音效最多同时8个（对象池16个，预留8个给战斗）
- 战斗音效最多同时16个（超过时按优先级替换）
- BGM始终只有1个在播放

### 8.3 内存管理
- 短音效（<1秒）全部预加载到缓存
- 长音效（BGM）按需加载，切换时卸载旧的
- 使用`.import`文件确保Godot正确导入WAV文件

---

## 九、BUG-030 音频导入问题解决方案

### 9.1 问题描述
- Godot headless模式导入大量wav文件时会崩溃
- .import文件生成率仅20/381（5%）

### 9.2 解决方案
1. **编辑器导入**: 在Godot编辑器中打开项目，等待自动导入完成（推荐）
2. **分批导入**: 将音效文件分批复制到项目，每批不超过50个
3. **容错跳过**: 代码中添加load()失败的fallback处理（程序化生成或静默）
4. **转OGG格式**: 将WAV转换为OGG格式（更小体积，导入更稳定）
   ```bash
   # 使用ffmpeg批量转换
   for f in *.wav; do ffmpeg -i "$f" -c:a libvorbis -q:a 4 "${f%.wav}.ogg"; done
   ```

### 9.3 代码容错
```gdscript
func _get_sfx_stream(sfx_name: String) -> AudioStream:
    if _sfx_cache.has(sfx_name):
        return _sfx_cache[sfx_name]
    
    # 尝试WAV
    var stream = load("res://assets/audio/sfx/" + sfx_name + ".wav")
    # WAV失败则尝试OGG
    if stream == null:
        stream = load("res://assets/audio/sfx/" + sfx_name + ".ogg")
    # 都失败则返回null（静默处理，不崩溃）
    if stream == null:
        print("[AudioManager] 音效未找到（已跳过）: ", sfx_name)
        return null
    
    _sfx_cache[sfx_name] = stream
    return stream
```

---

## 十、测试与验证

### 10.1 音效测试清单
- [ ] 所有按钮悬停播放ui_button_hover
- [ ] 所有按钮点击播放ui_button_click
- [ ] 返回按钮播放ui_button_back
- [ ] 面板打开播放ui_panel_open
- [ ] 面板关闭播放ui_panel_close
- [ ] 6个技能释放播放对应音效
- [ ] 普通命中播放hit_normal
- [ ] 暴击命中播放hit_critical
- [ ] 战斗开始播放battle_start
- [ ] 战斗胜利播放battle_victory
- [ ] 战斗失败播放battle_defeat
- [ ] 场景切换BGM正确更换
- [ ] 音量滑块实时生效
- [ ] 设置保存后重启保持
- [ ] 同时播放多个音效不崩溃
- [ ] 音效优先级正确（高优先级打断低优先级）

### 10.2 性能测试
- [ ] 同时播放16个战斗音效帧率不下降
- [ ] 长时间游戏无内存泄漏
- [ ] 场景切换无音效卡顿

---

**文档维护**: 设计任务统一管理，战策任务负责音效系统实现和集成。
**更新记录**: v1.0 (2026-09-09) — 初始版本，完整Godot 4音效集成指南（AudioBus分层/AudioManager单例/UI音效集成/战斗音效集成/优先级冲突处理/音量控制/性能优化/BUG-030解决方案/测试清单）。
