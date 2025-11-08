// src/index.ts
import {
  Plugin,
  showMessage,
  confirm,
  Dialog,
  Menu,
  openTab,
  getFrontend,
  fetchSyncPost,
} from "siyuan";
import GroupManager from "./GroupManager/GroupManager.svelte";
import { DataManager } from "./DataManager/DataManager";
import * as Utils from "./utils/index";
import { GroupActionService } from "./services/GroupActionService";
import { AutomationService } from "./services/AutomationService";
import { MenuService } from "./services/MenuService";
import { TimerService } from "./services/TimerService";

export default class PluginSample extends Plugin {
  private isMobile: boolean;
  private timerService: TimerService;
  private dataManager: DataManager;
  private groupActionService: GroupActionService;
  private automationService: AutomationService;
  private menuService: MenuService;

  // ==================== 生命周期方法 ====================

  async onload() {
    this.dataManager = new DataManager(this);
    await this.dataManager.initialize();
    this.groupActionService = new GroupActionService(this.dataManager);
    this.automationService = new AutomationService(this.dataManager, Utils);

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    // 初始化 TimerService
    this.timerService = new TimerService({
      onPriorityScan: () => {
        this.automationService.executeAutomationTasks();
        console.log("自动化任务执行完毕");
      },
      onCacheUpdate: async () => {
        await this.executeCacheUpdateTasks();
        console.log("缓存更新任务执行完毕");
      },
    });

    // 初始化 MenuService
    this.menuService = new MenuService({
      plugin: this,
      dataManager: this.dataManager,
      Utils: Utils,
      isMobile: this.isMobile,
      onConfigUpdate: async () => {
        await this.preloadGroupData(true);
      },
    });

    await this.preloadGroupData(true);
    this.startScheduledTasks();

    // 在实际使用中，通常这样使用：
    if (await Utils.isSelfUseSwitchOn()) {
      // 执行自用功能的相关逻辑
      //console.log("自用功能已开启，执行专项闪卡操作");
    } else {
      // 开关关闭时的处理
      //console.log("自用功能已关闭");
    }

    /* 测试区域
    // 测试获取完整属性视图
    const avID = "20250920100057-khqfv5y"; // 替换为你的属性视图ID
    console.log("正在获取属性视图，ID:", avID);

    try {
      const response = await fetchSyncPost("api/av/getAttributeView", {
        id: avID,
      });

      console.log("=== 属性视图完整数据 ===");
      console.log("响应状态:", response.code === 0 ? "成功" : "失败");

      if (response.code === 0 && response.data && response.data.av) {
        const av = response.data.av;
        console.log("属性视图对象(完整数据):", av);
        console.log("\n====================\n");
        console.log("属性视图基本信息:");
        console.log("- ID:", av.id);
        console.log("- 名称:", av.name);
        console.log("- 格式版本:", av.spec);
        console.log("- 当前视图ID:", av.viewID);

        console.log("\n键信息:");
        if (av.keyIDs && av.keyIDs.length > 0) {
          console.log("- 键ID列表:", av.keyIDs);
        } else {
          console.log("- 无键ID列表");
        }

        console.log("\n键值对:");
        if (av.keyValues && av.keyValues.length > 0) {
          av.keyValues.forEach((kv, index) => {
            console.log(`  ${index + 1}. 键:`, kv.key);
            if (kv.values && kv.values.length > 0) {
              console.log(`     值:`, kv.values);
            } else {
              console.log(`     无值`);
            }
          });
        } else {
          console.log("- 无键值对");
        }

        console.log("\n视图配置:");
        if (av.views && av.views.length > 0) {
          console.log(`- 共有 ${av.views.length} 个视图`);
          av.views.forEach((view, index) => {
            console.log(
              `  ${index + 1}. 视图ID: ${view.id}, 名称: ${view.name}, 类型: ${
                view.type
              }`
            );
          });
        } else {
          console.log("- 无视图配置");
        }
      } else {
        console.log("获取属性视图失败:", response);
      }
    } catch (error) {
      console.error("获取属性视图时发生错误:", error);
    }
    // 测试区域结束/*/
    // 最简单直接的调用
    /*await Utils.getBoundBlockIDsByViewName("制卡", "20250920100057-khqfv5y")
      .then((blockIDs) => {
        console.log("制卡视图绑定的块:", blockIDs);
      })
      .catch((error) => {
        console.error("获取失败:", error);
      });
      */
  }

  onLayoutReady() {
    const topBarElement = this.addTopBar({
      icon: "iconSparkles",
      title: this.i18n.addTopBarIcon,
      position: "right",
      callback: () => {
        let rect: DOMRect | undefined;

        if (!this.isMobile) {
          rect = topBarElement.getBoundingClientRect();
          if (rect.width === 0) {
            const moreBar = document.querySelector("#barMore");
            if (moreBar) {
              rect = moreBar.getBoundingClientRect();
            }
          }
          if (rect && rect.width === 0) {
            const pluginsBar = document.querySelector("#barPlugins");
            if (pluginsBar) {
              rect = pluginsBar.getBoundingClientRect();
            }
          }
        }

        // 使用 MenuService 构建菜单
        this.menuService.buildMainMenu(rect);
        //const groups = this.dataManager.getEnabledGroups();
        //this.menuService.buildGroupContextMenu(groups[0], rect);
      },
    });
  }

  async onunload() {
    this.stopScheduledTasks();
  }

  async uninstall() {
    this.removeData("plugin-config.json");
    this.removeData("cache-data.json");
  }

  // ==================== 公开方法 ====================

  openSetting(): void {
    let dialog = new Dialog({
      title: "专项闪卡设置",
      content: `<div id="SettingPanel" style="height: 100%;"></div>`,
      width: "1000px",
      height: "650px",
      destroyCallback: () => {
        this.preloadGroupData(true);
        this.restartScheduledTasks();
      },
    });

    new GroupManager({
      target: dialog.element.querySelector("#SettingPanel"),
      props: {
        plugin: this,
        dataManager: this.dataManager,
        onConfigUpdate: async () => {
          await this.preloadGroupData(true);
        },
      },
    });
  }

  /**
   * 打开分组上下文菜单
   */
  openGroupContextMenu(group: any, rect?: DOMRect): void {
    this.menuService.buildGroupContextMenu(group, rect);
  }

  // 委托给 GroupActionService 的方法保持不变
  async handleBatchPriority(group: any): Promise<void> {
    return this.groupActionService.handleBatchPriority(group);
  }

  handleOpenInDocumentSQL(group: any): void {
    this.groupActionService.handleOpenInDocumentSQL(group);
  }

  async handleOpenInDocumentAllCards(group: any): Promise<void> {
    return this.groupActionService.handleOpenInDocumentAllCards(group);
  }

  // ==================== 私有方法 - 定时任务管理 ====================

  private startScheduledTasks(): void {
    const config = this.dataManager.getConfig();
    this.timerService.start(config);
  }

  private stopScheduledTasks(): void {
    this.timerService.stop();
  }

  private restartScheduledTasks(): void {
    const config = this.dataManager.getConfig();
    this.timerService.restart(config);
  }

  private async executeCacheUpdateTasks() {
    try {
      await this.preloadGroupData(true);
    } catch (error) {
      console.error("缓存更新任务执行失败:", error);
    }
  }

  // ==================== 私有方法 - 数据管理 ====================

  private async preloadGroupData(forceUpdate: boolean = true): Promise<void> {
    const groups = this.dataManager.getEnabledGroups();
    for (const group of groups) {
      try {
        await this.dataManager.provideGroupCacheBlockIds(group, forceUpdate);
      } catch (error) {
        console.error(`预加载分组 "${group.name}" 失败:`, error);
      }
    }
  }
}
