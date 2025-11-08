// 基础函数
import * as sqlAPI from "./API/apiSiyuanSQL";
import * as riffAPI from "./API/apiSiyuanCard";

export async function isSelfUseSwitchOn(): Promise<number> {
  try {
    const blockId = "20250428141524-dlnghf0"; //一个块id，在自已的笔记里（path：/20250130200147-9q0nu0y.sy）
    const sqlScript = `SELECT * FROM blocks WHERE id = '${blockId}'`;
    const result = await sqlAPI.sql(sqlScript);
    if (
      result &&
      result.length > 0 &&
      result[0].markdown === "开关：临时专项闪卡-自用功能"
    ) {
      return 1;
    }
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
