// AutomationService.ts
import { DataManager } from "../DataManager/DataManager";
import * as CardUtils from "../utils";

export class AutomationService {
  constructor(
    private dataManager: DataManager,
    private cardUtils: typeof CardUtils
  ) {}

  // 统一的自动化任务执行入口
  async executeAutomationTasks(): Promise<void> {
    await Promise.allSettled([
      this.postponeTodayCards(),
      this.performPriorityScan(),
    ]);
  }

  // 优先级扫描功能
  async performPriorityScan(): Promise<void> {
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
      const sqlResult = await this.cardUtils.paginatedSQLQuery(
        group.sqlQuery,
        100,
        100
      );
      const blockIds = await this.cardUtils.recursiveFindCardBlocks(
        sqlResult,
        5
      );

      if (!blockIds || blockIds.length === 0) {
        return;
      }

      const cards = await this.cardUtils.getRiffCardsByBlockIds(blockIds);
      const todayCards = this.cardUtils.filterPureTodayCards(cards);

      if (todayCards.length === 0) {
        return;
      }

      const cardsToUpdate = todayCards.filter(
        (card) => card.priority !== group.priority
      );

      if (cardsToUpdate.length === 0) {
        return;
      }

      await this.cardUtils.setCardsPriority(cardsToUpdate, group.priority);
    } catch (error) {
      console.error(`分组 "${group.name}" 优先级扫描失败:`, error);
    }
  }

  // 卡片推迟功能
  async postponeTodayCards(): Promise<void> {
    try {
      const config = this.dataManager.getConfig();
      if (!config.postponeEnabled || config.postponeDays <= 0) return;

      const allCards =
        await window.tomato_zZmqus5PtYRi.siyuan.getRiffCardsAllFlat();
      const todayCards = this.cardUtils.filterPureTodayCards(allCards);

      const postponableCards = todayCards.filter((card) =>
        this.cardUtils.isPostponableCard(card)
      );

      if (postponableCards.length > 0) {
        await this.cardUtils.postponeCards(
          postponableCards,
          config.postponeDays
        );
      }
    } catch (error) {
      console.error("推迟操作失败:", error);
    }
  }
}
