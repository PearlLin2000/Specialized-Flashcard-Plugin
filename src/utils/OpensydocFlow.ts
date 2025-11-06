// 文档流相关工具函数

/**
 * 构建文档流规则URL
 */
function buildRuleURL(
  ruleType: any,
  ruleInput: any,
  title: any = null
): string {
  // 参数验证
  if (!ruleType || ruleInput === undefined || ruleInput === null) {
    throw new Error("ruleType 和 ruleInput 都是必需参数");
  }

  if (!isValidRuleType(ruleType)) {
    throw new Error(`无效的规则类型: ${ruleType}`);
  }

  const DOCS_FLOW_BASE_URL = "siyuan://plugins/sy-docs-flow/open-rule";

  // 构建查询参数
  const params = new URLSearchParams({
    ruleType: ruleType,
    ruleInput: preprocessInput(ruleType, ruleInput),
  });

  // 添加可选的 title 参数，URLSearchParams 会自动处理编码
  if (title !== null && title !== undefined) {
    params.append("ruleTitle", String(title));
  }

  // 返回完整 URL
  return `${DOCS_FLOW_BASE_URL}?${params.toString()}`;
}

/**
 * 验证规则类型是否有效
 */
function isValidRuleType(ruleType: any): boolean {
  const validTypes = [
    "ChildDocument",
    "SQL",
    "IdList",
    "DocBacklinks",
    "DocBackmentions",
    "OffspringDocument",
    "BlockBacklinks",
    "JS",
    "DailyNote",
  ];
  return validTypes.includes(ruleType);
}

/**
 * 预处理输入数据
 */
function preprocessInput(ruleType: any, input: any): string {
  switch (ruleType) {
    case "IdList":
      return processIdListInput(input);
    case "SQL":
      return processSQLInput(input);
    case "ChildDocument":
    case "OffspringDocument":
    case "DocBacklinks":
    case "DocBackmentions":
    case "BlockBacklinks":
    case "DailyNote":
      return processSingleIdInput(input);
    case "JS":
      return processJavaScriptInput(input);
    default:
      return String(input);
  }
}

/**
 * 处理ID列表输入
 */
function processIdListInput(input: any): string {
  if (Array.isArray(input)) {
    return input.join(",");
  } else if (typeof input === "string") {
    return input
      .split(/[\s,，]+/)
      .filter((id: string) => id.trim())
      .join(",");
  }
  return String(input);
}

/**
 * 处理SQL输入
 */
function processSQLInput(input: any): string {
  if (typeof input !== "string") {
    throw new Error("SQL 规则的输入必须是字符串");
  }
  return input.trim();
}

/**
 * 处理单ID输入
 */
function processSingleIdInput(input: any): string {
  if (Array.isArray(input) && input.length > 0) {
    return String(input[0]);
  }
  return String(input);
}

/**
 * 处理JavaScript输入
 */
function processJavaScriptInput(input: any): string {
  if (typeof input !== "string") {
    throw new Error("JS 规则的输入必须是字符串代码");
  }
  return input;
}

/**
 * 在文档流中打开SQL查询
 */
export function openSQLFlow(sql: string, title?: string): void {
  const url = buildRuleURL("SQL", sql, title);
  window.open(url);
}

/**
 * 在文档流中打开ID列表查询
 * @param blockIds 块ID数组，支持单个或多个ID
 * @param title 可选的标题参数
 */
export function openIdListFlow(blockIds: string[], title?: string): void {
  const url = buildRuleURL("IdList", blockIds, title);
  window.open(url);
}
