import { makeAutoObservable, reaction, IReactionDisposer } from 'mobx';
import { PartnersStore } from './partnersStore';
import { storeLogger } from './storeLogger';

export class RootStore {
  partnersStore: PartnersStore;
  
  // Reaction disposers for cleanup
  private reactionDisposers: IReactionDisposer[] = [];

  constructor() {
    makeAutoObservable(this);
    
    this.partnersStore = new PartnersStore();
    
    // Register stores with logger
    this.initializeLogger();
    
    // Setup cross-store reactions for orchestration
    this.setupCrossStoreReactions();
  }

  private initializeLogger() {
    storeLogger.register(this.partnersStore, 'PartnersStore', {
      enabled: true,
      logLevel: 'full',
      excludeFields: []
    });
  }

  private setupCrossStoreReactions() {}

  dispose() {
    // Clean up orchestration reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
    
    this.partnersStore.dispose();
    
    // Cleanup logger registrations
    storeLogger.unregister('PartnersStore');
  }
}

export const rootStore = new RootStore();