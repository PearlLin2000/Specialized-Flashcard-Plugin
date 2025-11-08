// 数据处理功能
import * as riffAPI from "./API/apiSiyuanCard";
import { checkBlockHasCardAttribute, getParentBlocks } from "./baseUtils";

export async function findCardBlocksWithOption(
  startingBlocks: any[],
  useRecursive: boolean
): Promise<string[]> {
  const maxDepth = 5;
  return useRecursive
    ? await recursiveFindCardBlocks(startingBlocks, maxDepth)
    : await filterCardBlocks(startingBlocks);
}

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

export async function recursiveFindCardBlocks(
  startingBlocks: any[],
  maxDepth: number = 5
): Promise<string[]> {
  const foundBlocks = new Set<string>();
  const batchSize = 30;

  const processBatch = async (
    blockIds: string[],
    depth: number
  ): Promise<void> => {
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

    const blocksToContinue = blockIds.filter(
      (blockId) => !foundBlocks.has(blockId)
    );
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
        console.error(
          `获取父块批次 ${Math.floor(i / batchSize) + 1} 失败:`,
          error
        );
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
