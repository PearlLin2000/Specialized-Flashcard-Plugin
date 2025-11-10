// DataBaseUtils.ts
import * as AvAPI from "./API/apiSiyuanAv";

// ============== 属性视图相关函数 ==============
export async function getBoundBlockIDsByViewName(
  viewName: string,
  avID: string
): Promise<string[]> {
  try {
    const avData: AttributeViewData | null = await AvAPI.getAttributeView(avID);
    if (!avData?.av) {
      console.warn(`❌ 未找到ID为 "${avID}" 的属性视图`);
      return [];
    }

    const av: AttributeView = avData.av;
    const view: View | undefined = av.views.find((v) => v.name === viewName);
    if (!view) {
      console.warn(`❌ 未找到名称为 "${viewName}" 的视图`);
      return [];
    }

    try {
      const renderedView = await AvAPI.renderAttributeView(avID, "", view.id);
      const rows = renderedView.view.rows;
      const primaryKeys = rows.map((row) => row.id);

      if (renderedView && renderedView.view) {
        const boundBlockIDs: Record<string, string> | null =
          await AvAPI.getAttributeViewBoundBlockIDsByItemIDs(avID, primaryKeys);

        if (!boundBlockIDs) {
          console.warn(`❌ 获取 BoundBlockIDs 失败`);
          return [];
        }

        const result: string[] = Object.values(boundBlockIDs).filter(
          (blockID) => blockID && blockID.trim() !== ""
        );

        return result;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`渲染属性视图失败:`, error);
      return [];
    }
  } catch (error) {
    console.error(`💥 获取 BoundBlockIDs 失败:`, error);
    return [];
  }
}

/**
 * 批量设置数据库条目字段值
 * @param {string} avID - 数据库ID
 * @param {Array} blocks - 块对象数组，每个块必须包含id属性
 * @param {string} keyID - 要设置的字段Key
 * @param {any} value - 要设置的字段值
 * @param {string} [viewID] - 视图ID（可选）
 * @param {string} [databaseBlockID] - 数据库块ID（可选，用于重新渲染）
 */
export async function batchSetDatabaseField(
  avID: string,
  blocks: any[],
  keyID: string,
  value: any,
  viewID?: string,
  databaseBlockID?: string
): Promise<void> {
  try {
    // 参数验证
    if (!avID || !blocks || !keyID) {
      throw new Error("缺少必要参数: avID, blocks, keyID");
    }

    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new Error("blocks 必须是非空数组");
    }

    console.log("开始添加块到数据库，块:", blocks);

    // 第一步：添加所有块到数据库
    await AvAPI.addAttributeViewBlocks(
      avID,
      blocks,
      undefined, // blockID
      viewID,
      undefined, // groupID
      undefined, // previousID
      false // ignoreDefaultFill
    );

    console.log("添加块到数据库完成");

    // 第二步：获取所有块的blockIDs
    const blockIDs = blocks.map((block) => block.id);
    console.log("要查询的块ID:", blockIDs);

    // 第三步：通过块ID数组获取对应的条目ID映射
    const itemIDsResult = await AvAPI.getAttributeViewItemIDsByBoundIDs(
      avID,
      blockIDs
    );

    console.log("获取到的条目ID映射:", itemIDsResult);

    if (!itemIDsResult) {
      throw new Error("获取条目ID失败");
    }

    // 检查是否找到了所有块对应的条目ID
    const foundItems = Object.keys(itemIDsResult).length;
    console.log(`找到 ${foundItems} 个块对应的条目ID`);

    // 第四步：为每个条目设置相同的字段值
    const updatePromises = [];

    for (const block of blocks) {
      const itemID = itemIDsResult[block.id];
      if (itemID) {
        console.log(`为块 ${block.id} 设置字段，条目ID: ${itemID}`);
        updatePromises.push(
          AvAPI.setAttributeViewBlockAttr(avID, keyID, itemID, value)
        );
      } else {
        console.warn(`未找到块 ${block.id} 对应的条目ID`);
      }
    }

    if (updatePromises.length === 0) {
      throw new Error("没有找到任何可更新的条目");
    }

    // 等待所有字段设置完成
    await Promise.all(updatePromises);
    console.log("所有字段设置完成");

    // 第五步：重新渲染数据库视图
    await AvAPI.renderAttributeView(
      avID,
      databaseBlockID,
      viewID,
      1, // page
      50, // pageSize
      "", // query
      {} // groupPaging
    );

    console.log(
      `成功为 ${updatePromises.length} 个条目设置字段 ${keyID} 的值为:`,
      value
    );
  } catch (error) {
    console.error("批量设置数据库字段失败:", error);
    throw error;
  }
}
