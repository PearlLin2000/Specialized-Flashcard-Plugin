// src/services/TimerService.ts

interface TimerServiceConfig {
  priorityScanEnabled: boolean;
  priorityScanInterval: number; // 分钟
  cacheUpdateInterval: number; // 分钟
  dataBaseCardsManagementEnabled: boolean; // 新增：数据库卡片管理开关
  dataBaseCardsManagementInterval: number; // 新增：数据库卡片管理间隔（分钟）
}

interface TimerCallbacks {
  onPriorityScan: () => void;
  onCacheUpdate: () => Promise<void>;
  onDataBaseCardsManagement: () => Promise<void>; // 新增：数据库卡片管理回调
}

export class TimerService {
  private priorityScanTimer: number | null = null;
  private cacheUpdateTimer: number | null = null;
  private dataBaseCardsManagementTimer: number | null = null; // 新增：数据库卡片管理定时器
  private callbacks: TimerCallbacks;

  constructor(callbacks: TimerCallbacks) {
    this.callbacks = callbacks;
  }

  start(config: TimerServiceConfig): void {
    this.stop();
    this.createPriorityScanTask(config);
    this.createCacheUpdateTask(config);
    this.createDataBaseCardsManagementTask(config); // 新增：创建数据库卡片管理任务
  }

  stop(): void {
    if (this.priorityScanTimer) {
      window.clearInterval(this.priorityScanTimer);
      this.priorityScanTimer = null;
    }

    if (this.cacheUpdateTimer) {
      window.clearInterval(this.cacheUpdateTimer);
      this.cacheUpdateTimer = null;
    }

    if (this.dataBaseCardsManagementTimer) {
      // 新增：清理数据库卡片管理定时器
      window.clearInterval(this.dataBaseCardsManagementTimer);
      this.dataBaseCardsManagementTimer = null;
    }
  }

  restart(config: TimerServiceConfig): void {
    this.stop();
    this.start(config);
  }

  private createPriorityScanTask(config: TimerServiceConfig): void {
    if (!config.priorityScanEnabled) return;

    const intervalMs = config.priorityScanInterval * 60 * 1000;
    const executeTask = () => {
      try {
        this.callbacks.onPriorityScan();
      } catch (error) {
        console.error("优先级扫描任务执行失败:", error);
      }
    };

    this.priorityScanTimer = window.setInterval(executeTask, intervalMs);
    executeTask(); // 立即执行一次
  }

  private createCacheUpdateTask(config: TimerServiceConfig): void {
    const intervalMs = config.cacheUpdateInterval * 60 * 1000;
    const executeTask = () => {
      try {
        this.callbacks.onCacheUpdate();
      } catch (error) {
        console.error("缓存更新任务执行失败:", error);
      }
    };

    this.cacheUpdateTimer = window.setInterval(executeTask, intervalMs);
    executeTask(); // 立即执行一次
  }

  private createDataBaseCardsManagementTask(config: TimerServiceConfig): void {
    if (!config.dataBaseCardsManagementEnabled) return;

    const intervalMs = config.dataBaseCardsManagementInterval * 60 * 1000;
    const executeTask = async () => {
      try {
        await this.callbacks.onDataBaseCardsManagement();
      } catch (error) {
        console.error("数据库卡片管理任务执行失败:", error);
      }
    };

    this.dataBaseCardsManagementTimer = window.setInterval(
      executeTask,
      intervalMs
    );
    executeTask(); // 立即执行一次
  }
}
