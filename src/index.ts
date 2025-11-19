// src/index.ts
import {
  Plugin,
  adaptHotkey,
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
import { DataBaseService } from "./services/DataBaseService";

export default class PluginSample extends Plugin {
  private isMobile: boolean;
  private timerService: TimerService;
  private dataManager: DataManager;
  private groupActionService: GroupActionService;
  private automationService: AutomationService;
  private menuService: MenuService;

  async onload() {
    // 注册快捷键命令
    this.addCommand({
      langKey: "executeDataBaseCardsManagement",
      langText: "触发：一键刷新",
      hotkey: "", // 留空让用户自定义
      callback: () => {
        this.startScheduledTasks();
        this.executeDataBaseCardsManagement();
        showMessage("专项闪卡：已触发所有自动化刷新");
      },
    });

    this.dataManager = new DataManager(this);
    await this.dataManager.initialize();
    this.groupActionService = new GroupActionService(this.dataManager);
    this.automationService = new AutomationService(this.dataManager, Utils);

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    //自用，启用数据库卡片管理任务
    const config = this.dataManager.getConfig();
    config.dataBaseCardsManagementEnabled = true;
    config.dataBaseCardsManagementInterval = 15;
    await this.executeDataBaseCardsManagement();
    this.timerService = new TimerService({
      onPriorityScan: () => {
        this.automationService.executeAutomationTasks();
      },
      onCacheUpdate: async () => {
        await this.executeCacheUpdateTasks();
      },
      onDataBaseCardsManagement: async () => {
        await this.executeDataBaseCardsManagement();
        console.log("数据库卡片管理任务启用");
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
      console.log("开始执行数据库制卡/取消制卡任务");
      await DataBaseService.processCardCreation(
        "20250920100057-khqfv5y",
        "状态：进行"
      );

      await DataBaseService.processCardRemoval(
        "20250920100057-khqfv5y",
        "状态：悬置"
      );

      await DataBaseService.processCardRemoval(
        "20250920100057-khqfv5y",
        "状态：结束"
      );

      // 执行测试
      await this.addBlocksToViewBySQL();
    } catch (error) {
      console.error("数据库制卡/取消制卡执行失败:", error);
    }
  }

  private async addBlocksToViewBySQL(): Promise<void> {
    try {
      console.log("开始使用 addBlocksToViewBySQL 函数");
      // 1. 定义属性视图 ID
      const avID = "20250920100057-khqfv5y";
      // 2. 定义视图名称
      const av = Utils.getAttributeView(avID);
      console.log(av);
      // 2. 定义 SQL 查询
      let SQL1 = `
      select * from blocks
      where id in (
          select block_id from attributes where name = 'custom-reservation'
      )
      and id not in (
          select block_id from attributes 
          where name = 'custom-avs' 
          and value like '%20250920100057-khqfv5y%'
      ) limit 99
    `;
      //3. 添加进日程数据库
      let result1 = await DataBaseService.addBlocksToViewBySQL(SQL1, avID);

      console.log(`SQL: ${SQL1}`);

      // 4. 输出结果
      console.log("执行结果:", {
        成功: result1.success,
        添加数量: result1.addedCount,
        消息: result1.message,
      });

      // 2. 定义 SQL 查询
      let SQL2 = `
      select * from blocks
      where id in (
          select block_id from attributes where name = 'custom-tomato-readingpoint'
      )
      and id not in (
          select block_id from attributes 
          where name = 'custom-avs' 
          and value like '%20250920100057-khqfv5y%'
      ) 
      limit 999
    `;
      //3. 添加进日程数据库
      let result2 = await DataBaseService.addBlocksToViewBySQL(SQL2, avID);

      console.log(`SQL: ${SQL2}`);

      // 4. 输出结果
      console.log("执行结果:", {
        成功: result2.success,
        添加数量: result2.addedCount,
        消息: result2.message,
      });
    } catch (error) {
      console.error("测试过程中发生错误:", error);
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
