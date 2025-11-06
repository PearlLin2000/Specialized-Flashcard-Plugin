// src/types/menu.ts
export interface MenuAction {
  type:
    | "OPEN_SETTING"
    | "CREATE_RIFF_CARDS"
    | "BATCH_PRIORITY"
    | "OPEN_SQL"
    | "OPEN_ALL_CARDS";
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
  groupActionService: any;
  cardUtils: any;
  isMobile: boolean;
  onConfigUpdate?: () => Promise<void>;
}
