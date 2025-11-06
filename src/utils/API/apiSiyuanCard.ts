import { request } from "./apiSiyuan";

/*见：
export async function request(url: string, data: any) {
    let response: IWebSocketData = await fetchSyncPost(url, data);
    let res = response.code === 0 ? response.data : null;
    return res;
}
    */

export interface Deck {
  id: string;
  name: string;
  size: number;
  created: string; // 格式: "2006-01-02 15:04:05"
  updated: string; // 格式: "2006-01-02 15:04:05"
}

// **************************************** Riff API ****************************************

export async function getRiffCardsByBlockIDs(
  blockIDs: string[]
): Promise<{ blocks: any[] } | null> {
  try {
    const url = "/api/riff/getRiffCardsByBlockIDs";
    const data = { blockIDs };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getRiffCardsByBlockIDs]:", error);
    return null;
  }
}

export async function batchSetRiffCardsDueTime(
  cardDues: Array<{ id: string; due: string }>
): Promise<null> {
  try {
    const url = "/api/riff/batchSetRiffCardsDueTime";
    const data = { cardDues };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [batchSetRiffCardsDueTime]:", error);
    return null;
  }
}

export async function resetRiffCards(
  type: "notebook" | "tree" | "deck",
  id: string,
  deckID: string,
  blockIDs?: string[]
): Promise<null> {
  try {
    const url = "/api/riff/resetRiffCards";
    const data = { type, id, deckID, blockIDs: blockIDs || [] };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [resetRiffCards]:", error);
    return null;
  }
}

export async function getNotebookRiffCards(
  id: string,
  page: number,
  pageSize: number = 20
): Promise<{ blocks: string[]; total: number; pageCount: number } | null> {
  try {
    const url = "/api/riff/getNotebookRiffCards";
    const data = { id, page, pageSize };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getNotebookRiffCards]:", error);
    return null;
  }
}

export async function getTreeRiffCards(
  id: string,
  page: number,
  pageSize: number = 20
): Promise<{ blocks: string[]; total: number; pageCount: number } | null> {
  try {
    const url = "/api/riff/getTreeRiffCards";
    const data = { id, page, pageSize };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getTreeRiffCards]:", error);
    return null;
  }
}

export async function getRiffCards(
  id: string,
  page: number,
  pageSize: number = 20
): Promise<{ blocks: any[]; total: number; pageCount: number } | null> {
  try {
    const url = "/api/riff/getRiffCards";
    const data = { id, page, pageSize };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getRiffCards]:", error);
    return null;
  }
}

export async function reviewRiffCard(
  deckID: string,
  cardID: string,
  rating: number,
  reviewedCards?: Array<{ cardID: string }>
): Promise<null> {
  try {
    const url = "/api/riff/reviewRiffCard";
    const data = { deckID, cardID, rating, reviewedCards: reviewedCards || [] };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [reviewRiffCard]:", error);
    return null;
  }
}

export async function skipReviewRiffCard(
  deckID: string,
  cardID: string
): Promise<null> {
  try {
    const url = "/api/riff/skipReviewRiffCard";
    const data = { deckID, cardID };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [skipReviewRiffCard]:", error);
    return null;
  }
}

export async function getNotebookRiffDueCards(
  notebook: string,
  reviewedCards?: Array<{ cardID: string }>
): Promise<{
  cards: any[];
  unreviewedCount: number;
  unreviewedNewCardCount: number;
  unreviewedOldCardCount: number;
} | null> {
  try {
    const url = "/api/riff/getNotebookRiffDueCards";
    const data = { notebook, reviewedCards: reviewedCards || [] };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getNotebookRiffDueCards]:", error);
    return null;
  }
}

export async function getTreeRiffDueCards(
  rootID: string,
  reviewedCards?: Array<{ cardID: string }>
): Promise<{
  cards: any[];
  unreviewedCount: number;
  unreviewedNewCardCount: number;
  unreviewedOldCardCount: number;
} | null> {
  try {
    const url = "/api/riff/getTreeRiffDueCards";
    const data = { rootID, reviewedCards: reviewedCards || [] };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getTreeRiffDueCards]:", error);
    return null;
  }
}

export async function getRiffDueCards(
  deckID: string,
  reviewedCards?: Array<{ cardID: string }>
): Promise<{
  cards: any[];
  unreviewedCount: number;
  unreviewedNewCardCount: number;
  unreviewedOldCardCount: number;
} | null> {
  try {
    const url = "/api/riff/getRiffDueCards";
    const data = { deckID, reviewedCards: reviewedCards || [] };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [getRiffDueCards]:", error);
    return null;
  }
}

export async function removeRiffCards(
  deckID: string,
  blockIDs: string[]
): Promise<{ deck: any } | null> {
  try {
    const url = "/api/riff/removeRiffCards";
    const data = { deckID, blockIDs };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [removeRiffCards]:", error);
    return null;
  }
}

export async function addRiffCards(
  deckID: string,
  blockIDs: string[]
): Promise<{ deck: any } | null> {
  try {
    const url = "/api/riff/addRiffCards";
    const data = { deckID, blockIDs };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [addRiffCards]:", error);
    return null;
  }
}

export async function renameRiffDeck(
  deckID: string,
  name: string
): Promise<null> {
  try {
    const url = "/api/riff/renameRiffDeck";
    const data = { deckID, name };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [renameRiffDeck]:", error);
    return null;
  }
}

export async function removeRiffDeck(deckID: string): Promise<null> {
  try {
    const url = "/api/riff/removeRiffDeck";
    const data = { deckID };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [removeRiffDeck]:", error);
    return null;
  }
}

export async function createRiffDeck(
  name: string
): Promise<{ deck: any } | null> {
  try {
    const url = "/api/riff/createRiffDeck";
    const data = { name };
    return await request(url, data);
  } catch (error) {
    console.error("Riff API调用失败 [createRiffDeck]:", error);
    return null;
  }
}

export async function getRiffDecks(): Promise<any[] | null> {
  try {
    const url = "/api/riff/getRiffDecks";
    return await request(url, {});
  } catch (error) {
    console.error("Riff API调用失败 [getRiffDecks]:", error);
    return null;
  }
}
