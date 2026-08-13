# Development Workflow

## Branching

- `main`：保持可打开、可构建的稳定状态。
- `feature/<name>`：功能开发分支，例如 `feature/mobile-input`。
- `prototype/<name>`：实验性原型分支，例如 `prototype/boost-feel`。

## Commit Style

提交信息尽量描述实际变化：

- `Add mobile joystick prototype`
- `Tune camera follow sensitivity`
- `Create greybox arena scene`
- `Document pre-production scope`

## Unity Scene Rules

- 早期主测试场景使用 `Assets/_Project/Scenes/PrototypeScene.unity`。
- 大功能实验可以复制独立场景，避免把主测试场景弄乱。
- 不要把临时商用素材当作正式资源提交。
- 场景、Prefab、ScriptableObject 的命名要清楚，不使用 `New GameObject`、`Cube (1)` 这类默认名称。

## Asset Rules

- 占位资源放在 `Assets/_Project/Art/Placeholder`。
- 原创资源按角色、环境、特效、UI 分类。
- 外部素材必须记录来源、授权和用途。
- 不提交无授权素材，不提交从商业游戏中提取的文件。

## Code Rules

- 一个脚本只负责一个清晰职责。
- 移动、摄像机、战斗、UI 输入分开写，避免全部塞进一个控制器。
- 可调参数暴露到 Inspector，方便手感调试。
- 关键手感参数记录默认值，避免调乱后无法回退。
- 新功能优先放入对应模块目录，不允许随意把业务逻辑写进 UI、场景脚本或全局管理器。
- Demo 阶段可以快速验证，但稳定后必须整理为配置、接口和可复用组件。

## Architecture Review Checklist

每个核心功能合并前至少确认：

- [ ] 该功能属于哪个模块已经明确
- [ ] 配置数据没有硬编码在多个脚本里
- [ ] UI 不直接控制战斗、移动或数值结算
- [ ] 场景对象引用不会导致跨模块强耦合
- [ ] 后续增加机甲、武器、技能或地图时不需要复制大量代码

## Testing Checklist

每次做完一个核心玩法功能，至少检查：

- [ ] Unity Editor 内能运行
- [ ] Android 能打包
- [ ] 真机可以进入测试场景
- [ ] 没有明显报错
- [ ] 移动和摄像机没有严重卡顿
- [ ] 新增功能不会破坏已有移动、射击或冲刺

## Prototype Review Notes

建议每次真机测试后记录：

- 测试日期
- 测试设备
- 平均帧率
- 操作手感问题
- 摄像机问题
- 战斗反馈问题
- 下一轮最优先调整项
