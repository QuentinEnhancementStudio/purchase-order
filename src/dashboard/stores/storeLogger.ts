import { observe, toJS, makeAutoObservable, Lambda, IValueDidChange } from 'mobx';
import { isPromiseBasedObservable } from 'mobx-utils';
import { pick } from 'lodash';

export interface LoggerConfig {
  enabled: boolean;
  logLevel: 'full' | 'changes' | 'actions';
  excludeFields?: string[];
}


export class StoreLogger {
  private registeredStores = new Map<string, any>();
  private storeConfigs = new Map<string, LoggerConfig>();
  private observeDisposers = new Map<string, Lambda>();
  
  globalEnabled = true;

  constructor() {
    makeAutoObservable(this);
  }

  register(store: any, storeName: string, config: Partial<LoggerConfig> = {}) {
    const defaultConfig: LoggerConfig = {
      enabled: true,
      logLevel: 'changes',
      ...config
    };

    this.registeredStores.set(storeName, store);
    this.storeConfigs.set(storeName, defaultConfig);
    
    this.setupObservers(store, storeName);
    
    if (defaultConfig.enabled && this.globalEnabled) {
      this.logStoreState(store, storeName);
    }
  }

  unregister(storeName: string) {
    this.disposeObservers(storeName);
    this.registeredStores.delete(storeName);
    this.storeConfigs.delete(storeName);
  }

  private setupObservers(store: any, storeName: string) {
    // Observe all changes to the store
    const observeDisposer = observe(store, (change: IValueDidChange<any>) => {
      if (!this.shouldLog(storeName)) return;

      const config = this.storeConfigs.get(storeName)!;
      
      if (config.excludeFields?.includes(change.object?.constructor?.name || '')) return;

      switch (config.logLevel) {
        case 'changes':
          this.logChange(storeName, change);
          break;
        case 'full':
          this.logStoreState(store, storeName);
          break;
      }
    });

    this.observeDisposers.set(storeName, observeDisposer);
  }

  private disposeObservers(storeName: string) {
    const disposer = this.observeDisposers.get(storeName);
    if (disposer) {
      disposer();
      this.observeDisposers.delete(storeName);
    }
  }

  private shouldLog(storeName: string): boolean {
    if (!this.globalEnabled) return false;
    
    const config = this.storeConfigs.get(storeName);
    return config?.enabled ?? false;
  }

  private logChange(storeName: string, change: IValueDidChange<any>) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] 📦 ${storeName}`;
    const oldValue = this.sanitizeValue(change.oldValue);
    const newValue = this.sanitizeValue(change.newValue);
    
    console.log(`${prefix} - value: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
  }

  private logStoreState(store: any, storeName: string) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] 📦 ${storeName}`;
    
    console.groupCollapsed(`${prefix}`);
    console.log('State:', this.sanitizeValue(store));
    console.groupEnd();
  }


  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) return value;
    
	if (isPromiseBasedObservable(value)) {
		return pick(toJS(value), ["state", "value"]);
	}

    try {
      return toJS(value);
    } catch {
      return String(value);
    }
  }
}

export const storeLogger = new StoreLogger();