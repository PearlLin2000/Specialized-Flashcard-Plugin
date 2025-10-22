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
  Custom,
} from "siyuan";
import "./index.scss";

import SettingExample from "@/setting-example.svelte";
import GroupManager from "@/GroupManager.svelte";

import { SettingUtils } from "./libs/setting-utils";

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
      id: "yima",
      name: "逸码",
      sqlQuery: `
      SELECT * FROM blocks 
      WHERE tag LIKE '%#逸码#%'
      AND id IN (
        SELECT block_id 
        FROM attributes 
        WHERE name = 'custom-riff-decks'
      )
      LIMIT 999
    `,
      enabled: true,
      priority: 45,
      priorityEnabled: true,
    },
    {
      id: "mpa",
      name: "MPA",
      sqlQuery: `
      SELECT * FROM blocks 
      WHERE id IN (
        SELECT block_id 
        FROM refs 
        WHERE def_block_id IN (
          SELECT id 
          FROM blocks 
          WHERE path LIKE '%20250917151103-dwg4i20%'
        )
      )
      AND id IN (
        SELECT block_id 
        FROM attributes 
        WHERE name = 'custom-riff-decks'
      )
      LIMIT 999
    `,
      enabled: true,
      priority: 45,
      priorityEnabled: true,
    },
    {
      id: "baihua",
      name: "白话",
      sqlQuery: `
      SELECT * FROM blocks 
      WHERE id IN (
        SELECT block_id 
        FROM refs 
        WHERE def_block_id IN (
          SELECT id 
          FROM blocks 
          WHERE path LIKE '%20251013193453-iighn2n%'
        )
      )
      AND id IN (
        SELECT block_id 
        FROM attributes 
        WHERE name = 'custom-riff-decks'
      )
      LIMIT 999
    `,
      enabled: true,
      priority: 45,
      priorityEnabled: true,
    },
    {
      id: "shipin",
      name: "视频",
      sqlQuery: `
      SELECT * FROM blocks 
      WHERE (
        markdown LIKE '%.mp4%' 
        OR markdown LIKE '%https://www.bilibili.com/video/BV%'
      )
      AND id IN (
        SELECT block_id 
        FROM attributes 
        WHERE name = 'custom-riff-decks'
      )
      LIMIT 999
    `,
      enabled: true,
      priority: 50,
      priorityEnabled: false,
    },
  ];

  private readonly DEFAULT_CONFIG = {
    postponeDays: 2,
    scanInterval: 30,
  };

  /**
   * 插件加载入口，初始化数据和启动定时任务
   */
  async onload() {
    await this.initData();

    console.log("loading plugin-sample", this.i18n);

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
    });

    await this.preloadGroupData();

    this.startScheduledTasks();

    console.log(this.i18n.helloPlugin);
  }

  /**
   * 布局就绪后设置顶栏和状态栏
   */
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

    console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
  }

  /**
   * 插件卸载时清理资源
   */
  async onunload() {
    this.stopScheduledTasks();
    this.clearCache();

    console.log(this.i18n.byePlugin);
    showMessage("Goodbye SiYuan Plugin");
    console.log("onunload");
  }

  /**
   * 插件卸载回调
   */
  uninstall() {
    console.log("uninstall");
  }

  /**
   * 打开分组管理设置面板
   */
  openSetting(): void {
    let dialog = new Dialog({
      title: "闪卡分组管理",
      content: `<div id="SettingPanel" style="height: 100%;"></div>`,
      width: "800px",
      height: "600px",
      destroyCallback: (options) => {
        console.log("destroyCallback", options);
        this.preloadGroupData().then(() => {
          console.log("配置更新后重新预加载完成");
        });
      },
    });

    let panel = new GroupManager({
      target: dialog.element.querySelector("#SettingPanel"),
      props: {
        plugin: this,
        onConfigUpdate: (groups: GroupConfig[]) => {
          this.saveGroupsConfig(groups);
        },
      },
    });
  }

  /**
   * 初始化插件数据存储
   */
  private async initData() {
    const storedData = await this.loadData(STORAGE_NAME);

    if (!storedData) {
      const initialData: PluginData = {
        groups: this.DEFAULT_GROUPS,
        cache: {},
        postponeDays: this.DEFAULT_CONFIG.postponeDays,
        scanInterval: this.DEFAULT_CONFIG.scanInterval,
        priorityScanEnabled: true,
      };
      this.data[STORAGE_NAME] = initialData;
      await this.saveData(STORAGE_NAME, initialData);
    } else {
      this.data[STORAGE_NAME] = {
        groups: (storedData.groups || this.DEFAULT_GROUPS).map((group) => ({
          ...group,
          priority: group.priority || 50,
          priorityEnabled:
            group.priorityEnabled !== undefined ? group.priorityEnabled : true,
        })),
        cache: storedData.cache || {},
        postponeDays:
          storedData.postponeDays || this.DEFAULT_CONFIG.postponeDays,
        scanInterval:
          storedData.scanInterval || this.DEFAULT_CONFIG.scanInterval,
        priorityScanEnabled:
          storedData.priorityScanEnabled !== undefined
            ? storedData.priorityScanEnabled
            : true,
      };
    }
  }

  /**
   * 获取当前分组配置
   */
  private getGroupsConfig(): GroupConfig[] {
    return this.data[STORAGE_NAME]?.groups || this.DEFAULT_GROUPS;
  }

  /**
   * 保存分组配置到存储
   */
  private async saveGroupsConfig(groups: GroupConfig[]) {
    const currentData = this.data[STORAGE_NAME] as PluginData;
    currentData.groups = groups;
    this.data[STORAGE_NAME] = currentData;
    await this.saveData(STORAGE_NAME, currentData);
  }

  /**
   * 启动定时扫描任务
   */
  private startScheduledTasks() {
    this.stopScheduledTasks();

    const config = this.data[STORAGE_NAME] as PluginData;
    const intervalMs = config.scanInterval * 60 * 1000;

    this.executeScheduledTasks();

    this.scanTimer = window.setInterval(() => {
      this.executeScheduledTasks();
    }, intervalMs);

    console.log(`已启动定时任务，每隔 ${config.scanInterval} 分钟执行一次`);
  }

  /**
   * 停止定时扫描任务
   */
  private stopScheduledTasks() {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
      console.log("已停止定时任务");
    }
  }

  /**
   * 执行所有定时任务（预加载、推迟卡片、优先级扫描）
   */
  private async executeScheduledTasks() {
    try {
      console.log("开始执行定时任务...");

      await this.preloadGroupData();

      await Promise.allSettled([
        this.postponeTodayCards(),
        this.performPriorityScan(),
      ]);

      console.log("定时任务执行完成");
    } catch (error) {
      console.error("定时任务执行失败:", error);
    }
  }

  /**
   * 执行优先级扫描任务
   */
  private async performPriorityScan(): Promise<void> {
    const config = this.data[STORAGE_NAME] as PluginData;
    if (!config.priorityScanEnabled) {
      console.log("优先级扫描未启用，跳过");
      return;
    }

    const enabledGroups = this.getGroupsConfig().filter(
      (group) => group.enabled && group.priorityEnabled
    );

    if (enabledGroups.length === 0) {
      console.log("没有启用优先级扫描的分组，跳过");
      return;
    }

    console.log(`开始优先级扫描，共 ${enabledGroups.length} 个分组`);

    for (const group of enabledGroups) {
      await this.scanGroupPriority(group);
    }
  }

  /**
   * 扫描单个分组的优先级并设置
   */
  private async scanGroupPriority(group: GroupConfig): Promise<void> {
    try {
      console.log(`开始扫描分组 "${group.name}" 的优先级`);

      const blockIds = await this.executeAndCacheQuery(group);

      if (blockIds.length === 0) {
        console.log(`分组 "${group.name}" 未找到匹配的块`);
        return;
      }

      const cards = await this.getRiffCardsByBlockIds(blockIds);

      if (cards.length === 0) {
        console.log(`分组 "${group.name}" 未找到对应的闪卡`);
        return;
      }

      const todayCards = this.filterPureTodayCards(cards);

      if (todayCards.length === 0) {
        console.log(`分组 "${group.name}" 未找到今日创建的闪卡`);
        return;
      }

      console.log(
        `分组 "${group.name}" 找到 ${todayCards.length} 张今日创建的闪卡`
      );

      await this.setCardsPriority(todayCards, group.priority);
      console.log(
        `分组 "${group.name}" 成功设置 ${todayCards.length} 张闪卡优先级为 ${group.priority}`
      );
    } catch (error) {
      console.error(`分组 "${group.name}" 优先级扫描失败:`, error);
    }
  }

  /**
   * 通过块ID获取对应的闪卡
   */
  private async getRiffCardsByBlockIds(blockIds: string[]): Promise<any[]> {
    if (!window.tomato_zZmqus5PtYRi?.siyuan?.getRiffCardsByBlockIDs) {
      console.error("tomato_zZmqus5PtYRi API 不可用");
      return [];
    }

    try {
      const cardMap =
        await window.tomato_zZmqus5PtYRi.siyuan.getRiffCardsByBlockIDs(
          blockIds
        );
      return [...cardMap.values()].flat();
    } catch (error) {
      console.error("获取闪卡失败:", error);
      return [];
    }
  }

  /**
   * 批量设置闪卡优先级
   */
  private async setCardsPriority(
    cards: any[],
    priority: number
  ): Promise<void> {
    if (
      !window.tomato_zZmqus5PtYRi?.cardPriorityBox?.updateDocPriorityBatchDialog
    ) {
      console.error("tomato_zZmqus5PtYRi 优先级设置API不可用");
      return;
    }

    try {
      await window.tomato_zZmqus5PtYRi.cardPriorityBox.updateDocPriorityBatchDialog(
        cards,
        priority
      );
    } catch (error) {
      console.error("设置闪卡优先级失败:", error);
      throw error;
    }
  }

  /**
   * 预加载所有启用分组的数据到缓存
   */
  private async preloadGroupData(): Promise<void> {
    const groups = this.getGroupsConfig().filter((group) => group.enabled);
    console.log(`开始预加载 ${groups.length} 个分组数据`);

    const currentData = this.data[STORAGE_NAME] as PluginData;

    for (const group of groups) {
      try {
        console.log(`预加载分组: ${group.name}`);
        const blockIds = await this.executeAndCacheQuery(group);
        console.log(
          `分组 "${group.name}" 预加载完成，找到 ${blockIds.length} 个块`
        );
      } catch (error) {
        console.error(`预加载分组 "${group.name}" 失败:`, error);
      }
    }
  }

  /**
   * 执行SQL查询并缓存结果
   */
  private async executeAndCacheQuery(group: GroupConfig): Promise<string[]> {
    const currentData = this.data[STORAGE_NAME] as PluginData;

    const cachedData = currentData.cache[group.id];
    if (cachedData && cachedData.blockIds) {
      return cachedData.blockIds;
    }

    const sqlResult = await fetchSyncPost("/api/query/sql", {
      stmt: group.sqlQuery,
    });
    const blockIds = await this.recursiveFindCardBlocks(sqlResult.data, 5);

    currentData.cache[group.id] = {
      blockIds,
      timestamp: Date.now(),
    };

    return blockIds;
  }

  /**
   * 递归查找具有闪卡属性的块
   */
  private async recursiveFindCardBlocks(
    startingBlocks: any[],
    maxDepth: number = 5
  ): Promise<string[]> {
    const foundBlocks = new Set<string>();

    const findRecursive = async (
      blockIds: string[],
      depth = 0
    ): Promise<void> => {
      if (depth >= maxDepth || blockIds.length === 0) return;

      const attributeResults = await Promise.all(
        blockIds.map((blockId) => this.checkBlockHasCardAttribute(blockId))
      );

      attributeResults
        .filter(({ hasAttribute }) => hasAttribute)
        .forEach(({ blockId }) => foundBlocks.add(blockId));

      const blocksToContinue = attributeResults
        .filter(({ hasAttribute }) => !hasAttribute)
        .map(({ blockId }) => blockId);

      if (blocksToContinue.length === 0) return;

      const parentIds = await this.getParentBlocks(blocksToContinue);
      const validParentIds = parentIds.filter((id) => id);

      if (validParentIds.length > 0) {
        await findRecursive(validParentIds, depth + 1);
      }
    };

    const startingBlockIds = startingBlocks.map((block) => block.id);
    await findRecursive(startingBlockIds);

    return Array.from(foundBlocks);
  }

  /**
   * 检查块是否具有闪卡属性
   */
  private async checkBlockHasCardAttribute(
    blockId: string
  ): Promise<{ blockId: string; hasAttribute: boolean }> {
    const attributeQuery = `SELECT 1 FROM attributes WHERE block_id = '${blockId}' AND name = 'custom-riff-decks' LIMIT 1`;
    const result = await fetchSyncPost("/api/query/sql", {
      stmt: attributeQuery,
    });
    return { blockId, hasAttribute: result?.data?.length > 0 };
  }

  /**
   * 获取块的父块ID
   */
  private async getParentBlocks(blockIds: string[]): Promise<string[]> {
    if (blockIds.length === 0) return [];
    const idList = blockIds.map((id) => `'${id}'`).join(",");
    const parentQuery = `SELECT parent_id FROM blocks WHERE id IN (${idList}) AND parent_id IS NOT NULL`;
    const result = await fetchSyncPost("/api/query/sql", { stmt: parentQuery });
    return result.data
      .map((block: any) => block.parent_id)
      .filter((id: string) => id);
  }

  /**
   * 添加动态菜单到顶栏
   */
  private addMenu(rect?: DOMRect) {
    const menu = new Menu("topBarSample", () => {
      console.log(this.i18n.byeMenu);
    });

    menu.addItem({
      icon: "iconSettings",
      label: "插件设置",
      click: () => {
        this.openSetting();
      },
    });
    menu.addSeparator();

    const enabledGroups = this.getGroupsConfig().filter(
      (group) => group.enabled
    );
    enabledGroups.forEach((group) => {
      menu.addItem({
        icon: "iconRiffCard",
        label: group.name,
        click: () => {
          this.createRiffCardsByGroup(group.id);
        },
      });
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

      await this.openRiffCards(blockIds, group.name);
    } catch (error) {
      console.error(`创建分组 ${groupId} 的闪卡时发生错误:`, error);
      showMessage("创建闪卡失败，请检查控制台");
    }
  }

  /**
   * 打开闪卡复习界面
   */
  private async openRiffCards(blockIds: string[], groupName: string) {
    const deckID = "20230218211946-2kw8jgx";

    try {
      const duecardsResponse = await fetchSyncPost(
        "/api/riff/getRiffDueCards",
        {
          deckID: deckID,
        }
      );

      const filteredCards = duecardsResponse.data.cards.filter((card: any) =>
        blockIds.includes(card.blockID)
      );

      const newCardsData = {
        cards: filteredCards,
        unreviewedCount: filteredCards.length,
        unreviewedNewCardCount: filteredCards.filter(
          (card: any) => card.state === 0
        ).length,
        unreviewedOldCardCount: filteredCards.filter(
          (card: any) => card.state !== 0
        ).length,
      };

      openTab({
        app: this.app,
        custom: {
          title: `${groupName}-专项闪卡`,
          icon: "iconRiffCard",
          id: "siyuan-card",
          data: {
            cardType: "all",
            id: "",
            title: "自定义闪卡",
            cardsData: newCardsData,
          },
        },
      });
    } catch (error) {
      console.error("打开闪卡复习界面时发生错误:", error);
      throw error;
    }
  }

  /**
   * 扫描并推迟今日创建的闪卡
   */
  private async postponeTodayCards(): Promise<void> {
    try {
      const config = this.data[STORAGE_NAME] as PluginData;
      console.log(
        `开始扫描并推迟今日创建的闪卡，推迟天数: ${config.postponeDays}`
      );

      const allCards = await tomato_zZmqus5PtYRi.siyuan.getRiffCardsAllFlat();

      const todayCards = this.filterPureTodayCards(allCards);
      console.log(`找到 ${todayCards.length} 张今日卡片`);

      const postponableCards = todayCards.filter((card) =>
        this.isPostponableCard(card)
      );
      console.log(`其中 ${postponableCards.length} 张卡片可被推迟`);

      if (postponableCards.length > 0) {
        await this.postponeCards(postponableCards, config.postponeDays);
        console.log(
          `成功推迟 ${postponableCards.length} 张今日卡片 ${config.postponeDays} 天`
        );
      } else {
        console.log("没有找到需要推迟的今日卡片");
      }
    } catch (error) {
      console.error("推迟操作失败:", error);
    }
  }

  /**
   * 过滤出今日创建的闪卡
   */
  private filterPureTodayCards(cards: any[]): any[] {
    const todayString = this.getTodayString();
    return cards.filter((card) => this.isTodayCard(card, todayString));
  }

  /**
   * 检查卡片是否可被推迟
   */
  private isPostponableCard(card: any): boolean {
    return this.isNotSuspended(card);
  }

  /**
   * 获取今日日期字符串
   */
  private getTodayString(): string {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("");
  }

  /**
   * 检查是否为今日创建的卡片
   */
  private isTodayCard(card: any, todayString: string): boolean {
    return card.riffCardID?.startsWith(todayString);
  }

  /**
   * 检查卡片是否未被暂停
   */
  private isNotSuspended(card: any): boolean {
    return !(
      card.ial?.bookmark === "🛑 Suspended Cards" ||
      card.ial?.["custom-card-priority-stop"] !== undefined
    );
  }

  /**
   * 批量推迟卡片
   */
  private async postponeCards(cards: any[], days: number): Promise<void> {
    if (cards.length === 0) return;

    try {
      await tomato_zZmqus5PtYRi.cardPriorityBox.stopCards(
        cards,
        false,
        days.toString()
      );
      console.log(`批量推迟 ${cards.length} 张卡片 ${days} 天`);
    } catch (error) {
      console.error(`批量推迟卡片失败:`, error);
    }
  }

  /**
   * 清理所有缓存数据
   */
  private clearCache(): void {
    const currentData = this.data[STORAGE_NAME] as PluginData;
    currentData.cache = {};
    console.log("已清理预加载缓存");
  }
}
