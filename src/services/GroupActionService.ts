// GroupActionService.ts
import { showMessage } from "siyuan";
import * as CardUtils from "../utils/index";
import { DataManager } from "../DataManager/DataManager"; // 确保引入 DataManager
import { GroupConfig } from "../types/data"; // 确保引入 GroupConfig 类型

export class GroupActionService {
  private dataManager: DataManager;
  // 通过构造函数接收 DataManager 实例
  constructor(dataManager: DataManager) {
    this.dataManager = dataManager;
  }

  async handleBatchPriority(group: GroupConfig): Promise<void> {
    /*别问我为什么明明参数是blocks，却传入cards，我也想知道为什么cards基本可以，blocks就不行
    两个参数的传入都有问题，但cards发生bug的概率小一点，就这样QAQ*/
    try {
      showMessage(
        `分组 "${group.name}" 已触发优先级的查询请求提交，请耐心等待...`
      );

      const blockIds = await this.dataManager.provideGroupCacheBlockIds(
        group,
        true
      );

      if (!blockIds || blockIds.length === 0) {
        showMessage(`分组 "${group.name}" 未找到匹配的块`);
        return;
      }

      let blocks = await CardUtils.getBlocksByIDs(blockIds);

      // 筛选空的块
      const emptyBlocks = blocks.filter(
        (block) => !block.id || block.id.trim() === ""
      );

      // 去除空的块
      blocks = blocks.filter((block) => block.id && block.id.trim() !== "");

      if (blocks.length === 0) {
        showMessage(`分组 "${group.name}" 未找到对应的闪卡块`);
        return;
      }

      let cards = await CardUtils.getRiffCardsByBlockIds(blockIds);

      // 筛选空的卡片
      const emptyCards = cards.filter(
        (card) => !card.id || card.id.trim() === ""
      );

      // 去除空的卡片
      cards = cards.filter((card) => card.id && card.id.trim() !== "");

      // 使用分批次处理，每批500张
      const batchSize = 500;
      const result1 = await this.setCardsPriorityInBatches(
        blocks,
        group.priority,
        batchSize
      );
      if (result1.failCount === 0) {
        showMessage(
          `分组 "${group.name}" 的 ${result1.successCount} 张闪卡优先级已成功设置为 ${group.priority}`
        );
      } else {
        showMessage(
          `分组 "${group.name}" 的闪卡优先级设置完成：成功 ${result1.successCount} 张，失败 ${result1.failCount} 张`
        );
        console.log(
          '分组 "${group.name}" 的闪卡优先级设置完成：成功 ${result1.successCount} 张，失败 ${result1.failCount} 张'
        );
      }
      const result2 = await this.setCardsPriorityInBatches(
        cards,
        group.priority,
        batchSize
      );

      if (result2.failCount === 0) {
        showMessage(
          `分组 "${group.name}" 的 ${result2.successCount} 张闪卡优先级已成功设置为 ${group.priority}`
        );
      } else {
        showMessage(
          `分组 "${group.name}" 的闪卡优先级设置完成：成功 ${result2.successCount} 张，失败 ${result2.failCount} 张`
        );
        console.log(
          '分组 "${group.name}" 的闪卡优先级设置完成：成功 ${result2.successCount} 张，失败 ${result2.failCount} 张'
        );
      }
    } catch (error) {
      console.error(`批量设置优先级失败:`, error);
      showMessage("批量设置优先级失败，请检查控制台");
    }
  }

  /**
   * 分批次设置卡片优先级
   * @param {Array} allBlocks 所有块数组
   * @param {number} priority 优先级
   * @param {number} batchSize 每批大小，默认100
   */
  private async setCardsPriorityInBatches(
    allBlocks: any[],
    priority: number,
    batchSize: number = 100
  ): Promise<{ successCount: number; failCount: number }> {
    try {
      const batches = [];
      for (let i = 0; i < allBlocks.length; i += batchSize) {
        batches.push(allBlocks.slice(i, i + batchSize));
      }

      let successCount = 0;
      let failCount = 0;

      // 逐批处理
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        try {
          await CardUtils.setCardsPriority(batch, priority);
          successCount += batch.length;

          // 可选：在批次之间添加短暂延迟，避免请求过于密集
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          failCount += batch.length;
          console.error(`第 ${i + 1} 批处理失败:`, error);
        }
      }

      return { successCount, failCount };
    } catch (error) {
      console.error("分批次设置优先级过程中发生错误:", error);
      throw error;
    }
  }

  handleOpenInDocumentSQL(group: any): void {
    CardUtils.openSQLFlow(group.sqlQuery, `${group.name}-SQL查询`);
    showMessage(
      `请确保文档流插件安装并启用。\n本次调用的文档流显示的为原始查询，不包含内置的闪卡过滤。`
    );
  }

  async handleOpenInDocumentAllCards(group: GroupConfig): Promise<void> {
    try {
      // [修改] 使用 dataManager 获取块ID，此函数内部处理了缓存和 queryFirst 逻辑
      //内部封装了向上传递函数的逻辑
      const blockIds = await this.dataManager.provideGroupCacheBlockIds(group);

      if (!blockIds || blockIds.length === 0) {
        showMessage(`分组 "${group.name}" 未找到匹配的闪卡块`);
        return;
      }

      CardUtils.openIdListFlow(blockIds, `${group.name}-闪卡块查询`);
      showMessage(
        `正在文档流中打开 "${group.name}" 查找到的 ${blockIds.length} 个闪卡块...`
      );
    } catch (error) {
      console.error(`在文档流中打开（全部）失败:`, error);
      showMessage("在文档流中打开失败，请检查控制台");
    }
  }
}
