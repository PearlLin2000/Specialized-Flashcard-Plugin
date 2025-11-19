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
      const renderedView = await AvAPI.renderAttributeView(
        avID,
        "",
        view.id,
        1,
        -1,
        "",
        {}
      );
      const rows = renderedView.view.rows;
      const primaryKeys = rows.map((row) => row.id);

      if (renderedView && renderedView.view) {
        const boundBlockIDs: Record<string, string> | null =
          await AvAPI.getAttributeViewBoundBlockIDsByItemIDs(avID, primaryKeys);

        if (!boundBlockIDs) {
          console.warn(`❌ 获取 BoundBlockIDs 失败`);
          return [];
        }
        //console.log("boundBlockIDs的数量:", Object.keys(boundBlockIDs).length);
        //console.log("boundBlockIDs:", boundBlockIDs);
        const result: string[] = Object.values(boundBlockIDs).filter(
          (blockID) => blockID && blockID.trim() !== ""
        );
        //console.log(`✅ 获取到 ${result.length} 个 BoundBlockIDs：`, result);
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
 * @param {Array} srcs - 块对象数组，每个块必须包含id属性
 * @param {string} keyID - 要设置的字段Key
 * @param {any} value - 要设置的字段值
 * @param {string} [viewID] - 视图ID（可选）
 * @param {string} [databaseBlockID] - 数据库块ID（可选，用于重新渲染）
 */

export async function addAttributeViewBlocksByBlockIDs(
  avID: string,
  blockIDs: string[]
): Promise<null> {
  try {
    // 参数验证
    if (!avID || !blockIDs || !Array.isArray(blockIDs)) {
      throw new Error("缺少必要参数: avID 或 blockIDs");
    }

    if (blockIDs.length === 0) {
      console.warn("blockIDs 数组为空，无需添加");
      return null;
    }

    // 转换块ID为块对象数组
    const srcs = processSrcsByBlockIDs(blockIDs);

    console.log(`正在添加 ${blockIDs.length} 个块到数据库 ${avID}`);

    //如果传入了viewName，可以先通过viewName获取viewID，再传给下面的API调用。
    /*这里的实现逻辑是:使用 getViewIDByName(avID, viewName);
     */
    //如果没有传viewName，就用默认视图添加（使用undefined）。
    // 调用API添加块
    const result = await AvAPI.addAttributeViewBlocks(
      avID,
      srcs,
      undefined,
      undefined,
      undefined,
      undefined,
      false
    );

    console.log(`成功添加 ${blockIDs.length} 个块到数据库`);

    return result;
  } catch (error) {
    console.error("添加块到数据库失败:", error);
    throw error;
  }
}

/*下方的函数是废掉的，但先保留。不记得在其他地方有没有用了。（批量设置数据库字段值的完整版，包含设置字段值和重新渲染视图的逻辑；）
export async function batchSetDatabaseField(
  avID: string,
  srcs: {
    id: BlockId;
    isDetached?: boolean;
  }[],
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
      srcs,
      undefined, // blockID
      viewID,
      undefined, // groupID
      undefined, // previousID
      false // ignoreDefaultFill
    );

    console.log("添加块到数据库完成");
    console.log("设置默认字段值功能等待完成...");

    /* 第二步：获取所有块的blockIDs
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
*/

// 辅助函数：将blockIDs数组转换为块对象数组
function processSrcsByBlockIDs(blockIDs) {
  return blockIDs.map((block) => ({
    id: block,
    isDetached: false,
  }));
}

/**
 * 根据视图名称获取视图ID
 * @param {string} avID - 属性视图ID
 * @param {string} viewName - 视图名称
 * @returns {Promise<string|undefined>} 视图ID，未找到时返回undefined
 */
async function getViewIDByName(avID, viewName) {
  try {
    // 参数验证
    if (!avID || !viewName) {
      throw new Error("avID 和 viewName 不能为空");
    }

    // 获取属性视图数据
    const av = await AvAPI.getAttributeView(avID);

    // 验证数据结构
    if (!av || !Array.isArray(av.views)) {
      throw new Error("获取的属性视图数据无效");
    }

    // 查找匹配的视图
    const view = av.views.find((v) => v.name === viewName);
    return view ? view.id : undefined;
  } catch (error) {
    console.error(
      `获取视图ID失败 (avID: ${avID}, viewName: ${viewName}):`,
      error.message
    );
    return undefined;
  }
}

/**
 * 根据属性名称获取keyID
 * @param {string} avID - 属性视图ID
 * @param {string} keyName - 属性名称
 * @returns {Promise<string|undefined>} keyID，未找到时返回undefined
 */
async function getKeyIDByName(avID, keyName) {
  try {
    // 参数验证
    if (!avID || !keyName) {
      throw new Error("avID 和 keyName 不能为空");
    }

    // 获取属性视图数据
    const av = await AvAPI.getAttributeView(avID);

    // 验证数据结构
    if (!av || !Array.isArray(av.keyValues)) {
      throw new Error("获取的属性视图数据无效");
    }

    // 查找匹配的属性
    const keyItem = av.keyValues.find((item) => item.name === keyName);
    return keyItem ? keyItem.id : undefined;
  } catch (error) {
    console.error(
      `获取keyID失败 (avID: ${avID}, keyName: ${keyName}):`,
      error.message
    );
    return undefined;
  }
}
