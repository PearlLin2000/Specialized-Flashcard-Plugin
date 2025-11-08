// 番茄工具箱扩展功能
export function getTodayString(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");
}

export function isTodayCard(card: any, todayString: string): boolean {
  return card.riffCardID?.startsWith(todayString);
}

export function isNotSuspended(card: any): boolean {
  return !(
    card.ial?.bookmark === "🛑 Suspended Cards" ||
    card.ial?.["custom-card-priority-stop"] !== undefined
  );
}

export function isPostponableCard(card: any): boolean {
  return isNotSuspended(card);
}

export function filterPureTodayCards(cards: any[]): any[] {
  const todayString = getTodayString();
  return cards.filter((card) => isTodayCard(card, todayString));
}

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
