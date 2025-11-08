// src/services/MenuService.ts
import { Menu, showMessage, openTab, Dialog } from "siyuan";
import {
  MenuAction,
  MenuItemConfig,
  MenuServiceDependencies,
} from "../types/menu";

// 导入 GroupManager 组件
import GroupManager from "../GroupManager/GroupManager.svelte";

export class MenuService {
  private dependencies: MenuServiceDependencies;

  constructor(dependencies: MenuServiceDependencies) {
    this.dependencies = dependencies;
  }

  // ==================== 公开接口方法 ====================

  /**
   * 构建主菜单（用于顶部栏）
   */
  buildMainMenu(rect?: DOMRect): void {
    const menu = new Menu("card-group-main-menu");
    this.buildMenuContent(menu);
    this.showMenu(menu, rect);
  }

  /**
   * 构建分组上下文菜单
   */
  buildGroupContextMenu(group: any, rect?: DOMRect): void {
    const menu = new Menu("card-group-context-menu");
    this.buildGroupMenuContent(menu, group);
    this.showMenu(menu, rect);
  }

  /**
   * 执行菜单动作
   */
  async executeMenuAction(action: MenuAction): Promise<void> {
    try {
      // 添加空值检查
      if (!action || !action.type) {
        console.error("无效的菜单动作:", action);
        return;
      }

      switch (action.type) {
        case "OPEN_SETTING":
          await this.openSetting();
          break;
        case "CREATE_RIFF_CARDS":
          if (action.groupId) {
            await this.createRiffCardsByGroup(action.groupId);
          }
          break;
        default:
          console.warn("未知的菜单动作:", action);
      }
    } catch (error) {
      console.error("执行菜单动作失败:", error);
      showMessage("操作执行失败，请查看控制台");
    }
  }

  // ==================== 菜单内容构建 ====================

  /**
   * 构建主菜单内容
   */
  private buildMenuContent(menu: Menu): void {
    const menuItems = this.getMainMenuItems();

    menuItems.forEach((item) => {
      if (item.separatorBefore) {
        menu.addSeparator();
      }

      // 添加空值检查和类型保护
      if (item.action && item.action.type) {
        menu.addItem({
          icon: item.icon,
          label: item.label,
          click: () => this.executeMenuAction(item.action!),
          disabled: item.enabled === false,
        });
      } else {
        console.warn("跳过无效的菜单项:", item);
      }
    });
  }

  /**
   * 构建分组上下文菜单内容
   */
  private buildGroupMenuContent(menu: Menu, group: any): void {
    const menuItems = this.getGroupContextMenuItems(group);

    menuItems.forEach((item) => {
      if (item.separatorBefore) {
        menu.addSeparator();
      }

      // 添加空值检查和类型保护
      if (item.action && item.action.type) {
        menu.addItem({
          icon: item.icon,
          label: item.label,
          click: () => this.executeMenuAction(item.action!),
          disabled: item.enabled === false,
        });
      } else {
        console.warn("跳过无效的菜单项:", item);
      }
    });
  }

  /**
   * 获取主菜单项配置
   */
  private getMainMenuItems(): MenuItemConfig[] {
    const groups = this.dependencies.dataManager.getEnabledGroups();
    const items: MenuItemConfig[] = [
      {
        icon: "iconSettings",
        label: "专项闪卡设置",
        action: { type: "OPEN_SETTING" },
      },
    ];

    // 添加分组菜单项
    if (groups.length > 0) {
      items.push({ separatorBefore: true });

      groups.forEach((group) => {
        items.push({
          icon: "iconRiffCard",
          label: `复习：${group.name}`,
          action: {
            type: "CREATE_RIFF_CARDS",
            groupId: group.id,
            groupName: group.name,
          },
        });
      });
    } else {
      items.push({ separatorBefore: true });
      items.push({
        icon: "iconInfo",
        label: "暂无启用的分组 - 点击设置",
        action: { type: "OPEN_SETTING" },
      });
    }

    return items;
  }

  /**
   * 获取分组上下文菜单项配置
   */
  private getGroupContextMenuItems(group: any): MenuItemConfig[] {
    return [
      {
        icon: "iconRiffCard",
        label: `复习 ${group.name}`,
        action: {
          type: "CREATE_RIFF_CARDS",
          groupId: group.id,
          groupName: group.name,
        },
      },
      { separatorBefore: true },
      {
        icon: "iconSettings",
        label: "打开设置",
        action: { type: "OPEN_SETTING" },
      },
    ];
  }

  // ==================== 菜单显示逻辑 ====================

  /**
   * 显示菜单
   */
  private showMenu(menu: Menu, rect?: DOMRect): void {
    if (this.dependencies.isMobile) {
      menu.fullscreen();
    } else if (rect) {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    } else {
      // 默认位置
      menu.open({
        x: window.innerWidth - 100,
        y: 100,
      });
    }
  }

  // ==================== 业务方法实现 ====================

  /**
   * 打开设置面板
   */
  private async openSetting(): Promise<void> {
    try {
      let dialog = new Dialog({
        title: "专项闪卡设置",
        content: `<div id="SettingPanel" style="height: 100%;"></div>`,
        width: "1000px",
        height: "650px",
        destroyCallback: () => {
          // 配置更新回调
          if (this.dependencies.onConfigUpdate) {
            this.dependencies.onConfigUpdate();
          }
        },
      });

      // 渲染 GroupManager 组件
      new GroupManager({
        target: dialog.element.querySelector("#SettingPanel"),
        props: {
          plugin: this.dependencies.plugin,
          dataManager: this.dependencies.dataManager,
          onConfigUpdate: async () => {
            if (this.dependencies.onConfigUpdate) {
              await this.dependencies.onConfigUpdate();
            }
          },
        },
      });
    } catch (error) {
      console.error("打开设置失败:", error);
      showMessage("打开设置失败，请查看控制台");
    }
  }

  /**
   * 为分组创建闪卡
   */
  private async createRiffCardsByGroup(groupId: string): Promise<void> {
    try {
      const group = this.dependencies.dataManager.getGroupById(groupId);
      if (!group) {
        showMessage(`未找到分组: ${groupId}`);
        return;
      }

      const blockIds =
        await this.dependencies.dataManager.provideGroupCacheBlockIds(group);

      if (blockIds.length === 0) {
        showMessage(`分组 "${group.name}" 没有找到可复习的卡片`);
        return;
      }

      await this.openGroupRiffCards(blockIds, group.name);
    } catch (error) {
      console.error(`创建分组 ${groupId} 的闪卡时发生错误:`, error);
      showMessage(`创建闪卡失败: ${error.message}`);
    }
  }

  /**
   * 打开分组闪卡复习界面
   */
  private async openGroupRiffCards(
    blockIds: string[],
    groupName: string
  ): Promise<void> {
    const deckID = "20230218211946-2kw8jgx";

    try {
      const cardsData = await this.dependencies.cardUtils.buildDueCardsData(
        deckID,
        blockIds
      );

      if (!cardsData) {
        throw new Error("构建闪卡数据失败");
      }

      this.openRiffReviewTab(`${groupName}-专项闪卡`, cardsData);
      //showMessage(`已打开 ${groupName} 的复习界面`);
    } catch (error) {
      console.error("打开闪卡复习界面时发生错误:", error);
      throw error;
    }
  }

  /**
   * 打开闪卡复习标签页
   */
  private openRiffReviewTab(
    title: string,
    cardsData: {
      cards: any[];
      unreviewedCount: number;
      unreviewedNewCardCount: number;
      unreviewedOldCardCount: number;
    }
  ): void {
    openTab({
      app: this.dependencies.plugin.app,
      custom: {
        title: title,
        icon: "iconRiffCard",
        id: "siyuan-card",
        data: {
          cardType: "all",
          id: "",
          title: "自定义闪卡",
          cardsData: cardsData,
        },
      },
    });
  }
}
