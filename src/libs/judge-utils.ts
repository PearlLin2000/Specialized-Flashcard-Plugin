/**
 * 判断工具类函数
 */

/**
 * 获取今日日期字符串 (YYYYMMDD格式)
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
 * 过滤出今日创建的闪卡
 */
export function filterPureTodayCards(cards: any[]): any[] {
  const todayString = getTodayString();
  return cards.filter((card) => isTodayCard(card, todayString));
}

/**
 * 检查卡片是否可被推迟
export function isPostponableCard(card: any): boolean {
  return isNotSuspended(card);
}*/

/**
 * 检查卡片是否未被暂停
 */
export function isNotSuspended(card: any): boolean {
  return !(
    card.ial?.bookmark === "🛑 Suspended Cards" ||
    card.ial?.["custom-card-priority-stop"] !== undefined
  );
}
