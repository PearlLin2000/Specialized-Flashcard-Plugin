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
import * as CardUtils from "./utils";
import { GroupActionService } from "./GroupActionService"; // 新增导入

export default class PluginSample extends Plugin {
  private isMobile: boolean;
  private priorityScanTimer: number | null = null;
  private cacheUpdateTimer: number | null = null;
  private dataManager: DataManager;
  private groupActionService: GroupActionService; // 新增服务实例

  // ==================== 生命周期方法 ====================

  async onload() {
    this.dataManager = new DataManager(this);
    await this.dataManager.initialize();
    this.groupActionService = new GroupActionService(); // 初始化服务

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    await this.preloadGroupData(true);
    this.startScheduledTasks();

    const result = await fetchSyncPost("/api/riff/getRiffCards", {
      id: "20230218211946-2kw8jgx",
      page: 1,
      pageSize: 5,
    });
    console.log("测试getRiffCards请求结果:", result);
  }

  onLayoutReady() {
    const topBarElement = this.addTopBar({
      icon: "iconSparkles",
      title: this.i18n.addTopBarIcon,
      position: "right",
      callback: () => {
        if (this.isMobile) {
          this.addMenu();
        } else {
          let rect = topBarElement.getBoundingClientRect();
          if (rect.width === 0) {
            rect = document.querySelector("#barMore").getBoundingClientRect();
          }
          if (rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              .getBoundingClientRect();
          }
          this.addMenu(rect);
        }
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

  // 委托给 GroupActionService 的方法
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
    this.stopScheduledTasks();
    const config = this.dataManager.getConfig();

    this.createPriorityScanTask(config);
    this.createCacheUpdateTask(config);
  }

  private createPriorityScanTask(config: any): void {
    if (!config.priorityScanEnabled) return;

    const intervalMs = config.priorityScanInterval * 60 * 1000;
    const executeTask = () => {
      try {
        this.executePriorityScanTasks();
        console.log("优先级扫描及设置执行完毕");
      } catch (error) {
        console.error("优先级扫描任务执行失败:", error);
      }
    };

    this.priorityScanTimer = window.setInterval(executeTask, intervalMs);
    executeTask();
  }

  private createCacheUpdateTask(config: any): void {
    const intervalMs = config.cacheUpdateInterval * 60 * 1000;
    const executeTask = () => {
      try {
        this.executeCacheUpdateTasks();
        console.log("缓存更新任务执行完毕");
      } catch (error) {
        console.error("缓存更新任务执行失败:", error);
      }
    };

    this.cacheUpdateTimer = window.setInterval(executeTask, intervalMs);
    executeTask();
  }

  private stopScheduledTasks(): void {
    if (this.priorityScanTimer) {
      window.clearInterval(this.priorityScanTimer);
      this.priorityScanTimer = null;
    }

    if (this.cacheUpdateTimer) {
      window.clearInterval(this.cacheUpdateTimer);
      this.cacheUpdateTimer = null;
    }
  }

  private restartScheduledTasks() {
    this.stopScheduledTasks();
    this.startScheduledTasks();
  }

  private async executePriorityScanTasks() {
    try {
      await Promise.allSettled([
        this.postponeTodayCards(),
        this.performPriorityScan(),
      ]);
    } catch (error) {
      console.error("优先级扫描任务执行失败:", error);
    }
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
        await this.executeAndCacheQuery(group, forceUpdate);
      } catch (error) {
        console.error(`预加载分组 "${group.name}" 失败:`, error);
      }
    }
  }

  private async executeAndCacheQuery(
    group: any,
    forceUpdate: boolean = false
  ): Promise<string[]> {
    if (!forceUpdate && this.dataManager.isCacheValid(group.id)) {
      const cached = this.dataManager.getGroupCache(group.id);
      if (cached) {
        return cached.blockIds;
      }
    }

    try {
      const sqlResult = await CardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100
      );
      const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult, 5);
      await this.dataManager.updateGroupCache(group.id, blockIds);
      return blockIds;
    } catch (error) {
      console.error(`分组 ${group.name} 查询失败:`, error);
      return [];
    }
  }

  // ==================== 私有方法 - 菜单和界面 ====================

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("card-group-menu");
    const groups = this.dataManager.getEnabledGroups();

    menu.addItem({
      icon: "iconSettings",
      label: "设置",
      click: () => this.openSetting(),
    });
    menu.addSeparator();

    if (groups.length > 0) {
      groups.forEach((group) => {
        menu.addItem({
          icon: "iconRiffCard",
          label: "到期：" + group.name,
          click: () => this.createRiffCardsByGroup(group.id),
        });
      });
    }

    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }

  private async createRiffCardsByGroup(groupId: string) {
    try {
      const group = this.dataManager.getGroupById(groupId);
      if (!group) {
        showMessage(`未找到分组: ${groupId}`);
        return;
      }

      const blockIds = await this.executeAndCacheQuery(group, false);
      await this.openGroupRiffCards(blockIds, group.name);
    } catch (error) {
      console.error(`创建分组 ${groupId} 的闪卡时发生错误:`, error);
      showMessage("创建闪卡失败，请检查控制台");
    }
  }

  private async openGroupRiffCards(blockIds: string[], groupName: string) {
    const deckID = "20230218211946-2kw8jgx";

    try {
      const cardsData = await CardUtils.buildDueCardsData(deckID, blockIds);

      if (!cardsData) {
        throw new Error("构建闪卡数据失败");
      }

      this.openRiffReviewTab(`${groupName}-专项闪卡`, cardsData);
    } catch (error) {
      console.error("打开闪卡复习界面时发生错误:", error);
      throw error;
    }
  }

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
      app: this.app,
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

  // ==================== 私有方法 - 核心业务逻辑 ====================

  private async performPriorityScan(): Promise<void> {
    const config = this.dataManager.getConfig();
    if (!config.priorityScanEnabled) return;

    const enabledGroups = this.dataManager.getPriorityEnabledGroups();
    if (enabledGroups.length === 0) return;

    for (const group of enabledGroups) {
      await this.scanGroupPriority(group);
    }
  }

  private async scanGroupPriority(group: any): Promise<void> {
    try {
      const sqlResult = await CardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100
      );
      const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult, 5);

      if (!blockIds || blockIds.length === 0) {
        return;
      }

      const cards = await CardUtils.getRiffCardsByBlockIds(blockIds);
      const todayCards = CardUtils.filterPureTodayCards(cards);

      if (todayCards.length === 0) {
        return;
      }

      const cardsToUpdate = todayCards.filter(
        (card) => card.priority !== group.priority
      );

      if (cardsToUpdate.length === 0) {
        return;
      }

      await CardUtils.setCardsPriority(cardsToUpdate, group.priority);
    } catch (error) {
      console.error(`分组 "${group.name}" 优先级扫描失败:`, error);
    }
  }

  private async postponeTodayCards(): Promise<void> {
    try {
      const config = this.dataManager.getConfig();
      if (!config.postponeEnabled || config.postponeDays <= 0) return;

      const allCards =
        await window.tomato_zZmqus5PtYRi.siyuan.getRiffCardsAllFlat();
      const todayCards = CardUtils.filterPureTodayCards(allCards);

      const postponableCards = todayCards.filter((card) =>
        CardUtils.isPostponableCard(card)
      );

      if (postponableCards.length > 0) {
        await CardUtils.postponeCards(postponableCards, config.postponeDays);
      }
    } catch (error) {
      console.error("推迟操作失败:", error);
    }
  }
}

declare global {
  interface Window {
    tomato_zZmqus5PtYRi: any;
  }
}
