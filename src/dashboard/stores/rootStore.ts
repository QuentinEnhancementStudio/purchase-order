import { makeAutoObservable, reaction, IReactionDisposer } from 'mobx';
import { PartnersStore } from './partnersStore';
import { MembersStore } from './membersStore';
import { PurchaseOrdersStore } from './purchaseOrdersStore';
import { storeLogger } from './storeLogger';

export class RootStore {
  partnersStore: PartnersStore;
  membersStore: MembersStore;
  purchaseOrdersStore: PurchaseOrdersStore;
  
  // Reaction disposers for cleanup
  private reactionDisposers: IReactionDisposer[] = [];

  constructor() {
    makeAutoObservable(this);
    
    this.partnersStore = new PartnersStore();
    this.membersStore = new MembersStore();
    this.purchaseOrdersStore = new PurchaseOrdersStore();
    
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
    
    storeLogger.register(this.membersStore, 'MembersStore', {
      enabled: true,
      logLevel: 'full',
      excludeFields: []
    });
    
    storeLogger.register(this.purchaseOrdersStore, 'PurchaseOrdersStore', {
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
    this.membersStore.dispose();
    this.purchaseOrdersStore.dispose();
    
    // Cleanup logger registrations
    storeLogger.unregister('PartnersStore');
    storeLogger.unregister('MembersStore');
    storeLogger.unregister('PurchaseOrdersStore');
  }
}

export const rootStore = new RootStore();