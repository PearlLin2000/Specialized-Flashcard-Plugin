// AttributeUtils.ts
import * as AvAPI from "./API/apiSiyuanAv";

// ============== 属性视图相关函数 ==============
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
