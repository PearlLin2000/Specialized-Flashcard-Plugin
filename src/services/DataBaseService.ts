// DataBaseService.ts
import * as Utils from "../utils/index";

export class DataBaseService {
  // 新函数：处理制卡流程
  static async processCardCreation(
    avID: string,
    viewName: string
  ): Promise<void> {
    const isornoriffcards = false;

    try {
      // 获取没有闪卡属性的blocks列表
      const blocks = await this.getBlocksByViewWithRiffFilter(
        avID,
        viewName,
        isornoriffcards
      );

      if (blocks.length === 0) {
        console.log("没有找到需要制卡的块");
        return;
      }

      // 提取块ID
      const blockIDs = blocks.map((block) => block.id);

      // 调用制卡函数
      const result = await Utils.addRiffCards(
        "20230218211946-2kw8jgx",
        blockIDs
      );

      if (result) {
        console.log(`成功为 ${blockIDs.length} 个块创建闪卡`);
      } else {
        console.error("制卡失败");
      }
    } catch (error) {
      console.error("制卡流程执行失败:", error);
    }
  }

  // 新函数：处理取消制卡流程
  static async processCardRemoval(
    avID: string,
    viewName: string
  ): Promise<void> {
    const isornoriffcards = true;

    try {
      // 获取具有闪卡属性的blocks列表
      const blocks = await this.getBlocksByViewWithRiffFilter(
        avID,
        viewName,
        isornoriffcards
      );

      if (blocks.length === 0) {
        console.log("没有找到需要取消制卡的块");
        return;
      }

      // 提取块ID
      const blockIDs = blocks.map((block) => block.id);

      // 调用取消制卡函数
      const result = await Utils.removeRiffCards(
        "20230218211946-2kw8jgx",
        blockIDs
      );

      if (result) {
        console.log(`成功为 ${blockIDs.length} 个块取消闪卡`);
      } else {
        console.error("取消制卡失败");
      }
    } catch (error) {
      console.error("取消制卡流程执行失败:", error);
    }
  }

  // 辅助函数：根据属性视图名称和闪卡属性筛选块
  private static async getBlocksByViewWithRiffFilter(
    avID: string,
    viewName: string,
    isornoriffcards: boolean
  ): Promise<any[]> {
    try {
      // 1. 获取块ID列表
      const blockIDs = await Utils.getBoundBlockIDsByViewName(viewName, avID);
      if (blockIDs.length === 0) {
        return [];
      }

      // 2. 构建SQL查询
      const idList = blockIDs.map((id) => `'${id}'`).join(",");
      const baseSQL = `SELECT * FROM blocks WHERE id IN (${idList})`;

      // 3. 执行分页查询
      const allBlocks = await Utils.paginatedSQLQuery(baseSQL);
      if (allBlocks.length === 0) {
        return [];
      }
      console.log(
        `DataBaseService- 获取属性视图块数据: 共获取到 ${allBlocks.length} 个块：`,
        allBlocks
      );
      // 4. 根据闪卡属性筛选 - 优化为单次循环
      let hasRiffCards = [];
      let noRiffCards = [];

      for (const block of allBlocks) {
        if (block.ial && block.ial.includes("custom-riff-decks")) {
          hasRiffCards.push(block);
        } else {
          noRiffCards.push(block);
        }
      }

      // 5. 根据参数返回对应列表
      return isornoriffcards ? hasRiffCards : noRiffCards;
    } catch (error) {
      console.error(`DataBaseService- 获取属性视图块数据失败:`, error);
      return [];
    }
  }

  // DataBaseService.ts - 新增函数

  /**
   * 根据SQL查询结果将块添加到属性视图
   * @param baseSQL 基础SQL查询语句
   * @param avID 属性视图ID
   * @returns 添加结果
   */
  static async addBlocksToViewBySQL(
    baseSQL: string,
    avID: string
  ): Promise<{ success: boolean; addedCount: number; message: string }> {
    try {
      // 1. 通过paginatedSQLQuery获取blocks
      const blocks = await Utils.paginatedSQLQuery(baseSQL);

      if (blocks.length === 0) {
        return {
          success: true,
          addedCount: 0,
          message: "SQL查询未找到任何块",
        };
      }

      // 2. 提取blockIDs
      const blockIDs = blocks.map((block) => block.id);

      if (blockIDs.length === 0) {
        return {
          success: true,
          addedCount: 0,
          message: "未从查询结果中提取到有效的块ID",
        };
      }

      // 3. 通过addAttributeViewBlocksByBlockIDs添加块到属性视图
      const result = await Utils.addAttributeViewBlocksByBlockIDs(
        avID,
        blockIDs
      );

      return {
        success: true,
        addedCount: blockIDs.length,
        message: `成功将 ${blockIDs.length} 个块添加到属性视图`,
      };
    } catch (error) {
      console.error("根据SQL添加块到属性视图失败:", error);
      return {
        success: false,
        addedCount: 0,
        message: `添加失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }
}
