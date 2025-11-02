import { fetchSyncPost } from "siyuan";

// ============== 1. API Wrappers ==============

/**
 * 检查块是否具有闪卡属性
 */
export async function checkBlockHasCardAttribute(
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
export async function getParentBlocks(blockIds: string[]): Promise<string[]> {
  if (blockIds.length === 0) return [];
  const idList = blockIds.map((id) => `'${id}'`).join(",");
  const parentQuery = `SELECT parent_id FROM blocks WHERE id IN (${idList}) AND parent_id IS NOT NULL`;
  const result = await fetchSyncPost("/api/query/sql", { stmt: parentQuery });
  return result.data
    .map((block: any) => block.parent_id)
    .filter((id: string) => id);
}

/**
 * 获取到期闪卡
 */
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
    const result = await fetchSyncPost("/api/riff/getRiffDueCards", {
      deckID,
      reviewedCardIDs,
    });

    if (result.code !== 0) {
      console.error("获取到期闪卡失败:", result.msg);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("调用getRiffDueCards API失败:", error);
    return null;
  }
}

/**
 * 通过块ID批量添加闪卡到牌组
 */
export async function addRiffCards(
  deckID: string,
  blockIDs: string[]
): Promise<any> {
  if (blockIDs.length === 0) return null;

  try {
    const result = await fetchSyncPost("/api/riff/addRiffCards", {
      deckID,
      blockIDs,
    });

    if (result.code !== 0) {
      console.error("添加闪卡失败:", result.msg);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("调用addRiffCards API失败:", error);
    return null;
  }
}

/**
 * 通过块ID获取对应的闪卡（优先使用番茄API，失败时使用内置API）
 */
export async function getRiffCardsByBlockIds(
  blockIds: string[]
): Promise<any[]> {
  // 优先使用番茄插件API
  if (window.tomato_zZmqus5PtYRi?.siyuan?.getRiffCardsByBlockIDs) {
    try {
      const cardMap =
        await window.tomato_zZmqus5PtYRi.siyuan.getRiffCardsByBlockIDs(
          blockIds
        );
      return [...cardMap.values()].flat();
    } catch (error) {
      console.error("番茄API获取闪卡失败，尝试使用内置API:", error);
      // 继续执行下面的备用方案
    }
  }

  // 备用方案：使用内置API
  if (blockIds.length === 0) return [];

  try {
    const result = await fetchSyncPost("/api/riff/getRiffCardsByBlockIDs", {
      blockIDs: blockIds,
    });
    //输出的闪卡数据结构需要测试。也许不符合标准。
    if (result.code !== 0) {
      console.error("内置API获取闪卡失败:", result.msg);
      return [];
    }

    return result.data.blocks || [];
  } catch (error) {
    console.error("调用getRiffCardsByBlockIDs API失败:", error);
    return [];
  }
}

/**
 * 批量设置闪卡优先级
 */
export async function setCardsPriority(
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
      priority,
      false
    );
  } catch (error) {
    console.error("设置闪卡优先级失败:", error);
    throw error;
  }
}

/**
 * 批量推迟卡片
 */
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

/**
 * 在文档流中打开SQL查询
 */
export function openSQLFlow(sql: string, title: string = "SQL查询") {
  const encodedSQL = encodeURIComponent(sql);
  const encodedTitle = encodeURIComponent(title);

  const url = `siyuan://plugins/sy-docs-flow/open-rule?ruleType=SQL&ruleInput=${encodedSQL}&title=${encodedTitle}`;

  window.open(url);
}

// ============== 4. Card Review Interface ==============

/**
 * 构建闪卡复习数据
 */
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
    const duecardsResponse = await fetchSyncPost("/api/riff/getRiffDueCards", {
      deckID: deckID,
    });

    const filteredCards = duecardsResponse.data.cards.filter((card: any) =>
      blockIds.includes(card.blockID)
    );

    return {
      cards: filteredCards,
      unreviewedCount: filteredCards.length,
      unreviewedNewCardCount: filteredCards.filter(
        (card: any) => card.state === 0
      ).length,
      unreviewedOldCardCount: filteredCards.filter(
        (card: any) => card.state !== 0
      ).length,
    };
  } catch (error) {
    console.error("构建闪卡复习数据失败:", error);
    return null;
  }
}

// ============== 2. Core Algorithm ==============

/**
 * 根据条件查找具有闪卡属性的块
 * @param startingBlocks 起始块数组
 * @param useRecursive 是否使用递归查找
 * @returns 具有闪卡属性的块ID数组
 */
export async function findCardBlocksWithOption(
  startingBlocks: any[],
  useRecursive: boolean
): Promise<string[]> {
  const maxDepth = 5; // 内置属性，不暴露给外部

  if (useRecursive) {
    return await recursiveFindCardBlocks(startingBlocks, maxDepth);
  } else {
    return await filterCardBlocks(startingBlocks);
  }
}

/**
 * 过滤具有闪卡属性的块（不递归）
 */
export async function filterCardBlocks(
  startingBlocks: any[]
): Promise<string[]> {
  const attributeResults = await Promise.all(
    startingBlocks.map((block) => checkBlockHasCardAttribute(block.id))
  );

  return attributeResults
    .filter(({ hasAttribute }) => hasAttribute)
    .map(({ blockId }) => blockId);
}

/**
 * 递归查找具有闪卡属性的块
 */
export async function recursiveFindCardBlocks(
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
      blockIds.map((blockId) => checkBlockHasCardAttribute(blockId))
    );

    attributeResults
      .filter(({ hasAttribute }) => hasAttribute)
      .forEach(({ blockId }) => foundBlocks.add(blockId));

    const blocksToContinue = attributeResults
      .filter(({ hasAttribute }) => !hasAttribute)
      .map(({ blockId }) => blockId);

    if (blocksToContinue.length === 0) return;

    const parentIds = await getParentBlocks(blocksToContinue);
    const validParentIds = parentIds.filter((id) => id);
    if (validParentIds.length > 0) {
      await findRecursive(validParentIds, depth + 1);
    }
  };

  const startingBlockIds = startingBlocks.map((block) => block.id);
  await findRecursive(startingBlockIds);
  return Array.from(foundBlocks);
}

// ============== 3. Data Helpers ==============

/**
 * 获取今日日期字符串
 */
export function getTodayString(): string {
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
export function isTodayCard(card: any, todayString: string): boolean {
  return card.riffCardID?.startsWith(todayString);
}

/**
 * 检查卡片是否未被暂停
 */
export function isNotSuspended(card: any): boolean {
  return !(
    card.ial?.bookmark === "🛑 Suspended Cards" ||
    card.ial?.["custom-card-priority-stop"] !== undefined
  );
}

/**
 * 检查卡片是否可被推迟
 */
export function isPostponableCard(card: any): boolean {
  return isNotSuspended(card);
}

/**
 * 过滤出今日创建的闪卡
 */
export function filterPureTodayCards(cards: any[]): any[] {
  const todayString = getTodayString();
  return cards.filter((card) => isTodayCard(card, todayString));
}
