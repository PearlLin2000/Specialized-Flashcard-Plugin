import { checkBlockHasCardAttribute, getParentBlocks } from "./sql-utils";

/**
 * 卡片相关工具函数
 */

/**
 * 递归查找具有闪卡属性的块
 */
export async function recursiveFindCardBlocks(
  startingBlocks: any[],
  maxDepth: number = 5,
  fetchSyncPost: Function
): Promise<string[]> {
  const foundBlocks = new Set<string>();

  const findRecursive = async (
    blockIds: string[],
    depth = 0
  ): Promise<void> => {
    if (depth >= maxDepth || blockIds.length === 0) return;

    const attributeResults = await Promise.all(
      blockIds.map((blockId) =>
        checkBlockHasCardAttribute(blockId, fetchSyncPost)
      )
    );

    attributeResults
      .filter(({ hasAttribute }) => hasAttribute)
      .forEach(({ blockId }) => foundBlocks.add(blockId));

    const blocksToContinue = attributeResults
      .filter(({ hasAttribute }) => !hasAttribute)
      .map(({ blockId }) => blockId);

    if (blocksToContinue.length === 0) return;

    const parentIds = await getParentBlocks(blocksToContinue, fetchSyncPost);
    const validParentIds = parentIds.filter((id) => id);

    if (validParentIds.length > 0) {
      await findRecursive(validParentIds, depth + 1);
    }
  };

  const startingBlockIds = startingBlocks.map((block) => block.id);
  await findRecursive(startingBlockIds);

  return Array.from(foundBlocks);
}
