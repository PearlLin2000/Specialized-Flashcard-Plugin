// DeckUtils.ts
import * as riffAPI from "./API/apiSiyuanCard";

// ============== 1. 卡包常量定义 ==============
export enum DeckId {
  DEFAULT = "20230218211946-2kw8jgx",
  TEMPORARY = "20251103121413-a4s0bfv",
}

// ============== 2. 卡包管理函数 ==============
export async function resetRiffDeck(
  deckID: string,
  blockIDs?: string[]
): Promise<any> {
  try {
    const result = await riffAPI.resetRiffCards(
      "deck",
      deckID,
      deckID,
      blockIDs
    );
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

export async function addRiffCards(
  deckID: string = DeckId.DEFAULT,
  blockIDs: string[]
): Promise<any> {
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

// ============== 3. 内部卡包操作函数 ==============
async function getRiffCards(deckID: any, page: any = 1, pageSize: any = 100) {
  const response = await riffAPI.getRiffCards(deckID, page, pageSize);
  if (response) {
    return response;
  } else {
    throw new Error("获取卡片失败");
  }
}

export async function removeRiffCards(deckID: any, blockIDs: any) {
  const response = await riffAPI.removeRiffCards(deckID, blockIDs);
  if (response) {
    return response;
  } else {
    throw new Error("移除卡片失败");
  }
}

export async function clearDeck(deckID: any) {
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
