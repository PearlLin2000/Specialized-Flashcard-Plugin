// src/types/menu.ts
// src/types/menu.ts
export interface MenuAction {
  type: "OPEN_SETTING" | "CREATE_RIFF_CARDS" | "SHOW_ALL_DUE_CARDS";
  groupId?: string;
  groupName?: string;
  group?: any;
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
