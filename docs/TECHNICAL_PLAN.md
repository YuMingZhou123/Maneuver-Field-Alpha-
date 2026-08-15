# Technical Plan

## Engine Choice

项目使用 Unity，原因是目标是移动端 3D 机甲动作原型，Unity 在移动端打包、角色控制、动画、摄像机、UI、性能分析和第三方工具生态上更适合快速推进。

## Recommended Project Settings

- Template：3D URP
- Platform：Android first
- Orientation：Landscape
- Target frame rate：60 FPS target, 30 FPS fallback
- Rendering：URP with mobile-friendly quality settings
- Input：Unity Input System or a lightweight custom touch input layer
- Scene naming：`PrototypeScene`, `Arena_Greybox_01`

## Proposed Runtime Systems

更完整的代码分层、模块边界和扩展规则见 [ARCHITECTURE.md](ARCHITECTURE.md)。这里先记录首批运行时系统。

### Player Control

- `MechaController`：负责移动、转向、跳跃或推进。
- `MobileInputController`：读取虚拟摇杆、按钮和屏幕拖拽。
- `CameraFollow`：第三人称跟随、旋转、距离和遮挡处理。
- `BoostSystem`：冲刺、推进条、冷却和能量消耗。

### Combat

- `WeaponController`：管理开火、射速、弹道或射线检测。
- `Damageable`：承受伤害、死亡或重置。
- `HitFeedback`：命中特效、数字反馈、震屏和音效。
- `TargetDummy`：训练靶或简单测试目标。

### World

- `GreyboxArena`：小型城市地图测试场景。
- `SpawnPoint`：玩家和目标生成点。
- `GameplayDebugPanel`：FPS、速度、距离、技能状态等调试信息。

## Folder Conventions

```text
Assets/_Project/
  Art/
    Characters/
    Environment/
    VFX/
  Audio/
    SFX/
    Music/
  Prefabs/
    Characters/
    Weapons/
    UI/
  Scenes/
  Scripts/
    Player/
    Camera/
    Combat/
    UI/
    World/
  Settings/
```

## Mobile Performance Rules

- 先以低中端 Android 设备作为测试目标。
- 控制场景内实时灯光数量。
- 早期不使用复杂后处理。
- 灰盒阶段优先验证可玩性，不追求高精度模型。
- 每次加入新系统后都做一次真机测试。
- 对象频繁生成时使用对象池，避免战斗中频繁 Instantiate / Destroy。

## Technical Risks

- 架构太简单会导致 Demo 后期难以扩展，架构太重又会拖慢早期原型。前期采用“模块清晰、接口轻量、配置数据化”的折中方案。
- 联机同步是高风险模块，等单机手感稳定后再研究。
- 城市大地图会带来性能、碰撞、遮挡和内存压力，早期地图必须小。
- 机甲动画和角色控制容易互相影响，早期动作应保持简单。
- 移动端 UI 按钮布局会直接影响战斗体验，需要真机反复调整。

## First Implementation Order

1. Unity 工程和 Android 构建配置
2. 空场景、地面、摄像机
3. 机甲占位模型和移动控制
4. 移动端虚拟摇杆和视角拖拽
5. 基础射击和训练靶
6. 冲刺 / 推进技能
7. 灰盒城市地图
8. 真机性能和手感调试
