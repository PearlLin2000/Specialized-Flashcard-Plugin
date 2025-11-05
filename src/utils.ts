import { fetchSyncPost } from "siyuan";

/**
 * 卡包ID类：先写在这里。
 */

export enum DeckId {
  DEFAULT = "20230218211946-2kw8jgx",
  TEMPORARY = "20251103121413-a4s0bfv",
}

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

// ============== 5. 文档流的链接构建与调用 ==============

//文档流的链接构建

function buildRuleURL(ruleType, ruleInput, title = null) {
  // 参数验证
  if (!ruleType || ruleInput === undefined || ruleInput === null) {
    throw new Error("ruleType 和 ruleInput 都是必需参数");
  }

  if (!isValidRuleType(ruleType)) {
    throw new Error(`无效的规则类型: ${ruleType}`);
  }

  const DOCS_FLOW_BASE_URL = "siyuan://plugins/sy-docs-flow/open-rule";

  // 构建查询参数
  const params = new URLSearchParams({
    ruleType: ruleType,
    ruleInput: preprocessInput(ruleType, ruleInput),
  });

  // 添加可选的 title 参数，URLSearchParams 会自动处理编码
  if (title !== null && title !== undefined) {
    params.append("ruleTitle", String(title));
  }

  // 返回完整 URL
  return `${DOCS_FLOW_BASE_URL}?${params.toString()}`;
}

function isValidRuleType(ruleType) {
  const validTypes = [
    "ChildDocument",
    "SQL",
    "IdList",
    "DocBacklinks",
    "DocBackmentions",
    "OffspringDocument",
    "BlockBacklinks",
    "JS",
    "DailyNote",
  ];
  return validTypes.includes(ruleType);
}

function preprocessInput(ruleType: any, input: any) {
  switch (ruleType) {
    case "IdList":
      return processIdListInput(input);
    case "SQL":
      return processSQLInput(input);
    case "ChildDocument":
    case "OffspringDocument":
    case "DocBacklinks":
    case "DocBackmentions":
    case "BlockBacklinks":
    case "DailyNote":
      return processSingleIdInput(input);
    case "JS":
      return processJavaScriptInput(input);
    default:
      return String(input);
  }
}

function processIdListInput(input: {
  join: (arg0: string) => any;
  split: (arg0: RegExp) => any[];
}) {
  if (Array.isArray(input)) {
    return input.join(",");
  } else if (typeof input === "string") {
    return input
      .split(/[\s,，]+/)
      .filter((id) => id.trim())
      .join(",");
  }
  return String(input);
}

function processSQLInput(input) {
  if (typeof input !== "string") {
    throw new Error("SQL 规则的输入必须是字符串");
  }
  return input.trim();
}

function processSingleIdInput(input) {
  if (Array.isArray(input) && input.length > 0) {
    return String(input[0]);
  }
  return String(input);
}

function processJavaScriptInput(input) {
  if (typeof input !== "string") {
    throw new Error("JS 规则的输入必须是字符串代码");
  }
  return input;
}

/**
 * 在文档流中打开SQL查询
 */
export function openSQLFlow(sql: string, title?: string) {
  const url = buildRuleURL("SQL", sql, title);
  window.open(url);
}

/**
 * 在文档流中打开ID列表查询
 * @param blockIds 块ID数组，支持单个或多个ID
 * @param title 可选的标题参数
 */
export function openIdListFlow(blockIds: string[], title?: string) {
  const url = buildRuleURL("IdList", blockIds, title);
  window.open(url);
}

// 在 utils.ts 中添加分页查询工具函数
export async function paginatedSQLQuery(
  baseSQL: string,
  pageSize: number = 100,
  maxPages: number = 10
): Promise<any[]> {
  let allResults: any[] = [];
  let page = 0;

  //(`开始分页查询，每页${pageSize}条，最多${maxPages}页`);

  while (page < maxPages) {
    const offset = page * pageSize;

    // 构建分页SQL - 处理原始SQL是否已有LIMIT的情况
    let paginatedSQL = baseSQL;
    if (baseSQL.toLowerCase().includes("limit")) {
      // 如果原SQL已有LIMIT，替换为分页LIMIT
      paginatedSQL = baseSQL.replace(
        /limit\s+\d+/i,
        `LIMIT ${pageSize} OFFSET ${offset}`
      );
    } else {
      paginatedSQL = `${baseSQL} LIMIT ${pageSize} OFFSET ${offset}`;
    }

    try {
      //(`查询第${page + 1}页, OFFSET: ${offset}`);

      const result = await fetchSyncPost("/api/query/sql", {
        stmt: paginatedSQL,
      });

      if (!result.data || result.data.length === 0) {
        //(`第${page + 1}页无数据，查询结束`);
        break;
      }

      allResults = allResults.concat(result.data);
      //(`第${page + 1}页获取到${result.data.length}条数据`);

      // 如果返回数量小于pageSize，说明已经是最后一页
      if (result.data.length < pageSize) {
        //(`最后一页数据不足${pageSize}条，查询结束`);
        break;
      }

      // 添加延迟避免资源竞争
      await new Promise((resolve) => setTimeout(resolve, 200));
      page++;
    } catch (error) {
      console.error(`分页查询第${page + 1}页失败:`, error);
      // 当前页失败时继续尝试下一页
      page++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  //(`分页查询完成，总共获取${allResults.length}条闪卡数据`);
  return allResults;
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
  const batchSize = 30; // 新增批次大小参数

  /*(
    `开始递归查找，初始块数: ${startingBlocks.length}, 批次大小: ${batchSize}, 最大深度: ${maxDepth}`
  );*/

  const processBatch = async (
    blockIds: string[],
    depth: number
  ): Promise<void> => {
    if (depth >= maxDepth || blockIds.length === 0) {
      //(`递归深度 ${depth} 达到限制或无可处理块，停止递归`);
      return;
    }

    //(`深度 ${depth} 处理 ${blockIds.length} 个块`);

    // 分批处理属性检查
    for (let i = 0; i < blockIds.length; i += batchSize) {
      const batch = blockIds.slice(i, i + batchSize);
      /*(
        `处理批次 ${Math.floor(i / batchSize) + 1}, 大小: ${batch.length}`
      );*/

      try {
        const attributeResults = await Promise.all(
          batch.map((blockId) => checkBlockHasCardAttribute(blockId))
        );

        const foundInBatch = attributeResults
          .filter(({ hasAttribute }) => hasAttribute)
          .map(({ blockId }) => blockId);

        foundInBatch.forEach((blockId) => foundBlocks.add(blockId));

        /*(
          `批次 ${Math.floor(i / batchSize) + 1} 发现 ${
            foundInBatch.length
          } 个闪卡块`
        );*/

        // 添加请求延迟避免资源竞争
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 处理失败:`, error);
      }
    }

    // 继续处理没有属性的块
    const blocksToContinue = blockIds.filter(
      (blockId) => !foundBlocks.has(blockId)
    );

    /*(
      `深度 ${depth} 有 ${blocksToContinue.length} 个块需要继续向上查找`
    );*/

    if (blocksToContinue.length === 0) return;

    // 分批获取父块
    const parentIds: string[] = [];
    for (let i = 0; i < blocksToContinue.length; i += batchSize) {
      const batch = blocksToContinue.slice(i, i + batchSize);
      /*(
        `获取父块批次 ${Math.floor(i / batchSize) + 1}, 大小: ${batch.length}`
      );*/

      try {
        const batchParentIds = await getParentBlocks(batch);
        const validParentIds = batchParentIds.filter((id) => id);
        parentIds.push(...validParentIds);

        /*(
          `批次 ${Math.floor(i / batchSize) + 1} 获取到 ${
            validParentIds.length
          } 个有效父块`
        );*/

        // 添加请求延迟避免资源竞争
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `获取父块批次 ${Math.floor(i / batchSize) + 1} 失败:`,
          error
        );
      }
    }

    // 去重父块ID
    const uniqueParentIds = [...new Set(parentIds)];
    //(`去重后得到 ${uniqueParentIds.length} 个唯一父块`);

    if (uniqueParentIds.length > 0) {
      await processBatch(uniqueParentIds, depth + 1);
    }
  };

  const startingBlockIds = startingBlocks.map((block) => block.id);
  await processBatch(startingBlockIds, 0);

  const result = Array.from(foundBlocks);
  //(`递归查找完成，总共发现 ${result.length} 个闪卡块`);
  return result;
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

/**
 * 重置牌组中卡片的学习进度
 * @param deckID 卡片组ID
 * @param blockIDs 可选的块ID数组，如果不传或为空则重置所有卡片
 * @returns 重置结果或null（失败时）
 */
export async function resetRiffDeck(
  deckID: string,
  blockIDs?: string[]
): Promise<any> {
  try {
    const result = await fetchSyncPost("/api/riff/resetRiffCards", {
      type: "deck",
      id: deckID, // 对于type=deck，id就是deckID
      deckID: deckID, // 同时传递deckID参数
      blockIDs: blockIDs || [],
    });

    if (result.code !== 0) {
      console.error("重置卡片失败:", result.msg);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("调用resetRiffCards API失败:", error);
    return null;
  }
}

/**
 * 重置整个牌组的所有卡片
 * @param deckID 卡片组ID
 * @returns 重置结果或null（失败时）
 */
export async function resetEntireDeck(deckID: string): Promise<any> {
  return resetRiffDeck(deckID, []);
}

// 闪卡操作函数封装
async function getRiffCards(deckID, page = 1, pageSize = 100) {
  const response = await fetchSyncPost("/api/riff/getRiffCards", {
    id: deckID,
    page: page,
    pageSize: pageSize,
  });

  if (response && response.code === 0) {
    return response.data;
  } else {
    throw new Error(response?.msg || "获取卡片失败");
  }
}

async function removeRiffCards(deckID, blockIDs) {
  const response = await fetchSyncPost("/api/riff/removeRiffCards", {
    deckID: deckID,
    blockIDs: blockIDs,
  });

  if (response && response.code === 0) {
    return response.data;
  } else {
    throw new Error(response?.msg || "移除卡片失败");
  }
}

async function batchCreateCards(blockIds: string[]) {
  this.showLoadingDialog("正在批量制卡...");

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const blockId of blockIds) {
      try {
        await addRiffCards([blockId]);
        successCount++;
      } catch (error) {
        console.error(`制卡失败，块ID: ${blockId}`, error);
        errorCount++;
      }
    }

    this.closeLoadingDialog();

    if (errorCount === 0) {
      showMessage(`批量制卡完成，成功制作 ${successCount} 张卡片`);
    } else {
      showMessage(
        `批量制卡完成，成功 ${successCount} 张，失败 ${errorCount} 张`
      );
    }
  } catch (error) {
    this.closeLoadingDialog();
    console.error("批量制卡过程中发生错误:", error);
    showMessage("批量制卡失败，请查看控制台错误信息");
  }
}

async function clearDeck(deckID) {
  try {
    let allBlockIDs = [];
    let page = 1;
    const pageSize = 100;

    console.log(`开始清空卡包: ${deckID}`);

    while (true) {
      const data = await getRiffCards(deckID, page, pageSize);

      if (!data.blocks || data.blocks.length === 0) {
        break;
      }

      const pageBlockIDs = data.blocks.map((card) => card.id);
      allBlockIDs = allBlockIDs.concat(pageBlockIDs);

      console.log(`第 ${page} 页获取到 ${pageBlockIDs.length} 张卡片`);

      if (page >= data.pageCount) {
        break;
      }
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
