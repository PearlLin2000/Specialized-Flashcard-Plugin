import {
  Plugin,
  showMessage,
  confirm,
  Dialog,
  Menu,
  openTab,
  getFrontend,
  getBackend,
  fetchSyncPost,
} from "siyuan";
import "./index.scss";
import GroupManager from "./GroupManager/GroupManager.svelte";
//import GroupManager from "@/GroupManager.svelte";

import { SettingUtils } from "./libs/setting-utils";
import * as CardUtils from "./utils"; // <--- 新增导入

const STORAGE_NAME = "menu-config";

interface GroupConfig {
  id: string;
  name: string;
  sqlQuery: string;
  enabled: boolean;
  priority: number;
  priorityEnabled: boolean;
}

interface PluginData {
  groups: GroupConfig[];
  cache: {
    [groupId: string]: {
      blockIds: string[];
      timestamp: number;
    };
  };
  postponeDays: number;
  scanInterval: number;
  priorityScanEnabled: boolean;
}

export default class PluginSample extends Plugin {
  private isMobile: boolean;
  private settingUtils: SettingUtils;
  private scanTimer: number | null = null;

  private readonly DEFAULT_GROUPS: GroupConfig[] = [
    {
      id: "1",
      name: "最近7天未复习",
      sqlQuery:
        "SELECT b.id FROM blocks b JOIN attributes a ON b.id = a.block_id WHERE a.name = 'custom-riff-decks' AND a.value LIKE '%\"due\":\"' || strftime('%Y%m%d', date('now', '-7 day')) || '%' GROUP BY b.id",
      enabled: true,
      priority: 1,
      priorityEnabled: true,
    },
    {
      id: "2",
      name: "所有闪卡",
      sqlQuery:
        "SELECT block_id FROM attributes WHERE name = 'custom-riff-decks'",
      enabled: true,
      priority: 5,
      priorityEnabled: false,
    },
  ];

  private readonly DEFAULT_CONFIG = {
    postponeDays: 0,
    scanInterval: 30,
    priorityScanEnabled: false,
  };

  async onload() {
    await this.initData();

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
    });

    await this.preloadGroupData();
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

    const statusIconTemp = document.createElement("template");
    statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
    statusIconTemp.content.firstElementChild.addEventListener("click", () => {
      confirm(
        "⚠️",
        this.i18n.confirmRemove.replace("${name}", this.name),
        () => {
          this.removeData(STORAGE_NAME).then(() => {
            this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
            showMessage(`[${this.name}]: ${this.i18n.removedData}`);
          });
        }
      );
    });
    this.addStatusBar({
      element: statusIconTemp.content.firstElementChild as HTMLElement,
    });
  }

  async onunload() {
    this.stopScheduledTasks();
    this.clearCache();
    showMessage("回见，专项闪卡插件！");
  }

  uninstall() {}

  openSetting(): void {
    let dialog = new Dialog({
      title: "闪卡分组管理",
      content: `<div id="SettingPanel" style="height: 100%;"></div>`,
      width: "800px",
      height: "600px",
      destroyCallback: () => {
        this.preloadGroupData();
      },
    });

    new GroupManager({
      target: dialog.element.querySelector("#SettingPanel"),
      props: {
        plugin: this,
        onConfigUpdate: (groups: GroupConfig[]) => {
          this.saveGroupsConfig(groups);
        },
      },
    });
  }

  private async initData() {
    const storedData = await this.loadData(STORAGE_NAME);
    const data = {
      ...this.DEFAULT_CONFIG,
      groups: this.DEFAULT_GROUPS,
      cache: {},
      ...(storedData || {}),
    };
    this.data[STORAGE_NAME] = data;
  }

  private getGroupsConfig(): GroupConfig[] {
    return this.data[STORAGE_NAME]?.groups || this.DEFAULT_GROUPS;
  }

  private async saveGroupsConfig(groups: GroupConfig[]) {
    const currentData = this.data[STORAGE_NAME] as PluginData;
    currentData.groups = groups;
    this.data[STORAGE_NAME] = currentData;
    await this.saveData(STORAGE_NAME, currentData);
  }

  async handleBatchPriority(group: GroupConfig): Promise<void> {
    try {
      const sqlResult = await fetchSyncPost("/api/query/sql", {
        stmt: group.sqlQuery,
      });

      const blockIds = await CardUtils.recursiveFindCardBlocks(
        sqlResult.data,
        5
      ); // <--- 修改

      if (!blockIds || blockIds.length === 0) {
        showMessage(`分组 "${group.name}" 未找到匹配的块`);
        return;
      }

      const cards = await CardUtils.getRiffCardsByBlockIds(blockIds); // <--- 修改

      console.log(cards);

      if (cards.length === 0) {
        showMessage(`分组 "${group.name}" 未找到对应的闪卡`);
        return;
      }

      if (
        window.tomato_zZmqus5PtYRi?.cardPriorityBox
          ?.updateDocPriorityBatchDialog
      ) {
        await window.tomato_zZmqus5PtYRi.cardPriorityBox.updateDocPriorityBatchDialog(
          cards,
          group.priority,
          false
        );
        showMessage(
          `触发 "${group.name}" 的闪卡设置优先级 ${group.priority} 调用，请耐心等待`
        );
      } else {
        showMessage("番茄工作法插件API不可用");
      }
    } catch (error) {
      console.error(`批量设置优先级失败:`, error);
      showMessage("批量设置优先级失败，请检查控制台");
    }
  }

  handleOpenInDocument(group: GroupConfig): void {
    CardUtils.openSQLFlow(group.sqlQuery, `${group.name}-SQL查询`);
    showMessage(`文档流显示的为原始查询，不包含内置的闪卡过滤`);
  }

  private startScheduledTasks() {
    this.stopScheduledTasks();
    const config = this.data[STORAGE_NAME] as PluginData;
    const intervalMs = config.scanInterval * 60 * 1000;
    this.executeScheduledTasks();
    this.scanTimer = window.setInterval(() => {
      this.executeScheduledTasks();
    }, intervalMs);
  }

  private stopScheduledTasks() {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  private async executeScheduledTasks() {
    try {
      await this.preloadGroupData();
      await Promise.allSettled([
        this.postponeTodayCards(),
        this.performPriorityScan(),
      ]);
    } catch (error) {
      console.error("定时任务执行失败:", error);
    }
  }

  private async performPriorityScan(): Promise<void> {
    const config = this.data[STORAGE_NAME] as PluginData;
    if (!config.priorityScanEnabled) return;

    const enabledGroups = this.getGroupsConfig().filter(
      (group) => group.enabled && group.priorityEnabled
    );
    if (enabledGroups.length === 0) return;

    for (const group of enabledGroups) {
      await this.scanGroupPriority(group);
    }
  }

  private async scanGroupPriority(group: GroupConfig): Promise<void> {
    try {
      const blockIds = await this.executeAndCacheQuery(group);
      if (blockIds.length === 0) return;

      const cards = await CardUtils.getRiffCardsByBlockIds(blockIds); // <--- 修改
      if (cards.length === 0) return;

      const todayCards = CardUtils.filterPureTodayCards(cards); // <--- 修改
      if (todayCards.length === 0) return;

      await CardUtils.setCardsPriority(todayCards, group.priority); // <--- 修改
      console.log(
        `分组 "${group.name}" 成功设置 ${todayCards.length} 张闪卡，优先级为 ${group.priority}`
      );
    } catch (error) {
      console.error(`分组 "${group.name}" 优先级扫描失败:`, error);
    }
  }

  private async preloadGroupData(): Promise<void> {
    const groups = this.getGroupsConfig().filter((group) => group.enabled);
    for (const group of groups) {
      try {
        await this.executeAndCacheQuery(group);
      } catch (error) {
        console.error(`预加载分组 "${group.name}" 失败:`, error);
      }
    }
  }

  private async executeAndCacheQuery(group: GroupConfig): Promise<string[]> {
    const currentData = this.data[STORAGE_NAME] as PluginData;
    const cachedData = currentData.cache[group.id];
    if (cachedData && cachedData.blockIds) {
      return cachedData.blockIds;
    }

    const sqlResult = await fetchSyncPost("/api/query/sql", {
      stmt: group.sqlQuery,
    });
    const blockIds = await CardUtils.recursiveFindCardBlocks(sqlResult.data, 5); // <--- 修改

    currentData.cache[group.id] = {
      blockIds,
      timestamp: Date.now(),
    };
    return blockIds;
  }

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("card-group-menu");
    const groups = this.getGroupsConfig().filter((group) => group.enabled);

    if (groups.length > 0) {
      groups.forEach((group) => {
        menu.addItem({
          icon: "iconRiffCard",
          label: group.name,
          click: () => this.createRiffCardsByGroup(group.id),
        });
      });
      menu.addSeparator();
    }

    menu.addItem({
      icon: "iconSettings",
      label: "设置",
      click: () => this.openSetting(),
    });

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

  /**
   * 根据分组ID创建闪卡复习界面
   */
  private async createRiffCardsByGroup(groupId: string) {
    try {
      const group = this.getGroupsConfig().find((g) => g.id === groupId);
      if (!group) {
        showMessage(`未找到分组: ${groupId}`);
        return;
      }

      const blockIds = await this.executeAndCacheQuery(group);

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

  /**
   * 打开闪卡复习界面
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

  private async postponeTodayCards(): Promise<void> {
    try {
      const config = this.data[STORAGE_NAME] as PluginData;
      if (config.postponeDays <= 0) return;

      const allCards =
        await window.tomato_zZmqus5PtYRi.siyuan.getRiffCardsAllFlat();
      const todayCards = CardUtils.filterPureTodayCards(allCards); // <--- 修改

      const postponableCards = todayCards.filter(
        (card) => CardUtils.isPostponableCard(card) // <--- 修改
      );

      if (postponableCards.length > 0) {
        await CardUtils.postponeCards(postponableCards, config.postponeDays); // <--- 修改
      }
    } catch (error) {
      console.error("推迟操作失败:", error);
    }
  }

  private clearCache(): void {
    const currentData = this.data[STORAGE_NAME] as PluginData;
    currentData.cache = {};
  }
}
