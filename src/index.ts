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
import {
  processCardCreation,
  processCardRemoval,
} from "./services/DataBaseService";

export default class PluginSample extends Plugin {
  private isMobile: boolean;
  private timerService: TimerService;
  private dataManager: DataManager;
  private groupActionService: GroupActionService;
  private automationService: AutomationService;
  private menuService: MenuService;

  async onload() {
    this.dataManager = new DataManager(this);
    await this.dataManager.initialize();
    this.groupActionService = new GroupActionService(this.dataManager);
    this.automationService = new AutomationService(this.dataManager, Utils);

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    this.timerService = new TimerService({
      onDataBaseCardsManagement: async () => {
        if (await Utils.isSelfUseSwitchOn()) {
          const config = this.dataManager.getConfig();
          config.dataBaseCardsManagementEnabled = true;
          await this.executeDataBaseCardsManagement();
          console.log("数据库卡片管理任务启用");
        }
      },
      onPriorityScan: () => {
        this.automationService.executeAutomationTasks();
      },
      onCacheUpdate: async () => {
        await this.executeCacheUpdateTasks();
      },
    });

    this.menuService = new MenuService({
      plugin: this,
      dataManager: this.dataManager,
      cardUtils: Utils,
      isMobile: this.isMobile,
      onConfigUpdate: async () => {
        await this.preloadGroupData(true);
      },
    });
    // 执行测试
    await this.testBatchSetDatabaseField();

    await this.preloadGroupData(true);
    this.startScheduledTasks();
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

        this.menuService.buildMainMenu(rect);
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

  openGroupContextMenu(group: any, rect?: DOMRect): void {
    this.menuService.buildGroupContextMenu(group, rect);
  }

  async handleBatchPriority(group: any): Promise<void> {
    return this.groupActionService.handleBatchPriority(group);
  }

  handleOpenInDocumentSQL(group: any): void {
    this.groupActionService.handleOpenInDocumentSQL(group);
  }

  async handleOpenInDocumentAllCards(group: any): Promise<void> {
    return this.groupActionService.handleOpenInDocumentAllCards(group);
  }

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

  private async executeDataBaseCardsManagement(): Promise<void> {
    try {
      await processCardCreation("20250920100057-khqfv5y", "制卡");
      await processCardRemoval("20250920100057-khqfv5y", "取消制卡");
      await processCardRemoval("20250920100057-khqfv5y", "取消制卡2");
    } catch (error) {
      console.error("数据库卡片管理任务执行失败:", error);
    }
  }
  // 测试批量设置数据库字段
  private async testBatchSetDatabaseField() {
    try {
      const avID = "20250920100057-khqfv5y";

      // 使用 await 获取实际的块数据
      const block = await Utils.getBlockByID("20251109155151-p6b03rb");

      // 将单个块包装成数组
      const blocks = [block];

      console.log("获取的块数据:", blocks);

      // 这里需要补充具体的 keyID 和 value
      const keyID = "20250920101255-stkqgnr"; // 替换为实际的字段Key
      const value = "将来"; // 替换为实际的字段值

      // 可选参数
      const viewID = undefined; // 如果有视图ID可以传入
      const databaseBlockID = undefined; // 如果有数据库块ID可以传入

      console.log("开始批量设置数据库字段...");

      await Utils.batchSetDatabaseField(
        avID,
        blocks,
        keyID,
        value,
        viewID,
        databaseBlockID
      );

      console.log("批量设置数据库字段测试完成！");
    } catch (error) {
      console.error("测试失败:", error);
    }
  }

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
