import { makeAutoObservable, reaction, IReactionDisposer } from 'mobx';
import { PartnersStore } from './partnersStore';
import { PurchaseOrdersStore } from './purchaseOrdersStore';
import { UiStore } from './uiStore';
import { storeLogger } from './storeLogger';
import { Partner, PurchaseOrder } from '../types';

export class RootStore {
  partnersStore: PartnersStore;
  purchaseOrdersStore: PurchaseOrdersStore;
  uiStore: UiStore;
  
  // Reaction disposers for cleanup
  private reactionDisposers: IReactionDisposer[] = [];

  constructor() {
    makeAutoObservable(this);
    
    this.partnersStore = new PartnersStore();
    this.purchaseOrdersStore = new PurchaseOrdersStore();
    this.uiStore = new UiStore();
    
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

    storeLogger.register(this.purchaseOrdersStore, 'PurchaseOrdersStore', {
      enabled: true,
      logLevel: 'full',
      excludeFields: []
    });

    storeLogger.register(this.uiStore, 'UiStore', {
      enabled: false,
      logLevel: 'full',
      excludeFields: []
    });
  }

  private setupCrossStoreReactions() {
    // Orchestrate Partner Store reactions
    this.reactionDisposers.push(
      reaction(
        () => this.partnersStore.createPartnerRequest,
        (request) => {
          request.case({
            fulfilled: (newPartner: Partner | null) => {
              if (newPartner) {
                this.uiStore.setSuccess('Partner created successfully');
              }
            },
            rejected: (error: any) => {
              this.uiStore.setError('Failed to create partner');
            }
          });
        }
      )
    );

    this.reactionDisposers.push(
      reaction(
        () => this.partnersStore.updatePartnerRequest,
        (request) => {
          request.case({
            fulfilled: (updatedPartner: Partner | null) => {
              if (updatedPartner) {
                this.uiStore.setSuccess('Partner updated successfully');
              }
            },
            rejected: (error: any) => {
              this.uiStore.setError('Failed to update partner');
            }
          });
        }
      )
    );

    this.reactionDisposers.push(
      reaction(
        () => this.partnersStore.invitePartnerRequest,
        (request) => {
          request.case({
            fulfilled: () => {
              this.uiStore.setSuccess('Partner invitation sent successfully');
            },
            rejected: (error: any) => {
              this.uiStore.setError('Failed to send partner invitation');
            }
          });
        }
      )
    );

    // Orchestrate Purchase Orders Store reactions
    this.reactionDisposers.push(
      reaction(
        () => this.purchaseOrdersStore.updatePurchaseOrderStatusRequest,
        (request) => {
          request.case({
            fulfilled: (updatedPurchaseOrder: PurchaseOrder | null) => {
              if (updatedPurchaseOrder) {
                this.uiStore.setSuccess('Purchase order status updated successfully');
              }
            },
            rejected: (error: any) => {
              this.uiStore.setError('Failed to update purchase order status');
            }
          });
        }
      )
    );
  }

  dispose() {
    // Clean up orchestration reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
    
    this.partnersStore.dispose();
    this.purchaseOrdersStore.dispose();
    this.uiStore.dispose();
    
    // Cleanup logger registrations
    storeLogger.unregister('PartnersStore');
    storeLogger.unregister('PurchaseOrdersStore');
    storeLogger.unregister('UiStore');
  }
}

export const rootStore = new RootStore();