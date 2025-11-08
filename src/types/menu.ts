// src/types/menu.ts
export interface MenuAction {
  type: "OPEN_SETTING" | "CREATE_RIFF_CARDS";
  // 移除: "BATCH_PRIORITY" | "OPEN_SQL" | "OPEN_ALL_CARDS"
  groupId?: string;
  groupName?: string;
  group?: any; // 这个属性现在只在 CREATE_RIFF_CARDS 动作中使用，可以保留
}

export interface MenuItemConfig {
  icon: string;
  label: string;
  action: MenuAction;
  enabled?: boolean;
  separatorBefore?: boolean;
}

export interface MenuServiceDependencies {
  plugin: any;
  dataManager: any;
  // 移除: groupActionService: any; (不再需要)
  cardUtils: any;
  isMobile: boolean;
  onConfigUpdate?: () => Promise<void>;
}
