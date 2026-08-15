# Maneuver Field Alpha / 机动战场 Alpha

> 暂定名：Maneuver Field Alpha  
> 类型定位：原创机甲都市竞技手游  
> 引擎方向：Unity 2022.3 LTS + URP

机动战场 Alpha 是一个面向移动端的原创 3D 机甲竞技游戏项目。核心体验是驾驶员战斗、机甲召唤、立体都市战场与小队竞技；角色、机甲、美术、地图、UI、音效、数值和世界观均保持原创。

## 当前阶段

项目已完成 Unity URP 工程初始化，当前目标是完成单机战斗垂直切片：驾驶员、机甲、射击、AI、都市测试场和 Android 真机性能验证。正式多人联机将在基础玩法稳定后进入小规模技术验证。

## 工程结构

    .
    |-- ManeuverFieldAlpha/       Unity 工程根目录
    |-- docs/                     产品、玩法、技术和开发资料
    |-- prototype/web-demo/       已有浏览器 3D 参考 Demo，不是正式客户端目标
    |-- Assets/                   远程工程骨架预留目录
    |-- Packages/                 远程工程骨架预留目录
    `-- ProjectSettings/          远程工程骨架预留目录

Unity 项目应从 ManeuverFieldAlpha/ 打开。不要提交 Unity 自动生成的 Library/、Temp/、Logs/、UserSettings/、解决方案和 C# 工程文件。

## 项目文档

### 当前执行方案

- [项目总览](docs/00_project_overview.md)
- [产品文档](docs/01_product_document.md)
- [需求文档](docs/02_requirements_document.md)
- [功能文档](docs/03_feature_document.md)
- [开发文档](docs/04_development_document.md)

### 既有设计与技术资料

- [玩法设计草案](docs/GAME_DESIGN.md)
- [前期开发准备](docs/PRE_PRODUCTION.md)
- [Unity 技术方案](docs/TECHNICAL_PLAN.md)
- [工程架构设计](docs/ARCHITECTURE.md)
- [网络服务与客户端资源关系](docs/NETWORK_AND_ASSETS.md)
- [开发协作流程](docs/DEVELOPMENT_WORKFLOW.md)
- [开发路线图](docs/ROADMAP.md)

## 开发约定

- 平台优先级：Android，Windows 编辑器用于开发和调试，iOS 在后续适配。
- 渲染基线：Universal Render Pipeline，不以 HDRP 作为手游基线。
- 玩法验证顺序：灰盒与占位资源优先，再进入正式美术与内容生产。
- 多人架构：正式对战采用服务器权威，客户端不直接裁决伤害、生命值和胜负。
- 资产来源：导入外部模型、贴图、动作和插件前必须保留许可证与来源记录。
