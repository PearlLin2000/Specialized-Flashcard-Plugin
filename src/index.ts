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

export default class PluginSample extends Plugin {
  private isMobile: boolean;
  private priorityScanTimer: number | null = null;
  private cacheUpdateTimer: number | null = null;
  private dataManager: DataManager;

  async onload() {
    // 初始化数据管理器
    this.dataManager = new DataManager(this);
    await this.dataManager.initialize();

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    // 初始阶段：加载配置和缓存数据，并强制更新一次缓存数据  // true 表示强制更新缓存
    await this.preloadGroupData(true);

    this.startScheduledTasks();
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
    // 插件关闭时：无需清理数据，只停止定时任务
    this.stopScheduledTasks();
  }

  async uninstall() {
    this.removeData("plugin-config.json");
    this.removeData("cache-data.json");
  }

  openSetting(): void {
    let dialog = new Dialog({
      title: "闪卡分组管理",
      content: `<div id="SettingPanel" style="height: 100%;"></div>`,
      width: "800px",
      height: "600px",
      destroyCallback: () => {
        // 变更配置后：进行一次缓存数据的更新
        this.preloadGroupData(true); // true 表示强制更新缓存
        this.restartScheduledTasks(); // 重新启动定时任务（配置可能改变了扫描间隔）
      },
    });

    new GroupManager({
      target: dialog.element.querySelector("#SettingPanel"),
      props: {
        plugin: this,
        dataManager: this.dataManager,
        // *** MODIFIED ***
        // GroupManager 内部已经通过 dataManager 保存了变更。
        // 这里只需要在配置变更后触发缓存的强制更新即可。
        onConfigUpdate: async () => {
          await this.preloadGroupData(true);
        },
      },
    });
  }

  private getGroupsConfig(): any[] {
    return this.dataManager.getGroups();
  }

  async handleBatchPriority(group: any): Promise<void> {
    try {
      // 使用分页查询替代直接查询
      const sqlResult = await CardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100
      );

      // 使用优化后的递归查找
      const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult, 5);

      if (!blockIds || blockIds.length === 0) {
        showMessage(`分组 "${group.name}" 未找到匹配的块`);
        return;
      }

      const cards = await CardUtils.getRiffCardsByBlockIds(blockIds);

      if (cards.length === 0) {
        showMessage(`分组 "${group.name}" 未找到对应的闪卡`);
        return;
      }

      // 使用 utils.ts 中的封装函数替代直接调用
      await CardUtils.setCardsPriority(cards, group.priority);
      showMessage(
        `触发 "${group.name}" 的闪卡设置优先级 ${group.priority} 调用，请耐心等待`
      );
    } catch (error) {
      console.error(`批量设置优先级失败:`, error);
      showMessage("批量设置优先级失败，请检查控制台");
    }
  }

  handleOpenInDocument(group: any): void {
    CardUtils.openSQLFlow(group.sqlQuery, `${group.name}-SQL查询`);
    showMessage(
      `请确保文档流插件安装并启用。
      本次调用的文档流显示的为原始查询，不包含内置的闪卡过滤。`
    );
  }

  private startScheduledTasks(): void {
    this.stopScheduledTasks();

    const config = this.dataManager.getConfig();

    // 使用辅助方法创建定时任务，统一错误处理
    this.createPriorityScanTask(config);
    this.createCacheUpdateTask(config);
  }

  private createPriorityScanTask(config: any): void {
    if (!config.priorityScanEnabled) return;

    const intervalMs = config.priorityScanInterval * 60 * 1000;

    // 封装任务执行逻辑
    const executeTask = () => {
      try {
        this.executePriorityScanTasks();
        console.log("优先级扫描及设置执行完毕");
      } catch (error) {
        console.error("优先级扫描任务执行失败:", error);
        // 可以根据错误类型决定是否停止定时器
      }
    };

    /*console.log(
      `启动优先级扫描及设置任务，间隔${config.priorityScanInterval}分钟`
    );*/

    this.priorityScanTimer = window.setInterval(executeTask, intervalMs);

    // 立即执行一次
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

    //console.log(`启动缓存更新任务，间隔${config.cacheUpdateInterval}分钟`);

    this.cacheUpdateTimer = window.setInterval(executeTask, intervalMs);

    // 立即执行一次
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

  private async performPriorityScan(): Promise<void> {
    const config = this.dataManager.getConfig();
    if (!config.priorityScanEnabled) return;

    const enabledGroups = this.getGroupsConfig().filter(
      (group) => group.enabled && group.priorityEnabled
    );
    if (enabledGroups.length === 0) return;

    //(`开始自动优先级扫描，处理${enabledGroups.length}个分组`);

    for (const group of enabledGroups) {
      await this.scanGroupPriority(group);
    }
  }

  private async preloadGroupData(forceUpdate: boolean = false): Promise<void> {
    const groups = this.getGroupsConfig().filter((group) => group.enabled);
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
    const config = this.dataManager.getConfig();
    const cacheMaxAgeMs = config.cacheUpdateInterval * 60 * 1000;

    if (
      !forceUpdate &&
      this.dataManager.isCacheValid(group.id, cacheMaxAgeMs)
    ) {
      const cached = this.dataManager.getGroupCache(group.id);
      if (cached) {
        //(`使用缓存数据 for group: ${group.name}`);
        return cached.blockIds;
      }
    }

    //(`开始执行分组查询: ${group.name}`);

    try {
      // 使用分页查询替代直接查询
      const sqlResult = await CardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100
      );
      /*(
        `分组 ${group.name} 查询完成，获取 ${sqlResult.length} 条原始数据`
      );*/

      // 使用优化后的递归查找
      const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult, 5);
      /*console.log(
        `分组 ${group.name} 递归查找完成，得到 ${blockIds.length} 个闪卡块`
      );*/

      await this.dataManager.updateGroupCache(group.id, blockIds);
      return blockIds;
    } catch (error) {
      console.error(`分组 ${group.name} 查询失败:`, error);
      // 返回空数组而不是抛出错误，避免影响其他分组
      return [];
    }
  }

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("card-group-menu");
    const groups = this.getGroupsConfig().filter((group) => group.enabled);
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
      const group = this.getGroupsConfig().find((g) => g.id === groupId);
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

  private async scanGroupPriority(group: any): Promise<void> {
    try {
      //(`=== 开始扫描分组 "${group.name}" ===`);

      // 使用分页查询
      const sqlResult = await CardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100 //
      );

      // 使用优化递归查找
      const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult, 5);
      /*console.log(
        `分组 "${group.name}" 递归查找完成，得到 ${blockIds.length} 个闪卡块`
      );*/

      if (!blockIds || blockIds.length === 0) {
        //console.log(`分组 "${group.name}" 未找到匹配的块`);
        return;
      }

      const cards = await CardUtils.getRiffCardsByBlockIds(blockIds);
      //(`获取到闪卡数量: ${cards.length}`);

      const todayCards = CardUtils.filterPureTodayCards(cards);
      //(`今日创建的闪卡数量: ${todayCards.length}`);

      if (todayCards.length === 0) {
        //(`分组 "${group.name}" 没有今日创建的闪卡`);
        return;
      }

      const cardsToUpdate = todayCards.filter(
        (card) => card.priority !== group.priority
      );

      if (cardsToUpdate.length === 0) {
        /*(
          `分组 "${group.name}" 所有今日闪卡已经是目标优先级 ${group.priority}`
        );*/
        return;
      }

      await CardUtils.setCardsPriority(cardsToUpdate, group.priority);
      /*console.log(
        `分组 "${group.name}" 成功设置 ${cardsToUpdate.length} 张闪卡，优先级为 ${group.priority}`
      );*/
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
        // 使用 utils.ts 中的封装函数替代直接调用
        await CardUtils.postponeCards(postponableCards, config.postponeDays);
      }
    } catch (error) {
      console.error("推迟操作失败:", error);
    }
  }
}

// 声明全局变量，避免 TypeScript 报错
declare global {
  interface Window {
    tomato_zZmqus5PtYRi: any;
  }
}
