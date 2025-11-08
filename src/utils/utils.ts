// utils.ts
import * as sqlAPI from "./API/apiSiyuanSQL";
import * as riffAPI from "./API/apiSiyuanCard";
import * as AvAPI from "./API/apiSiyuanAv";

// ============== 1. 常量定义 ==============
export enum DeckId {
  DEFAULT = "20230218211946-2kw8jgx",
  TEMPORARY = "20251103121413-a4s0bfv",
}

// ============== 2. 属性视图相关函数 ==============
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

    const itemIDs: string[] = view.itemIds || [];
    if (itemIDs.length === 0) {
      console.warn(`⚠️ 视图中没有 itemIDs`);
      return [];
    }

    const boundBlockIDs: Record<string, string> | null =
      await AvAPI.getAttributeViewBoundBlockIDsByItemIDs(avID, itemIDs);

    if (!boundBlockIDs) {
      console.warn(`❌ 获取 BoundBlockIDs 失败`);
      return [];
    }

    const result: string[] = Object.values(boundBlockIDs).filter(
      (blockID) => blockID && blockID.trim() !== ""
    );

    return result;
  } catch (error) {
    console.error(`💥 获取 BoundBlockIDs 失败:`, error);
    return [];
  }
}

// ============== 3. 核心算法函数 ==============
export async function findCardBlocksWithOption(
  startingBlocks: any[],
  useRecursive: boolean
): Promise<string[]> {
  const maxDepth = 5;
  return useRecursive 
    ? await recursiveFindCardBlocks(startingBlocks, maxDepth)
    : await filterCardBlocks(startingBlocks);
}

export async function filterCardBlocks(startingBlocks: any[]): Promise<string[]> {
  const attributeResults = await Promise.all(
    startingBlocks.map((block) => checkBlockHasCardAttribute(block.id))
  );
  return attributeResults
    .filter(({ hasAttribute }) => hasAttribute)
    .map(({ blockId }) => blockId);
}

export async function recursiveFindCardBlocks(
  startingBlocks: any[],
  maxDepth: number = 5
): Promise<string[]> {
  const foundBlocks = new Set<string>();
  const batchSize = 30;

  const processBatch = async (blockIds: string[], depth: number): Promise<void> => {
    if (depth >= maxDepth || blockIds.length === 0) return;

    for (let i = 0; i < blockIds.length; i += batchSize) {
      const batch = blockIds.slice(i, i + batchSize);
      try {
        const attributeResults = await Promise.all(
          batch.map((blockId) => checkBlockHasCardAttribute(blockId))
        );
        const foundInBatch = attributeResults
          .filter(({ hasAttribute }) => hasAttribute)
          .map(({ blockId }) => blockId);
        foundInBatch.forEach((blockId) => foundBlocks.add(blockId));
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 处理失败:`, error);
      }
    }

    const blocksToContinue = blockIds.filter((blockId) => !foundBlocks.has(blockId));
    if (blocksToContinue.length === 0) return;

    const parentIds: string[] = [];
    for (let i = 0; i < blocksToContinue.length; i += batchSize) {
      const batch = blocksToContinue.slice(i, i + batchSize);
      try {
        const batchParentIds = await getParentBlocks(batch);
        const validParentIds = batchParentIds.filter((id) => id);
        parentIds.push(...validParentIds);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`获取父块批次 ${Math.floor(i / batchSize) + 1} 失败:`, error);
      }
    }

    const uniqueParentIds = [...new Set(parentIds)];
    if (uniqueParentIds.length > 0) {
      await processBatch(uniqueParentIds, depth + 1);
    }
  };

  const startingBlockIds = startingBlocks.map((block) => block.id);
  await processBatch(startingBlockIds, 0);
  return Array.from(foundBlocks);
}

// ============== 4. 闪卡复习接口 ==============
export async function buildDueCardsData(
  deckID: string,
  blockIds: string[]
): Promise<{
  cards: any[];
  unreviewedCount: number;
  unreviewedNewCardCount: number;
  unreviewedOldCardCount: number;
} | null> {
  try {
    const duecardsResponse = await riffAPI.getRiffDueCards(deckID);
    if (!duecardsResponse) return null;

    const filteredCards = duecardsResponse.cards.filter((card: any) =>
      blockIds.includes(card.blockID)
    );

    return {
      cards: filteredCards,
      unreviewedCount: filteredCards.length,
      unreviewedNewCardCount: filteredCards.filter((card: any) => card.state === 0).length,
      unreviewedOldCardCount: filteredCards.filter((card: any) => card.state !== 0).length,
    };
  } catch (error) {
    console.error("构建闪卡复习数据失败:", error);
    return null;
  }
}

// ============== 5. 数据辅助函数 ==============
export function getTodayString(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");
}

export function isTodayCard(card: any, todayString: string): boolean {
  return card.riffCardID?.startsWith(todayString);
}

export function isNotSuspended(card: any): boolean {
  return !(
    card.ial?.bookmark === "🛑 Suspended Cards" ||
    card.ial?.["custom-card-priority-stop"] !== undefined
  );
}

export function isPostponableCard(card: any): boolean {
  return isNotSuspended(card);
}

export function filterPureTodayCards(cards: any[]): any[] {
  const todayString = getTodayString();
  return cards.filter((card) => isTodayCard(card, todayString));
}

// ============== 6. 分页查询工具 ==============
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
      paginatedSQL = baseSQL.replace(/limit\s+\d+/i, `LIMIT ${pageSize} OFFSET ${offset}`);
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

// ============== 7. 牌组管理函数 ==============
export async function resetRiffDeck(
  deckID: string,
  blockIDs?: string[]
): Promise<any> {
  try {
    const result = await riffAPI.resetRiffCards("deck", deckID, deckID, blockIDs);
    if (!result) {
      console.error("重置卡片失败");
      return null;
    }
    return result;
  } catch (error) {
    console.error("调用resetRiffCards API失败:", error);
    return null;
  }
}

export async function resetEntireDeck(deckID: string): Promise<any> {
  return resetRiffDeck(deckID, []);
}

export async function getAllRiffCardsByDeckID(
  deckId: string,
  pageSize = 1000
): Promise<any[]> {
  const allCards: any[] = [];
  for (let page = 1; ; page++) {
    const ret = await getRiffCards(deckId, page, pageSize);
    if (!ret?.blocks || ret.blocks.length === 0) break;
    allCards.push(...ret.blocks);
    if (page >= ret.pageCount) break;
  }
  return allCards;
}

// ============== 8. 闪卡操作函数 ==============
export async function checkBlockHasCardAttribute(blockId: string): Promise<{ blockId: string; hasAttribute: boolean }> {
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

export async function addRiffCards(deckID: string, blockIDs: string[]): Promise<any> {
  if (blockIDs.length === 0) return null;
  try {
    const result = await riffAPI.addRiffCards(deckID, blockIDs);
    if (!result) {
      console.error("添加闪卡失败");
      return null;
    }
    return result;
  } catch (error) {
    console.error("调用addRiffCards API失败:", error);
    return null;
  }
}

export async function getRiffCardsByBlockIds(blockIds: string[]): Promise<any[]> {
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

export async function setCardsPriority(cards: any[], priority: number): Promise<void> {
  if (!window.tomato_zZmqus5PtYRi?.cardPriorityBox?.updateDocPriorityBatchDialog) {
    console.error("tomato_zZmqus5PtYRi 优先级设置API不可用");
    return;
  }
  try {
    await window.tomato_zZmqus5PtYRi.cardPriorityBox.updateDocPriorityBatchDialog(
      cards,
      priority,
      false
    );
  } catch (error) {
    console.error("设置闪卡优先级失败:", error);
    throw error;
  }
}

export async function postponeCards(cards: any[], days: number): Promise<void> {
  if (cards.length === 0) return;
  try {
    await window.tomato_zZmqus5PtYRi.cardPriorityBox.stopCards(
      cards,
      false,
      days.toString()
    );
  } catch (error) {
    console.error(`批量推迟卡片失败:`, error);
  }
}

// ============== 9. 开关检查函数 ==============
export async function isSelfUseSwitchOn(): Promise<number> {
  try {
    const blockId = "20250428141524-dlnghf0";
    const sqlScript = `SELECT * FROM blocks WHERE id = '${blockId}'`;
    const result = await sqlAPI.sql(sqlScript);
    //console.log(`检查开关块 ${blockId} 结果:`, result);
    if (result && result.length > 0 && result[0].markdown === "开关：临时专项闪卡-自用功能") {
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`检查自用功能开关时出错:`, error);
    return 0;
  }
}

// ============== 10. 内部辅助函数 ==============
async function getRiffCards(deckID: any, page: any = 1, pageSize: any = 100) {
  const response = await riffAPI.getRiffCards(deckID, page, pageSize);
  if (response) {
    return response;
  } else {
    throw new Error("获取卡片失败");
  }
}

async function removeRiffCards(deckID: any, blockIDs: any) {
  const response = await riffAPI.removeRiffCards(deckID, blockIDs);
  if (response) {
    return response;
  } else {
    throw new Error("移除卡片失败");
  }
}

async function clearDeck(deckID: any) {
  try {
    let allBlockIDs = [];
    let page = 1;
    const pageSize = 100;
    console.log(`开始清空卡包: ${deckID}`);

    while (true) {
      const data = await getRiffCards(deckID, page, pageSize);
      if (!data.blocks || data.blocks.length === 0) break;

      const pageBlockIDs = data.blocks.map((card: any) => card.id);
      allBlockIDs = allBlockIDs.concat(pageBlockIDs);
      console.log(`第 ${page} 页获取到 ${pageBlockIDs.length} 张卡片`);

      if (page >= data.pageCount) break;
      page++;
    }

    if (allBlockIDs.length === 0) {
      console.log("卡包为空，无需清理");
      return;
    }

    console.log(`总共获取到 ${allBlockIDs.length} 张卡片，开始移除...`);
    await removeRiffCards(deckID, allBlockIDs);
    console.log(`成功移除 ${allBlockIDs.length} 张卡片`);
  } catch (error) {
    console.error("清空卡包时出错:", error);
    throw error;
  }
}