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
    try {
      // [修改] 使用 dataManager 获取块ID，此函数内部处理了缓存和 queryFirst 逻辑
      const blockIds = await this.dataManager.provideGroupCacheBlockIds(group);

      if (!blockIds || blockIds.length === 0) {
        showMessage(`分组 "${group.name}" 未找到匹配的块`);
        return;
      }

      const cards = await CardUtils.getRiffCardsByBlockIds(blockIds);

      if (cards.length === 0) {
        showMessage(`分组 "${group.name}" 未找到对应的闪卡`);
        return;
      }

      await CardUtils.setCardsPriority(cards, group.priority);
      showMessage(
        `触发 "${group.name}" 的闪卡设置优先级 ${group.priority} 调用，请耐心等待`
      );
    } catch (error) {
      console.error(`批量设置优先级失败:`, error);
      showMessage("批量设置优先级失败，请检查控制台");
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
