// 基础函数
import * as sqlAPI from "./API/apiSiyuanSQL";
import * as riffAPI from "./API/apiSiyuanCard";

export async function isSelfUseSwitchOn(): Promise<number> {
  try {
    const blockId = "20250428141524-dlnghf0"; //一个块id，在自已的笔记里（path：/20250130200147-9q0nu0y.sy）
    const sqlScript = `SELECT * FROM blocks WHERE id = '${blockId}'`;
    const result = await sqlAPI.sql(sqlScript);
    // 强行返回开启状态，方便自用
    console.log("自用功能开关已开启");
    return 1;
    if (
      result &&
      result.length > 0 &&
      result[0].markdown === "开关：临时专项闪卡-自用功能"
    ) {
      console.log("自用功能开关已开启");
      return 1;
    }
    console.log("自用功能开关关闭");
    return 0;
  } catch (error) {
    console.error(`检查自用功能开关时出错:`, error);
    return 0;
  }
}

export async function getRiffDueCards(
  deckID: string,
  reviewedCardIDs: string[] = []
): Promise<{
  cards: any[];
  unreviewedCount: number;
  unreviewedNewCardCount: number;
  unreviewedOldCardCount: number;
} | null> {
  try {
    const reviewedCards = reviewedCardIDs.map((cardID) => ({ cardID }));
    const result = await riffAPI.getRiffDueCards(deckID, reviewedCards);
    if (!result) {
      console.error("获取到期闪卡失败");
      return null;
    }
    return result;
  } catch (error) {
    console.error("调用getRiffDueCards API失败:", error);
    return null;
  }
}

export async function getRiffCardsByBlockIds(
  blockIds: string[]
): Promise<any[]> {
  if (blockIds.length === 0) return [];
  try {
    const result = await riffAPI.getRiffCardsByBlockIDs(blockIds);
    if (!result) {
      console.error("内置API获取闪卡失败");
      return [];
    }
    return result.blocks || [];
  } catch (error) {
    console.error("调用getRiffCardsByBlockIDs API失败:", error);
    return [];
  }
}

export async function checkBlockHasCardAttribute(
  blockId: string
): Promise<{ blockId: string; hasAttribute: boolean }> {
  const attributeQuery = `SELECT 1 FROM attributes WHERE block_id = '${blockId}' AND name = 'custom-riff-decks' LIMIT 1`;
  const result = await sqlAPI.sql(attributeQuery);
  return { blockId, hasAttribute: result?.length > 0 };
}

export async function getParentBlocks(blockIds: string[]): Promise<string[]> {
  if (blockIds.length === 0) return [];
  const idList = blockIds.map((id) => `'${id}'`).join(",");
  const parentQuery = `SELECT parent_id FROM blocks WHERE id IN (${idList}) AND parent_id IS NOT NULL`;
  const result = await sqlAPI.sql(parentQuery);
  return result.map((block: any) => block.parent_id).filter((id: string) => id);
}

export async function paginatedSQLQuery(
  baseSQL: string,
  pageSize: number = 500,
  maxPages: number = 100
): Promise<any[]> {
  let allResults: any[] = [];
  let page = 0;

  while (page < maxPages) {
    const offset = page * pageSize;
    let paginatedSQL = baseSQL;

    if (baseSQL.toLowerCase().includes("limit")) {
      paginatedSQL = baseSQL.replace(
        /limit\s+\d+/i,
        `LIMIT ${pageSize} OFFSET ${offset}`
      );
    } else {
      paginatedSQL = `${baseSQL} LIMIT ${pageSize} OFFSET ${offset}`;
    }

    try {
      const result = await sqlAPI.sql(paginatedSQL);
      if (!result || result.length === 0) break;

      allResults = allResults.concat(result);
      if (result.length < pageSize) break;

      await new Promise((resolve) => setTimeout(resolve, 200));
      page++;
    } catch (error) {
      console.error(`分页查询第${page + 1}页失败:`, error);
      page++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allResults;
}

export async function getBlockByID(blockId: string): Promise<Block> {
  let sqlScript = `select * from blocks where id ='${blockId}'`;
  let data = await sqlAPI.sql(sqlScript);
  return data[0];
}

/**
 * 批量根据blockIDs获取blocks
 * @param blockIds blockID数组（1到上万个）
 * @param batchSize 每批查询的ID数量，默认100个
 * @param pageSize 每页数据量，默认500
 * @returns 所有blocks的拼接结果
 */
export async function getBlocksByIDs(
  blockIds: string[],
  batchSize: number = 100,
  pageSize: number = 500
): Promise<Block[]> {
  if (!blockIds || blockIds.length === 0) {
    return [];
  }

  let allBlocks: Block[] = [];

  // 将blockIds分批处理，避免SQL IN语句过长
  for (let i = 0; i < blockIds.length; i += batchSize) {
    const batch = blockIds.slice(i, i + batchSize);

    // 构建IN查询的SQL
    const idList = batch.map((id) => `'${id}'`).join(",");
    const baseSQL = `SELECT * FROM blocks WHERE id IN (${idList})`;

    try {
      // 使用分页查询获取该批次的所有数据
      const batchResults = await paginatedSQLQuery(baseSQL, pageSize);
      allBlocks = allBlocks.concat(batchResults);

      // 批次间短暂延迟，减轻数据库压力
      if (i + batchSize < blockIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      /*console.log(
        `已完成批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          blockIds.length / batchSize
        )}`
      );*/
    } catch (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 查询失败:`, error);
      // 可以选择继续处理其他批次，或者抛出错误
      // throw error;
    }
  }

  return allBlocks;
}

// 并行处理版本（谨慎使用，可能给数据库带来压力）
export async function getBlocksByIDsParallel(
  blockIds: string[],
  batchSize: number = 50,
  pageSize: number = 500,
  maxConcurrent: number = 3 // 最大并发数
): Promise<Block[]> {
  const batches = [];
  for (let i = 0; i < blockIds.length; i += batchSize) {
    batches.push(blockIds.slice(i, i + batchSize));
  }

  const results = [];
  // 使用PromisePool或其他并发控制库来控制并发数
  for (let i = 0; i < batches.length; i += maxConcurrent) {
    const currentBatches = batches.slice(i, i + maxConcurrent);
    const batchPromises = currentBatches.map((batch) =>
      processBatch(batch, pageSize)
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }

  return results;
}

async function processBatch(
  batch: string[],
  pageSize: number
): Promise<Block[]> {
  const idList = batch.map((id) => `'${id}'`).join(",");
  const baseSQL = `SELECT * FROM blocks WHERE id IN (${idList})`;
  return await paginatedSQLQuery(baseSQL, pageSize);
}
