import { request } from "./apiSiyuan";

/*见：
export async function request(url: string, data: any) {
    let response: IWebSocketData = await fetchSyncPost(url, data);
    let res = response.code === 0 ? response.data : null;
    return res;
}
    */

// **************************************** Attribute View API ****************************************

export async function getAttributeViewItemIDsByBoundIDs(
  avID: string,
  blockIDs: string[]
): Promise<string[] | null> {
  try {
    const url = "/api/av/getAttributeViewItemIDsByBoundIDs";
    const data = { avID, blockIDs };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewItemIDsByBoundIDs]:",
      error
    );
    return null;
  }
}

export async function getAttributeViewBoundBlockIDsByItemIDs(
  avID: string,
  itemIDs: string[]
): Promise<string[] | null> {
  try {
    const url = "/api/av/getAttributeViewBoundBlockIDsByItemIDs";
    const data = { avID, itemIDs };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewBoundBlockIDsByItemIDs]:",
      error
    );
    return null;
  }
}

export async function getAttributeViewAddingBlockDefaultValues(
  avID: string,
  viewID?: string,
  groupID?: string,
  previousID?: string,
  addingBlockID?: string
): Promise<{ values: any[] } | null> {
  try {
    const url = "/api/av/getAttributeViewAddingBlockDefaultValues";
    const data = { avID, viewID, groupID, previousID, addingBlockID };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewAddingBlockDefaultValues]:",
      error
    );
    return null;
  }
}

export async function batchReplaceAttributeViewBlocks(
  avID: string,
  isDetached: boolean,
  oldNew: Array<{ [old: string]: string }>
): Promise<null> {
  try {
    const url = "/api/av/batchReplaceAttributeViewBlocks";
    const data = { avID, isDetached, oldNew };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [batchReplaceAttributeViewBlocks]:",
      error
    );
    return null;
  }
}

export async function setAttrViewGroup(
  avID: string,
  blockID: string,
  group: any
): Promise<{
  name: string;
  id: string;
  viewType: string;
  viewID: string;
  views: any[];
  view: any;
  isMirror: boolean;
} | null> {
  try {
    const url = "/api/av/setAttrViewGroup";
    const data = { avID, blockID, group };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [setAttrViewGroup]:", error);
    return null;
  }
}

export async function changeAttrViewLayout(
  blockID: string,
  avID: string,
  layoutType: string
): Promise<{
  name: string;
  id: string;
  viewType: string;
  viewID: string;
  views: any[];
  view: any;
  isMirror: boolean;
} | null> {
  try {
    const url = "/api/av/changeAttrViewLayout";
    const data = { blockID, avID, layoutType };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [changeAttrViewLayout]:", error);
    return null;
  }
}

export async function duplicateAttributeViewBlock(
  avID: string
): Promise<{ avID: string; blockID: string } | null> {
  try {
    const url = "/api/av/duplicateAttributeViewBlock";
    const data = { avID };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [duplicateAttributeViewBlock]:",
      error
    );
    return null;
  }
}

export async function getAttributeViewKeysByAvID(
  avID: string
): Promise<any[] | null> {
  try {
    const url = "/api/av/getAttributeViewKeysByAvID";
    const data = { avID };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewKeysByAvID]:",
      error
    );
    return null;
  }
}

export async function getAttributeViewKeysByID(
  avID: string,
  keyIDs: string[]
): Promise<any[] | null> {
  try {
    const url = "/api/av/getAttributeViewKeysByID";
    const data = { avID, keyIDs };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewKeysByID]:",
      error
    );
    return null;
  }
}

export async function getMirrorDatabaseBlocks(
  avID: string
): Promise<{ refDefs: any[] } | null> {
  try {
    const url = "/api/av/getMirrorDatabaseBlocks";
    const data = { avID };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getMirrorDatabaseBlocks]:",
      error
    );
    return null;
  }
}

export async function setDatabaseBlockView(
  id: string,
  avID: string,
  viewID: string
): Promise<null> {
  try {
    const url = "/api/av/setDatabaseBlockView";
    const data = { id, avID, viewID };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [setDatabaseBlockView]:", error);
    return null;
  }
}

export async function getAttributeViewPrimaryKeyValues(
  id: string,
  keyword: string = "",
  page: number = 1,
  pageSize: number = -1
): Promise<{ name: string; blockIDs: string[]; rows: any[] } | null> {
  try {
    const url = "/api/av/getAttributeViewPrimaryKeyValues";
    const data = { id, keyword, page, pageSize };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewPrimaryKeyValues]:",
      error
    );
    return null;
  }
}

export async function appendAttributeViewDetachedBlocksWithValues(
  avID: string,
  blocksValues: any[][]
): Promise<null> {
  try {
    const url = "/api/av/appendAttributeViewDetachedBlocksWithValues";
    const data = { avID, blocksValues };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [appendAttributeViewDetachedBlocksWithValues]:",
      error
    );
    return null;
  }
}

export async function addAttributeViewBlocks(
  avID: string,
  srcs: any[],
  blockID?: string,
  viewID?: string,
  groupID?: string,
  previousID?: string,
  ignoreDefaultFill: boolean = false
): Promise<null> {
  try {
    const url = "/api/av/addAttributeViewBlocks";
    const data = {
      avID,
      blockID,
      viewID,
      groupID,
      previousID,
      srcs,
      ignoreDefaultFill,
    };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [addAttributeViewBlocks]:",
      error
    );
    return null;
  }
}

export async function removeAttributeViewBlocks(
  avID: string,
  srcIDs: string[]
): Promise<null> {
  try {
    const url = "/api/av/removeAttributeViewBlocks";
    const data = { avID, srcIDs };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [removeAttributeViewBlocks]:",
      error
    );
    return null;
  }
}

export async function addAttributeViewKey(
  avID: string,
  keyID: string,
  keyName: string,
  keyType: string,
  keyIcon: string,
  previousKeyID: string
): Promise<null> {
  try {
    const url = "/api/av/addAttributeViewKey";
    const data = { avID, keyID, keyName, keyType, keyIcon, previousKeyID };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [addAttributeViewKey]:", error);
    return null;
  }
}

export async function removeAttributeViewKey(
  avID: string,
  keyID: string,
  removeRelationDest: boolean = false
): Promise<null> {
  try {
    const url = "/api/av/removeAttributeViewKey";
    const data = { avID, keyID, removeRelationDest };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [removeAttributeViewKey]:",
      error
    );
    return null;
  }
}

export async function sortAttributeViewViewKey(
  avID: string,
  keyID: string,
  previousKeyID: string,
  viewID?: string
): Promise<null> {
  try {
    const url = "/api/av/sortAttributeViewViewKey";
    const data = { avID, viewID, keyID, previousKeyID };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [sortAttributeViewViewKey]:",
      error
    );
    return null;
  }
}

export async function sortAttributeViewKey(
  avID: string,
  keyID: string,
  previousKeyID: string
): Promise<null> {
  try {
    const url = "/api/av/sortAttributeViewKey";
    const data = { avID, keyID, previousKeyID };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [sortAttributeViewKey]:", error);
    return null;
  }
}

export async function getAttributeViewFilterSort(
  id: string,
  blockID: string
): Promise<{ filters: any[]; sorts: any[] } | null> {
  try {
    const url = "/api/av/getAttributeViewFilterSort";
    const data = { id, blockID };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getAttributeViewFilterSort]:",
      error
    );
    return null;
  }
}

export async function searchAttributeViewNonRelationKey(
  avID: string,
  keyword: string
): Promise<{ keys: any[] } | null> {
  try {
    const url = "/api/av/searchAttributeViewNonRelationKey";
    const data = { avID, keyword };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [searchAttributeViewNonRelationKey]:",
      error
    );
    return null;
  }
}

export async function searchAttributeViewRollupDestKeys(
  avID: string,
  keyword: string
): Promise<{ keys: any[] } | null> {
  try {
    const url = "/api/av/searchAttributeViewRollupDestKeys";
    const data = { avID, keyword };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [searchAttributeViewRollupDestKeys]:",
      error
    );
    return null;
  }
}

export async function searchAttributeViewRelationKey(
  avID: string,
  keyword: string
): Promise<{ keys: any[] } | null> {
  try {
    const url = "/api/av/searchAttributeViewRelationKey";
    const data = { avID, keyword };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [searchAttributeViewRelationKey]:",
      error
    );
    return null;
  }
}

export async function getAttributeView(
  id: string
): Promise<{ av: any } | null> {
  try {
    const url = "/api/av/getAttributeView";
    const data = { id };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [getAttributeView]:", error);
    return null;
  }
}

export async function searchAttributeView(
  keyword: string,
  excludes: string[] = []
): Promise<{ results: any[] } | null> {
  try {
    const url = "/api/av/searchAttributeView";
    const data = { keyword, excludes };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [searchAttributeView]:", error);
    return null;
  }
}

export async function renderSnapshotAttributeView(
  snapshot: string,
  id: string
): Promise<{
  name: string;
  id: string;
  viewType: string;
  viewID: string;
  views: any[];
  view: any;
  isMirror: boolean;
} | null> {
  try {
    const url = "/api/av/renderSnapshotAttributeView";
    const data = { snapshot, id };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [renderSnapshotAttributeView]:",
      error
    );
    return null;
  }
}

export async function renderHistoryAttributeView(
  id: string,
  created: string,
  blockID?: string,
  viewID?: string,
  page: number = 1,
  pageSize: number = -1,
  query: string = "",
  groupPaging: any = {}
): Promise<{
  name: string;
  id: string;
  viewType: string;
  viewID: string;
  views: any[];
  view: any;
  isMirror: boolean;
} | null> {
  try {
    const url = "/api/av/renderHistoryAttributeView";
    const data = {
      id,
      created,
      blockID,
      viewID,
      page,
      pageSize,
      query,
      groupPaging,
    };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [renderHistoryAttributeView]:",
      error
    );
    return null;
  }
}

export async function renderAttributeView(
  id: string,
  blockID?: string,
  viewID?: string,
  page: number = 1,
  pageSize: number = -1,
  query: string = "",
  groupPaging: any = {}
): Promise<{
  name: string;
  id: string;
  viewType: string;
  viewID: string;
  views: any[];
  view: any;
  isMirror: boolean;
} | null> {
  try {
    const url = "/api/av/renderAttributeView";
    const data = { id, blockID, viewID, page, pageSize, query, groupPaging };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [renderAttributeView]:", error);
    return null;
  }
}

export async function getCurrentAttrViewImages(
  id: string,
  viewID?: string,
  query: string = ""
): Promise<any[] | null> {
  try {
    const url = "/api/av/getCurrentAttrViewImages";
    const data = { id, viewID, query };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [getCurrentAttrViewImages]:",
      error
    );
    return null;
  }
}

export async function getAttributeViewKeys(id: string): Promise<any[] | null> {
  try {
    const url = "/api/av/getAttributeViewKeys";
    const data = { id };
    return await request(url, data);
  } catch (error) {
    console.error("Attribute View API调用失败 [getAttributeViewKeys]:", error);
    return null;
  }
}

export async function setAttributeViewBlockAttr(
  avID: string,
  keyID: string,
  itemID: string,
  value: any
): Promise<{ value: any } | null> {
  try {
    const url = "/api/av/setAttributeViewBlockAttr";
    const data = { avID, keyID, itemID, value };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [setAttributeViewBlockAttr]:",
      error
    );
    return null;
  }
}

export async function batchSetAttributeViewBlockAttrs(
  avID: string,
  values: any[]
): Promise<null> {
  try {
    const url = "/api/av/batchSetAttributeViewBlockAttrs";
    const data = { avID, values };
    return await request(url, data);
  } catch (error) {
    console.error(
      "Attribute View API调用失败 [batchSetAttributeViewBlockAttrs]:",
      error
    );
    return null;
  }
}
