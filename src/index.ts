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
import * as CardUtils from "./utils/index";
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
    this.groupActionService = new GroupActionService();
    this.automationService = new AutomationService(this.dataManager, CardUtils);

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
      groupActionService: this.groupActionService,
      cardUtils: CardUtils,
      isMobile: this.isMobile,
      onConfigUpdate: async () => {
        await this.preloadGroupData(true);
      },
    });

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

        // 使用 MenuService 构建菜单
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

  private async preloadGroupData(forceUpdate: boolean = false): Promise<void> {
    const groups = this.dataManager.getEnabledGroups();
    for (const group of groups) {
      try {
        await this.dataManager.executeAndCacheQuery(group, forceUpdate);
      } catch (error) {
        console.error(`预加载分组 "${group.name}" 失败:`, error);
      }
    }
  }
}
