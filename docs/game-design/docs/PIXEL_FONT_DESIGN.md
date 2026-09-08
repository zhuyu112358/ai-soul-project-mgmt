# 战策 Battleplan - 像素字体设计规格文档

> **版本**: v1.0
> **创建日期**: 2026-09-09
> **状态**: 设计稿
> **适用范围**: 战策 Battleplan 像素字体设计与集成
> **配合资源**: pixel_font_reference.png / pixel_font_reference_v2.png
> **回应战策[设计需求]**: 战策已完成FontLoader.gd字体加载基础设施，需要实际像素字体文件（.ttf/.otf）

---

## 一、字体设计概述

### 1.1 设计目标
- 为战策 Battleplan 提供统一的像素奇幻风格字体
- 配合深紫+金色调的UI主题
- 支持中英文双语
- 清晰易读，适合游戏UI和战斗HUD
- 可在Godot 4中直接加载使用

### 1.2 字体风格
- **风格**: 像素奇幻（Pixel Fantasy），精致像素风
- **感觉**: 神秘、温暖、金色光辉、东方奇幻
- **参考**: 《星露谷物语》《挺进地牢》《死亡细胞》的像素字体
- **配色**: 金色#ffd65c（标题）/ 米白#f2e6bf（正文）/ 深紫#1a1428（描边）

### 1.3 字体命名
| 字体名称 | 说明 | 文件名 |
|----------|------|--------|
| **战策像素体 / Battleplan Pixel** | 主字体，中英文统一 | battleplan_pixel.ttf |
| **战策像素体 Bold** | 粗体，标题用 | battleplan_pixel_bold.ttf |
| **战策像素体 Mono** | 等宽，数字/代码用 | battleplan_pixel_mono.ttf |

---

## 二、字体规格

### 2.1 字号规范
| 用途 | 字号（px） | 字重 | 颜色 | 示例 |
|------|-----------|------|------|------|
| 游戏标题 | 64-72 | Bold | 金色#ffd65c | "BATTLEPLAN 战策" |
| 界面标题 | 32-40 | Bold | 金色#ffd65c | "灵魂选择"、"战斗结算" |
| 按钮文字 | 20-24 | Regular | 米白#f2e6bf | "开始战斗"、"确认" |
| 正文文字 | 16-18 | Regular | 米白#f2e6bf | 描述、说明文字 |
| 小字/提示 | 12-14 | Regular | 灰色#9ca3af | 辅助说明、快捷键 |
| 战斗HUD数字 | 18-24 | Bold/Mono | 金色#ffd65c | HP/MP数值、伤害飘字 |
| 伤害飘字 | 20-28 | Bold | 白色/金色/红色 | 伤害数字、暴击数字 |
| 技能冷却数字 | 14-16 | Mono | 白色#ffffff | 冷却倒计时 |

### 2.2 字重规范
| 字重 | 字重值 | 用途 | 像素粗细 |
|------|--------|------|----------|
| Thin（细体） | 100 | 装饰性文字 | 1px |
| Regular（常规） | 400 | 正文、按钮 | 2px |
| Bold（粗体） | 700 | 标题、数字 | 3px |
| Black（黑体） | 900 | 大标题、强调 | 4px |

### 2.3 字符集规范

#### 2.3.1 英文字符集
- **大写字母**: A-Z（26个）
- **小写字母**: a-z（26个）
- **数字**: 0-9（10个）
- **常用符号**: ! @ # $ % ^ & * ( ) - _ = + [ ] { } | \ ; : ' " , . / < > ? ~ `（约40个）
- **游戏专用符号**: ★ ☆ ♥ ♦ ♣ ♠ ⚔ 🛡 ✨ 🔥 💧 🌍 💨（12个）
- **合计**: 约114个英文字符

#### 2.3.2 中文字符集
- **常用汉字**: 3500个（GB2312一级字库）
- **次常用汉字**: 3000个（GB2312二级字库，可选）
- **中文标点**: ，。、；：？！""''（）《》【】…—～·（16个）
- **游戏专用汉字**: 战策灵魂火水土风攻击防御速度生命能量技能治疗护盾暴击召唤（约30个）
- **合计**: 约3500-6500个中文字符

#### 2.3.3 字符集优先级
| 优先级 | 字符集 | 数量 | 说明 |
|--------|--------|------|------|
| P0 | 英文+数字+符号 | 114个 | 必须，游戏基础 |
| P0 | 游戏专用汉字 | 30个 | 必须，UI核心文字 |
| P1 | 常用汉字 | 3500个 | 高优先级，完整中文支持 |
| P2 | 次常用汉字 | 3000个 | 中优先级，完整中文支持 |

---

## 三、字体设计规范

### 3.1 像素网格规范
- **基础网格**: 16x16像素（每个字符占用16x16网格）
- **大字符网格**: 32x32像素（标题用大字）
- **像素大小**: 1px = 1个像素块，清晰锐利
- **字间距**: 2px（字符之间的间距）
- **行间距**: 4px（行与行之间的间距）
- **基线**: 字符底部对齐基线，基线在网格底部第2px处

### 3.2 笔画规范
- **横画**: 2px粗（Regular）/ 3px粗（Bold），水平直线
- **竖画**: 2px粗（Regular）/ 3px粗（Bold），垂直直线
- **撇捺**: 2px粗，45度斜线，末端收尖
- **点画**: 2x2像素方块，或菱形
- **折画**: 直角转折，无圆角
- **钩画**: 2px粗，末端收尖或平切

### 3.3 字体特征
- **等宽 vs 比例**: 英文用比例字体（不同字符宽度不同），中文用等宽字体（所有汉字同宽）
- **字面率**: 75-80%（字符占网格的比例，留出边距）
- **中宫**: 适中，不过紧也不过松
- **重心**: 略高，显得挺拔
- **风格**: 方中带圆，直角为主，少量斜角

### 3.4 中英文混排规范
- **中文字符宽度**: 16px（与2个英文字符宽度相当）
- **英文字符宽度**: 8px（平均）
- **中英文混排时**: 中文和英文基线对齐，字号一致
- **数字**: 使用等宽字体（Mono），确保数字对齐
- **标点**: 中文标点占1个中文字符宽度，英文标点占1个英文字符宽度

---

## 四、Godot 4 字体集成

### 4.1 FontLoader.gd 基础设施（战策已完成）
战策已完成字体加载基础设施：
- 新建 `scripts/core/FontLoader.gd` 字体加载工具类
- 在4个UI场景添加FontLoader调用：
  - `scripts/ui/MainMenu.gd`
  - `scripts/ui/SoulSelect.gd`
  - `scripts/ui/SettingsMenu.gd`
  - `scripts/game/RTSArenaController.gd`
- 新建 `assets/fonts/README.md` 字体需求说明
- 当前无实际字体文件，使用Godot默认字体（fallback正常工作）
- 字体文件到位后自动加载，无需修改代码

### 4.2 字体文件放置位置
```
battleplan/
├── assets/
│   ├── fonts/
│   │   ├── battleplan_pixel.ttf          # 主字体（常规）
│   │   ├── battleplan_pixel_bold.ttf     # 粗体（标题）
│   │   ├── battleplan_pixel_mono.ttf     # 等宽（数字）
│   │   └── README.md                       # 字体说明
```

### 4.3 Godot 4 字体加载代码
```gdscript
# FontLoader.gd - 字体加载工具类
extends Node

var main_font: Font = null
var bold_font: Font = null
var mono_font: Font = null

func _ready():
    load_fonts()

func load_fonts() -> void:
    # 加载主字体
    var main_path = "res://assets/fonts/battleplan_pixel.ttf"
    if ResourceLoader.exists(main_path):
        main_font = load(main_path)
        print("[FontLoader] 主字体加载成功")
    else:
        print("[FontLoader] 主字体未找到，使用默认字体")
    
    # 加载粗体
    var bold_path = "res://assets/fonts/battleplan_pixel_bold.ttf"
    if ResourceLoader.exists(bold_path):
        bold_font = load(bold_path)
        print("[FontLoader] 粗体加载成功")
    
    # 加载等宽
    var mono_path = "res://assets/fonts/battleplan_pixel_mono.ttf"
    if ResourceLoader.exists(mono_path):
        mono_font = load(mono_path)
        print("[FontLoader] 等宽字体加载成功")

func apply_font_to_node(node: Node, font_type: String = "main") -> void:
    var font = get_font(font_type)
    if font == null:
        return
    
    if node is Label:
        node.add_theme_font_override("font", font)
    elif node is Button:
        node.add_theme_font_override("font", font)
    elif node is LineEdit:
        node.add_theme_font_override("font", font)
    elif node is RichTextLabel:
        node.add_theme_font_override("normal_font", font)
        node.add_theme_font_override("bold_font", bold_font)
        node.add_theme_font_override("mono_font", mono_font)
    
    # 递归应用到子节点
    for child in node.get_children():
        apply_font_to_node(child, font_type)

func get_font(font_type: String) -> Font:
    match font_type:
        "main": return main_font
        "bold": return bold_font
        "mono": return mono_font
    return main_font
```

### 4.4 字体渲染设置
- **抗锯齿**: 关闭（像素字体不需要抗锯齿，保持像素锐利）
- **字体大小**: 使用整数倍字号（16/24/32/48/64），避免模糊
- **过滤模式**: Nearest（最近邻过滤，保持像素清晰）
- **mipmap**: 关闭（2D游戏不需要mipmap）

---

## 五、字体制作方案

### 5.1 方案一：使用免费商用像素字体（推荐，最快）
直接使用已有的免费商用像素字体，修改配色和使用方式。

**推荐字体**：
| 字体名称 | 作者 | 授权 | 特点 | 下载地址 |
|----------|------|------|------|----------|
| **Press Start 2P** | CodeMan38 | SIL Open Font License | 经典8-bit像素字体，英文 | Google Fonts |
| **Pixelify Sans** | Stefie Justprince | SIL Open Font License | 现代像素字体，英文+数字 | Google Fonts |
| **Silkscreen** | Jason Kotte | SIL Open Font License | 复古像素字体，英文 | Google Fonts |
| **VT323** | Peter Hull | SIL Open Font License | 终端风格像素字体，英文 | Google Fonts |
| **Zpix（最像素）** | Bigelow & Holmes | 免费商用 | 中文像素字体，支持3500汉字 |  GitHub |
| **Fusion Pixel** | 凌信团队 | 免费商用 | 中英文像素字体，支持GB2312 | GitHub |
| **Galmuri** | 케이온 | SIL Open Font License | 韩英像素字体，可参考风格 | GitHub |

**推荐组合**：
- 英文/数字：Pixelify Sans（现代像素风，清晰易读）
- 中文：Zpix（最像素）或 Fusion Pixel（完整中文支持）
- 等宽数字：VT323（终端风格，数字对齐）

**优点**：
- 最快，立即可用
- 免费商用，无版权问题
- 成熟稳定，字符集完整

**缺点**：
- 不是完全定制的战策专属字体
- 中英文风格可能不完全统一

### 5.2 方案二：使用字体制作软件定制（中等时间）
使用字体制作软件，基于像素字体参考图，制作战策专属像素字体。

**推荐软件**：
| 软件 | 平台 | 价格 | 特点 |
|------|------|------|------|
| **FontForge** | Windows/Mac/Linux | 免费开源 | 功能强大，支持TTF/OTF导出 |
| **Glyphs 3** | Mac | $299.99 | 专业字体设计，Mac专属 |
| **FontLab 8** | Windows/Mac | $499 | 专业字体设计，跨平台 |
| **BirdFont** | Windows/Mac/Linux | 免费/付费 | 简单易用，适合初学者 |
| **PixelForge** | Web | 免费 | 在线像素字体制作工具 |

**制作流程**：
1. 准备像素字体参考图（pixel_font_reference.png / pixel_font_reference_v2.png）
2. 在FontForge中创建新字体，设置字体信息（名称、版权、字重）
3. 设置字体度量（em大小、上升、下降、基线）
4. 逐个绘制字符（英文114个 + 中文3500个）
5. 设置字符宽度和间距
6. 验证字体（检查字符完整性、间距、渲染效果）
7. 导出为TTF格式
8. 在Godot 4中测试加载和渲染

**时间估算**：
- 英文字符集（114个）：约8-16小时
- 常用汉字（3500个）：约80-160小时
- 完整字体（英文+中文）：约100-200小时

**优点**：
- 完全定制的战策专属字体
- 中英文风格完全统一
- 可精确控制每个字符的像素细节

**缺点**：
- 耗时较长，特别是中文字符
- 需要字体设计经验

### 5.3 方案三：使用在线像素字体生成工具（最快定制）
使用在线工具，上传像素字体参考图，自动生成TTF字体。

**推荐工具**：
| 工具 | 地址 | 特点 |
|------|------|------|
| **PixelForge** | pixelforge.net | 在线像素字体制作，支持TTF导出 |
| **BitFontMaker2** | pentacom.jp/bitfontmaker | 在线8-bit字体制作，支持TTF导出 |
| **FontStruct** | fontstruct.com | 在线砖块字体制作，社区分享 |
| **Glyphr Studio** | glyphrstudio.com | 在线字体设计，功能较全 |

**制作流程**：
1. 准备像素字体参考图
2. 在在线工具中创建新字体
3. 逐个绘制或导入字符
4. 设置字体信息和度量
5. 导出TTF文件
6. 在Godot 4中测试

**优点**：
- 无需安装软件，浏览器即可操作
- 简单易用，适合初学者
- 可快速制作英文字符集

**缺点**：
- 中文字符集支持有限
- 功能不如专业软件强大
- 依赖网络连接

### 5.4 推荐方案
**短期（M2 EA上架前）**：使用方案一（免费商用像素字体）
- 英文/数字：Pixelify Sans（Google Fonts，免费商用）
- 中文：Zpix（最像素）或 Fusion Pixel（免费商用）
- 立即可用，无版权问题
- 战策FontLoader已支持自动加载

**中期（M3更新）**：使用方案三（在线工具）制作战策专属英文字体
- 制作战策专属英文像素字体（114个字符）
- 中文继续使用免费商用字体
- 提升品牌识别度

**长期（正式版）**：使用方案二（FontForge）制作战策专属完整字体
- 制作战策专属中英文像素字体（英文114个+中文3500个）
- 完全定制，风格统一
- 作为正式版的重要特色

---

## 六、字体使用规范

### 6.1 UI场景字体使用
| 场景 | 标题字体 | 正文字体 | 数字字体 |
|------|----------|----------|----------|
| 主菜单 | Bold 48px | Regular 20px | Mono 24px |
| 灵魂选择 | Bold 36px | Regular 18px | Mono 20px |
| 设置界面 | Bold 32px | Regular 16px | Mono 18px |
| RTS竞技场 | Bold 24px | Regular 16px | Mono 20px |
| 战斗结算 | Bold 48px | Regular 18px | Mono 24px |
| 灵魂之家 | Bold 32px | Regular 16px | Mono 20px |

### 6.2 战斗HUD字体使用
| 元素 | 字体 | 字号 | 颜色 |
|------|------|------|------|
| 玩家/AI名称 | Bold | 20px | 金色#ffd65c |
| HP数值 | Mono | 18px | 绿色#4ade80 |
| MP数值 | Mono | 18px | 蓝色#60a5fa |
| 等级数字 | Bold | 16px | 金色#ffd65c |
| 技能冷却 | Mono | 16px | 白色#ffffff |
| 战斗日志 | Regular | 14px | 米白#f2e6bf |
| 伤害飘字（普通） | Bold | 20px | 白色#ffffff |
| 伤害飘字（暴击） | Bold | 28px | 金色#ffd65c |
| 伤害飘字（治疗） | Bold | 20px | 绿色#4ade80 |
| 伤害飘字（玩家受伤） | Bold | 20px | 红色#ff4a4a |

### 6.3 字体颜色规范
| 用途 | 颜色 | 色值 |
|------|------|------|
| 标题 | 金色 | #ffd65c |
| 正文 | 米白 | #f2e6bf |
| 辅助文字 | 灰色 | #9ca3af |
| 玩家方 | 蓝色 | #4a9eff |
| AI方 | 红色 | #ff4a4a |
| 生命值 | 绿色 | #4ade80 |
| 能量值 | 蓝色 | #60a5fa |
| 暴击 | 金色 | #ffd65c |
| 治疗 | 绿色 | #4ade80 |
| 警告 | 红色 | #ff4a4a |
| 成功 | 绿色 | #4ade80 |

---

## 七、字体测试清单

### 7.1 功能测试
- [ ] 字体文件可在Godot 4中正常加载
- [ ] 所有英文字符正常显示（A-Z, a-z, 0-9, 符号）
- [ ] 所有常用汉字正常显示（3500个）
- [ ] 中英文混排正常
- [ ] 字体大小缩放正常（16/24/32/48/64px）
- [ ] 字体颜色修改正常
- [ ] 字体加粗/斜体正常（如支持）
- [ ] 字体对齐正常（左/中/右）
- [ ] 自动换行正常
- [ ] 富文本标签正常（[b][i][color]等）

### 7.2 视觉测试
- [ ] 像素清晰锐利，无模糊
- [ ] 字符间距均匀
- [ ] 行间距合适
- [ ] 中英文基线对齐
- [ ] 数字等宽对齐
- [ ] 小字号（12-14px）清晰可辨
- [ ] 大字号（48-64px）无锯齿
- [ ] 深紫背景上金色文字清晰
- [ ] 深紫背景上米白文字清晰
- [ ] 战斗HUD中数字清晰
- [ ] 伤害飘字清晰可见

### 7.3 性能测试
- [ ] 字体加载时间<100ms
- [ ] 大量文字渲染无卡顿
- [ ] 战斗中伤害飘字无性能问题
- [ ] 内存占用合理（<50MB）

---

## 八、与已有资源的对应关系

### 8.1 像素字体参考图
- `pixel_font_reference.png` - 像素字体参考图集（第62轮产出）
- `pixel_font_reference_v2.png` - 像素字体字符映射参考图v2（第67轮风格修正轮产出），包含英文大小写+数字符号+中文字符样本+使用示例+字体规格

### 8.2 字体使用场景参考
- `main_menu_high_fidelity_ui.png` - 主菜单高保真UI（标题/按钮文字样式）
- `soul_select_high_fidelity_ui.png` - 灵魂选择界面高保真UI（卡片文字/属性数字）
- `battle_result_high_fidelity_ui.png` - 战斗结算界面高保真UI（胜利标题/统计数字）
- `settings_high_fidelity_ui.png` - 设置界面高保真UI（标签/滑块文字）
- `rts_arena_battle_hud_high_fidelity_ui.png` - RTS竞技场战斗HUD高保真UI（HUD数字/战斗日志）
- `soul_home_high_fidelity_ui.png` - 灵魂之家界面高保真UI（互动菜单/属性面板）

---

**文档维护**: 设计任务统一管理，战策任务负责字体加载和集成，营销任务负责字体采购/制作。
**更新记录**: v1.0 (2026-09-09) — 初始版本，完整像素字体设计规格（字体命名/字号规范/字符集规范/设计规范/Godot4集成/制作方案3种/使用规范/测试清单），回应战策[设计需求]设计产出实际像素字体文件，推荐短期使用免费商用像素字体（Pixelify Sans+Zpix），中期在线工具定制英文，长期FontForge制作完整专属字体。
