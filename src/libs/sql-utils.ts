/**
 * SQL查询相关工具函数
 */

/**
 * 检查块是否具有闪卡属性
 */
export async function checkBlockHasCardAttribute(
  blockId: string,
  fetchSyncPost: Function
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
export async function getParentBlocks(
  blockIds: string[],
  fetchSyncPost: Function
): Promise<string[]> {
  if (blockIds.length === 0) return [];
  const idList = blockIds.map((id) => `'${id}'`).join(",");
  const parentQuery = `SELECT parent_id FROM blocks WHERE id IN (${idList}) AND parent_id IS NOT NULL`;
  const result = await fetchSyncPost("/api/query/sql", { stmt: parentQuery });
  return result.data
    .map((block: any) => block.parent_id)
    .filter((id: string) => id);
}
