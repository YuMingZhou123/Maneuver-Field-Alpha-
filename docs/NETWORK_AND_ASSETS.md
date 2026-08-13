# Network and Asset Architecture

这份文档说明网络游戏中后端服务、Unity 客户端资源、角色/皮肤/材质切换之间的关系。核心原则是：后端控制权限和选择，客户端负责加载和表现。

## Main Idea

人物模型、机甲模型、衣服、材质、场景、特效、音效等资源本体通常属于 Unity 客户端内容，可能随安装包发布，也可能通过 Addressables / AssetBundle / CDN 下载。

后端一般不直接存储或渲染这些 Unity 资源。后端负责记录：

- 玩家拥有哪些机甲、皮肤、武器和道具
- 玩家当前装备了哪个机甲、皮肤和武器
- 某个资源 ID 是否可用、是否下架、是否需要热更新
- 玩家是否有权限使用某个资源
- 战斗中其他玩家使用的角色、皮肤和武器 ID

## Responsibility Split

| 内容 | 所属位置 | 说明 |
|---|---|---|
| 机甲模型 | Unity 客户端 / 资源包 | Prefab、FBX、材质、动画 |
| 皮肤材质 | Unity 客户端 / 资源包 | Material、Texture、Shader 参数 |
| 场景地图 | Unity 客户端 / 资源包 | Scene、Prefab、碰撞体、灯光 |
| 特效音效 | Unity 客户端 / 资源包 | VFX、SFX、动画事件 |
| 玩家是否拥有皮肤 | 后端背包服务 | 权限数据 |
| 玩家当前装备 | 后端玩家/装配服务 | 当前 loadout |
| 商品价格和购买 | 后端商城服务 | 商品、订单、扣费、发货 |
| 战斗同步 | 战斗服务器 | 位置、技能、命中、结算 |
| 资源版本 | 配置服务 / CDN | 版本号、assetKey、下载地址 |

## Typical Flow: Equip Skin

1. 玩家在客户端点击装备皮肤。
2. 客户端发送 EquipSkin 请求，参数是 skinId。
3. 后端检查玩家是否拥有该 skinId。
4. 后端检查该皮肤是否适用于当前机甲、是否被禁用。
5. 后端保存当前装备状态。
6. 后端返回 selectedSkinId。
7. 客户端根据 selectedSkinId 找到本地 SkinConfig。
8. 客户端通过 assetKey 加载 Prefab / Material / Texture。
9. Unity 将材质、模型或特效应用到机甲对象上。

## Example Server Data

    {
      "playerId": 10001,
      "selectedMechaId": "mecha_alpha_01",
      "selectedSkinId": "skin_alpha_red",
      "selectedWeaponId": "weapon_rifle_01",
      "ownedSkins": [
        "skin_alpha_default",
        "skin_alpha_red"
      ]
    }

后端返回的是 ID 和状态，不是 Unity 材质文件。

## Example Client Config

    skin_alpha_red
      displayName: 赤红试作型
      mechaId: mecha_alpha_01
      assetKey: mecha_alpha_skin_red
      iconKey: icon_skin_alpha_red
      rarity: rare

Unity 客户端拿到 selectedSkinId 后，通过配置找到 assetKey，再加载对应资源。

## Resource Loading Options

早期 Demo 可以直接使用本地 ScriptableObject 和项目内资源。

正式项目可以逐步演进为：

- 安装包内置基础资源
- Addressables 管理资源引用
- AssetBundle 存放可热更新资源
- CDN 分发新机甲、新皮肤、新地图和活动资源
- 客户端本地缓存下载过的资源

## Backend Services Involved

### Auth Service

负责登录、Token、账号身份。它不关心模型和材质。

### Player Service

负责昵称、等级、当前选择的机甲和基础玩家资料。

### Inventory Service

负责玩家拥有哪些机甲、皮肤、武器、道具和货币。

### Loadout Service

负责玩家当前装备方案，例如当前机甲、皮肤、武器、技能槽位。

### Shop Service

负责商品列表、价格、购买限制和购买入口。

### Payment Service

负责真实支付、订单校验、平台回调和发货安全。

### Config Service

负责下发配置版本、资源 ID、活动开关、数值表和资源更新信息。

### Battle Server

负责多人战斗中的权威状态，例如移动校验、技能释放、命中判断和战斗结算。战斗服通常只同步 mechaId、skinId、weaponId 等 ID，由客户端显示对应资源。

## Multiplayer Appearance Sync

一局战斗开始时，服务器可能广播：

    {
      "players": [
        {
          "playerId": 10001,
          "mechaId": "mecha_alpha_01",
          "skinId": "skin_alpha_red",
          "weaponId": "weapon_rifle_01"
        },
        {
          "playerId": 10002,
          "mechaId": "mecha_beta_01",
          "skinId": "skin_beta_default",
          "weaponId": "weapon_cannon_01"
        }
      ]
    }

每个客户端收到这些 ID 后，在本地加载对应机甲、皮肤和武器表现。服务器不会把模型文件实时传给每个玩家。

## Client-Side Early Design

Demo 阶段建议先做这些配置类型：

- MechaConfig：机甲 ID、名称、血量、速度、能量、默认皮肤
- SkinConfig：皮肤 ID、适用机甲、材质、图标、assetKey
- WeaponConfig：武器 ID、伤害、射速、射程、表现资源
- SkillConfig：技能 ID、冷却、消耗、表现资源

未来接后端时，只要让后端 ID 和客户端配置 ID 对齐，就可以从本地 Demo 平滑过渡到账号、背包、商城和联机。

## Important Rules

- 客户端负责显示，不代表客户端拥有最终权限。
- 后端返回 ID，客户端根据 ID 找资源。
- 商城卖的是道具/皮肤 ID，不是直接卖 Material 文件。
- 背包记录拥有关系，Loadout 记录当前装备。
- 战斗服同步战斗权威状态和外观 ID，不传大资源文件。
- 新资源上线需要配置版本和资源版本一起管理。
- 不要把正式资源权限只写在客户端，否则容易被篡改。

## Maneuver Field Alpha Recommendation

当前阶段先在 Unity 中实现本地配置和资源切换：

1. SkinConfig 管理皮肤 ID 和材质。
2. MechaConfig 关联可用皮肤。
3. 本地 Loadout 保存当前选择。
4. UI 选择皮肤时只改变 selectedSkinId。
5. MechaSkinApplier 根据 selectedSkinId 应用材质。

后续如果加入服务器，只需要把本地 Loadout 换成后端返回的 Loadout 数据，不需要重写整个客户端资源系统。

