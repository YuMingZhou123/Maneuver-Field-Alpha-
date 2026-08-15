# 开发文档

## 工程基线

- 引擎：Unity 2022.3 LTS。
- 项目模板：3D (URP)，即 Universal Render Pipeline。
- 目标平台：Android 优先，Windows 作为开发与调试平台。
- 许可证：原型阶段使用 Unity Personal；项目商业化前重新核对收入、融资和服务客户对应的官方授权门槛。

## 为什么选择 URP

URP 是移动端 3D 项目的默认渲染方案。它在画面表现、材质体系、可扩展性和 Android 性能之间平衡较好，适合第三人称机甲、都市场景、技能特效和后续 PC 兼容。

- 不选 HDRP：其渲染成本更高，适合高配 PC 和主机，不适合作为手游优先工程基线。
- 不选 2D：项目需要第三人称角色、机甲和立体城市空间。
- 不选 3D Core：虽然可用，但 URP 提供更明确的移动端渲染和材质工作流。

## Unity 创建参数

- 项目路径：`D:\\Git_Manage\\GitHub\\机动战场Alpha`
- 模板：3D (URP) 或 Universal 3D。
- 安装模块：Android Build Support、Android SDK / NDK / OpenJDK、Windows Build Support。
- 初始场景：`Assets/Scenes/Boot.unity`、`Assets/Scenes/Arena_Prototype.unity`。
- 颜色空间：Linear。
- 输入系统：Input System Package。

## 建议包

- Input System：统一 PC 和移动端输入。
- Cinemachine：第三人称相机、机甲相机与战斗镜头。
- AI Navigation：导航网格与敌方 AI。
- Addressables：后续地图、模型和皮肤的异步加载。
- TextMeshPro：UI 文本。

引入第三方联网框架前，先完成单机垂直切片并做独立技术评估。

## 目录规范

```text
Assets/
  Art/
    Characters/
    Mecha/
    Environment/
    Materials/
  Audio/
  Prefabs/
    Player/
    Mecha/
    Props/
  Scenes/
  Scripts/
    Core/
    Player/
    Mecha/
    Combat/
    AI/
    UI/
  Settings/
```

## 资产导入

- `D:\\Git_Manage\\GitHub\\3Dmodel` 是模型源仓库，不直接作为 Unity 工程根目录。
- 每个导入模型必须检查许可证、比例、坐标轴、骨骼、贴图引用和 LOD。
- 导入到 `Assets/Art/Mecha` 的资产应保留原始来源记录与许可证副本。
- 需要修改的模型先在 Blender 处理，再导出为 Unity 友好的 FBX 或 GLB。

## 多人联机架构

URP 不限制多人联机能力；渲染管线与网络层独立。正式竞技玩法必须使用服务器权威架构，不能以纯 P2P 作为最终方案。

### 阶段一：离线垂直切片

先验证角色、机甲、射击、地图、AI 和性能，不引入网络复杂度。

### 阶段二：小规模联机验证

目标为 2 至 4 人房间。验证输入同步、移动预测、命中判定、机甲召唤和断线重连。候选框架为 Photon Fusion 或 FishNet，选择前比较延迟、服务器部署、商业成本和团队维护能力。

### 阶段三：正式服务端

- Dedicated Server 负责战局、伤害、资源刷新、安全区、机甲状态和胜负结算。
- 客户端发送输入并做局部预测，不直接决定命中或生命值。
- 服务端保存比赛事件与异常日志，为反作弊和回放预留接口。

## 性能预算

- Android 中端设备：30 FPS 最低目标，60 FPS 优化目标。
- 首个原型控制在少量动态角色、单张地图和有限粒子特效。
- 机甲模型必须配置 LOD、合并材质并控制骨骼数量。
- 使用烘焙光照、GPU Instancing、对象池和 Addressables，避免运行时频繁 Instantiate / Destroy。

## 首个开发 Sprint

1. 创建 Unity URP 工程与目录。
2. 导入一个合法机甲模型，完成比例和材质校验。
3. 创建驾驶员控制器、第三人称相机和测试场。
4. 创建默认机甲 Prefab 与上下机流程。
5. 添加基础射击、伤害、AI 和胜负 UI。
6. 导出 Android 测试包并记录性能。
