// src/services/TimerService.ts

interface TimerServiceConfig {
  priorityScanEnabled: boolean;
  priorityScanInterval: number; // 分钟
  cacheUpdateInterval: number; // 分钟
}

interface TimerCallbacks {
  onPriorityScan: () => void;
  onCacheUpdate: () => Promise<void>;
}

export class TimerService {
  private priorityScanTimer: number | null = null;
  private cacheUpdateTimer: number | null = null;
  private callbacks: TimerCallbacks;

  constructor(callbacks: TimerCallbacks) {
    this.callbacks = callbacks;
  }

  start(config: TimerServiceConfig): void {
    this.stop();
    this.createPriorityScanTask(config);
    this.createCacheUpdateTask(config);
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
}
