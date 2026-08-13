# Architecture Plan

这份文档定义 Maneuver Field Alpha 的 Unity 工程架构。目标是让早期 Demo 可以快速推进，同时保留后续扩展成正式游戏的空间。

## Architecture Goals

- 模块边界清晰：移动、摄像机、战斗、技能、UI、配置、存档各自独立。
- 数据可配置：机甲、武器、技能、地图参数不要散落在代码里。
- Demo 可演进：早期允许简单实现，但稳定功能要逐步整理成可复用模块。
- 移动端优先：输入、性能、UI、资源加载都按手机体验设计。
- 后端可后置：当前不接数据库，但为账号、背包、战绩和联机预留边界。
- 资源与权限分离：模型、材质、场景等表现资源在客户端或资源包中，后端只控制拥有关系、装备状态、配置 ID 和版本。

## Core Principle

前期不要做过重的大框架，但也不要把所有逻辑写进一个脚本。推荐采用：

- 场景负责组装
- 组件负责行为
- 配置负责数值
- 服务负责跨系统能力
- 事件负责模块通信

## Recommended Script Structure

    Assets/_Project/Scripts/
      Core/
        GameBootstrap.cs
        GameContext.cs
        ServiceRegistry.cs
      Config/
        MechaConfig.cs
        WeaponConfig.cs
        SkillConfig.cs
      Player/
        MechaController.cs
        MechaMotor.cs
        MechaState.cs
      Camera/
        ThirdPersonCameraController.cs
        CameraTarget.cs
      Input/
        MobileInputController.cs
        IInputProvider.cs
      Combat/
        WeaponController.cs
        Damageable.cs
        HitInfo.cs
      Skills/
        SkillController.cs
        SkillBase.cs
        BoostSkill.cs
      UI/
        HUDController.cs
        SkillButtonView.cs
      World/
        SpawnPoint.cs
        ArenaManager.cs
      Data/
        LocalSaveService.cs
      Utilities/
        ObjectPool.cs

## Layer Responsibilities

### Core

负责游戏启动、模块注册、全局状态切换。Core 不应该包含具体玩法细节，例如武器伤害、技能表现或 UI 按钮逻辑。

### Config

使用 ScriptableObject 管理可调数据：

- 机甲基础属性
- 武器射速、伤害、扩散
- 技能冷却、消耗、距离
- 地图测试参数

这样后续新增机甲或武器时，优先新增配置资产，而不是复制代码。

### Input

输入层只负责把触屏、键鼠或调试输入转换成统一指令。玩法层不直接读取具体 UI 按钮。

推荐定义轻量接口：

    public interface IInputProvider
    {
        Vector2 Move { get; }
        Vector2 Look { get; }
        bool FireHeld { get; }
        bool BoostPressed { get; }
    }

后续可以替换为手机输入、键鼠调试输入、手柄输入或 AI 输入。

### Player

玩家模块负责机甲的移动状态、速度、朝向、生命状态和控制入口。不要在 Player 里直接写 UI、音效、特效或数据库逻辑。

### Combat

战斗模块负责开火、命中、伤害和反馈事件。武器表现可以变化，但伤害结算接口要稳定。

### Skills

技能模块负责技能生命周期：

- CanCast
- Cast
- Cooldown
- Energy Cost
- Cancel / Interrupt

早期只做 BoostSkill，但结构上保留未来增加护盾、飞行、导弹、变形等技能的空间。

### UI

UI 只显示状态和发送输入意图，不直接修改角色数值。例如技能按钮不应该直接改机甲位置，而是通知输入层或技能控制器。

### Data

Demo 阶段只需要本地存档和配置。未来如果加入账号、背包、战绩或商城，再把 Data 层扩展为远程服务接口。

网络服务、背包、皮肤和客户端资源之间的关系见 [NETWORK_AND_ASSETS.md](NETWORK_AND_ASSETS.md)。

## Communication Rules

模块通信优先级：

1. 直接组件引用：同一个角色内部的强相关组件可以直接引用。
2. C# 事件：命中、死亡、技能释放、能量变化等适合用事件通知 UI 和反馈系统。
3. 服务接口：跨场景、跨模块能力使用服务，例如存档、资源加载、音频。
4. 全局单例：谨慎使用，只允许用于极少数稳定服务，不允许到处挂 Manager。

## Data-Driven Expansion

为了后期从 Demo 扩展成正式游戏，以下内容应尽量数据化：

- MechaConfig：机甲血量、速度、转向、能量上限
- WeaponConfig：伤害、射速、射程、弹道类型
- SkillConfig：冷却、消耗、持续时间、释放条件
- ArenaConfig：出生点、地图规则、目标数量

新增一个机甲时，理想流程应该是：

1. 新建 MechaConfig
2. 指定模型和动画
3. 选择武器配置
4. 选择技能配置
5. 生成 Prefab

不应该为了新增机甲复制一整套 Player 脚本。

## Scene Architecture

场景中建议保留：

- GameBootstrap：启动入口
- ArenaManager：当前地图规则
- PlayerSpawnPoint：玩家出生点
- TestTargets：训练目标
- UI Root：移动端 HUD
- Main Camera：第三人称摄像机

场景不应该承担大量业务逻辑。复杂逻辑应放入模块脚本和配置资产。

## Expansion Path

### Demo Stage

- 单机
- 一个机甲
- 一把武器
- 一个冲刺技能
- 一个灰盒地图
- 本地配置

### Prototype Stage

- 多机甲配置
- 多武器配置
- 技能系统稳定
- AI 训练目标
- 基础菜单和设置

### Vertical Slice

- 一张较完整地图
- 两到三台机甲
- 基础局内 UI
- 简单胜负条件
- Android 性能优化

### Production Stage

- 联机或房间服务
- 账号和存档
- 战绩、背包、排行
- 内容更新管线
- 正式美术和音频

## Anti-Patterns

这些写法早期看起来快，后期会很痛：

- 一个 GameManager 管所有东西。
- UI 按钮直接修改角色坐标、血量或技能冷却。
- 每个机甲复制一份控制器脚本。
- 武器伤害硬编码在开火函数里。
- 每张地图写一套独立逻辑。
- 大量使用 FindObjectOfType 查找核心对象。
- 正式逻辑依赖场景中手动拖拽的一堆临时引用。

## Practical First Step

第一版代码不需要一次写完所有架构。建议先落地这些基础接口和组件：

- IInputProvider
- MobileInputController
- MechaMotor
- MechaController
- ThirdPersonCameraController
- WeaponController
- Damageable
- BoostSkill
- MechaConfig
- WeaponConfig
- SkillConfig

这套结构足够支撑早期 Demo，也不会把后续扩展路线堵死。
