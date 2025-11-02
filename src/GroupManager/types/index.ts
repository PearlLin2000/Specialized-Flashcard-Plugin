// 分组配置接口
export interface GroupConfig {
  id: string;
  name: string;
  sqlQuery: string;
  enabled: boolean;
  priority: number;
  priorityEnabled: boolean;
  categoryId: string;
}

// 组别接口
export interface GroupCategory {
  id: string;
  name: string;
}

// 表单组件 Props 类型
export interface GroupEditFormProps {
  editingGroup: GroupConfig | null;
  onSave: (group: GroupConfig) => void;
  onCancel: () => void;
  plugin: any;
}

export interface CategoryEditFormProps {
  editingCategory: GroupCategory | null;
  onSave: (category: GroupCategory) => void;
  onCancel: () => void;
}

export interface GroupListProps {
  groups: GroupConfig[];
  categories: GroupCategory[];
  activeCategoryId: string;
  onEditGroup: (group: GroupConfig) => void;
  onDeleteGroup: (index: number) => void;
  onToggleGroup: (index: number) => void;
  onMoveGroup: (index: number, direction: "up" | "down") => void;
  onUpdateGroupCategory: (groupId: string, newCategoryId: string) => void;
}

export interface CategoryTabsProps {
  categories: GroupCategory[];
  activeCategoryId: string;
  groupCounts: Record<string, number>;
  onSwitchCategory: (categoryId: string) => void;
  onEditCategory: (category: GroupCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddCategory: () => void;
}

// Store 类型
export interface GroupStore {
  groups: GroupConfig[];
  groupCategories: GroupCategory[];
  activeCategoryId: string;
  editingGroup: GroupConfig | null;
  editingCategory: GroupCategory | null;
  isEditing: boolean;
  isEditingCategory: boolean;
}

export interface ConfigStore {
  postponeDays: number;
  scanInterval: number;
  priorityScanEnabled: boolean;
}

// ... 保持之前的类型定义不变，添加以下类型：

// 主容器 Props 类型
export interface GroupManagerProps {
  plugin: any;
  onConfigUpdate?: (groups: GroupConfig[]) => void;
}

// SQL分组标签页 Props 类型
export interface SqlGroupsTabProps {
  groupCategories: GroupCategory[];
  groups: GroupConfig[];
  activeCategoryId: string;
  onAddCategory: () => void;
  onEditCategory: (category: GroupCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onSwitchCategory: (categoryId: string) => void;
  onAddGroup: () => void;
  onEditGroup: (group: GroupConfig) => void;
  onDeleteGroup: (index: number) => void;
  onToggleGroup: (index: number) => void;
  onMoveGroup: (index: number, direction: "up" | "down") => void;
  onUpdateGroupCategory: (groupId: string, newCategoryId: string) => void;
}

// 全局配置标签页 Props 类型
export interface GlobalConfigTabProps {
  postponeDays: number;
  scanInterval: number;
  priorityScanEnabled: boolean;
  onSaveGlobalConfig: () => void;
}
