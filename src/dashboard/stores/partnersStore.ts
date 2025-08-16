import { makeAutoObservable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { orderBy } from 'lodash';
import { Partner, PartnerBase } from '../types';
import {
  queryPartners,
  createPartner,
  updatePartner,
  deletePartner
} from '../../backend/web-methods/partners.web';
// Remove import for missing errorPropagation module
import { AppError } from '../services/AppError/AppError';
import { ErrorCategory } from '../services/AppError/ErrorCategories';

export interface PartnerFilter {
  status?: string | null;
  keyword?: string | null;
}

export interface PartnerSorting {
  field: 'companyName' | 'status' | 'globalDiscountPercentage' | '_createdDate' | '_updatedDate';
  direction: 'asc' | 'desc';
}

// Optimistic operation type with methods for resolving/rejecting
// Methods have direct access to store via closures - no parameter passing needed
type OptimisticOperation = {
  operationId: string;
  resolve: (response: Partner) => void;
  reject: () => void;
}

/**
 * PartnersStore - Manages partner data with optional optimistic updates
 * 
 * Two operation modes:
 * 1. Regular operations: createPartner(), updatePartner(), deletePartner() - traditional flow with loading states
 * 2. Optimistic operations: createPartnerOptimistic(), updatePartnerOptimistic(), deletePartnerOptimistic() - immediate UI updates with rollback on failure
 */
export class PartnersStore {
  partners = new Map<string, Partner>();
  error: AppError | null = null;
  
  // Transaction log for optimistic updates rollback support
  // Key: operationId, Value: operation details
  private optimisticOperations = new Map<string, OptimisticOperation>();
  
  // Observable promises for reactive request states - initialized as resolved with empty arrays/objects
  loadPartnersRequest: IPromiseBasedObservable<Partner[]> = fromPromise.resolve([]);
  createPartnerRequest: IPromiseBasedObservable<Partner> = fromPromise.resolve({} as Partner);
  updatePartnerRequest: IPromiseBasedObservable<Partner> = fromPromise.resolve({} as Partner);
  deletePartnerRequest: IPromiseBasedObservable<Partner> = fromPromise.resolve({} as Partner);

  // Reaction disposers for cleanup
  private reactionDisposers: IReactionDisposer[] = [];

  constructor() {
    makeAutoObservable(this);
    this.setupReactions();
  }

  private setupReactions() {
    // Reaction for load partners requests
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.loadPartnersRequest.state, value: this.loadPartnersRequest.value }),
        () => {
          const request = this.loadPartnersRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: Partner[]) => {
              if (response) {
                runInAction(() => {
                  this.partners.clear();
                  response.forEach((partner: Partner) => {
                    this.partners.set(partner._id, partner);
                  });
                });
              }
            },
            rejected: (error: any) => {
              // Check if this is a serialized AppError from backend
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  // Fallback to wrapping if reconstruction fails
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to load partners',
                    technicalMessage: `Error loading partners: ${error?.message || 'Unknown error'}`,
                    source: 'PartnersStore.loadPartners',
                    layer: 'Store',
                    context: { operation: 'loadPartners' }
                  });
                }
              } else {
                // Wrap non-AppError instances as before
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to load partners',
                  technicalMessage: `Error loading partners: ${error?.message || 'Unknown error'}`,
                  source: 'PartnersStore.loadPartners',
                  layer: 'Store',
                  context: { operation: 'loadPartners' }
                });
              }
            }
          });
        }
      )
    );

    // Reaction for create partner requests with optimistic operation handling
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.createPartnerRequest.state, value: this.createPartnerRequest.value }),
        () => {
          const request = this.createPartnerRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: Partner & { operationId?: string }) => {
              if (response) {
                runInAction(() => {
                  if (response.operationId && this.optimisticOperations.has(response.operationId)) {
                    // Optimistic flow: delegate to self-managing operation
                    const operation = this.optimisticOperations.get(response.operationId)!;
                    operation.resolve(response);
                  } else {
                    // Non-optimistic flow: regular partner creation
                    this.partners.set(response._id, response);
                  }
                });
              }
            },
            rejected: (error: any) => {
              runInAction(() => {
                // Precise rollback: delegate to self-managing operation
                if (error.operationId && this.optimisticOperations.has(error.operationId)) {
                  const operation = this.optimisticOperations.get(error.operationId)!;
                  operation.reject();
                }
                // If no operationId in error, no optimistic operation to rollback
              });

              // Handle error as before
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to create partner',
                    technicalMessage: `Error creating partner: ${error?.message || 'Unknown error'}`,
                    source: 'PartnersStore.createPartner',
                    layer: 'Store',
                    context: { operation: 'createPartner' }
                  });
                }
              } else {
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to create partner',
                  technicalMessage: `Error creating partner: ${error?.message || 'Unknown error'}`,
                  source: 'PartnersStore.createPartner',
                  layer: 'Store',
                  context: { operation: 'createPartner' }
                });
              }
            }
          });
        }
      )
    );

    // Reaction for update partner requests with optimistic operation handling
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.updatePartnerRequest.state, value: this.updatePartnerRequest.value }),
        () => {
          const request = this.updatePartnerRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: Partner & { operationId?: string }) => {
              if (response) {
                runInAction(() => {
                  if (response.operationId && this.optimisticOperations.has(response.operationId)) {
                    // Optimistic flow: delegate to self-managing operation
                    const operation = this.optimisticOperations.get(response.operationId)!;
                    operation.resolve(response);
                  } else {
                    // Non-optimistic flow: regular partner update
                    this.partners.set(response._id, response);
                  }
                });
              }
            },
            rejected: (error: any) => {
              runInAction(() => {
                // Precise rollback: delegate to self-managing operation
                if (error.operationId && this.optimisticOperations.has(error.operationId)) {
                  const operation = this.optimisticOperations.get(error.operationId)!;
                  operation.reject();
                }
                // If no operationId in error, no optimistic operation to rollback
              });

              // Handle error as before
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to update partner',
                    technicalMessage: `Error updating partner: ${error?.message || 'Unknown error'}`,
                    source: 'PartnersStore.updatePartner',
                    layer: 'Store',
                    context: { operation: 'updatePartner' }
                  });
                }
              } else {
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to update partner',
                  technicalMessage: `Error updating partner: ${error?.message || 'Unknown error'}`,
                  source: 'PartnersStore.updatePartner',
                  layer: 'Store',
                  context: { operation: 'updatePartner' }
                });
              }
            }
          });
        }
      )
    );

    // Reaction for delete partner requests
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.deletePartnerRequest.state, value: this.deletePartnerRequest.value }),
        () => {
          const request = this.deletePartnerRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: Partner & { operationId?: string }) => {
              if (response) {
                runInAction(() => {
                  if (response.operationId && this.optimisticOperations.has(response.operationId)) {
                    // Optimistic flow: delegate to self-managing operation
                    const operation = this.optimisticOperations.get(response.operationId)!;
                    operation.resolve(response);
                  } else {
                    // Non-optimistic flow: regular partner deletion
                    this.partners.delete(response._id);
                  }
                });
              }
            },
            rejected: (error: any) => {
              runInAction(() => {
                // Precise rollback: delegate to self-managing operation
                if (error.operationId && this.optimisticOperations.has(error.operationId)) {
                  const operation = this.optimisticOperations.get(error.operationId)!;
                  operation.reject();
                }
                // If no operationId in error, no optimistic operation to rollback
              });

              // Check if this is a serialized AppError from backend
              if (error && typeof error === 'object' && error.isAppError) {
                try {
                  this.error = AppError.fromJSON(error);
                } catch (reconstructionError) {
                  // Fallback to wrapping if reconstruction fails
                  console.warn('Failed to reconstruct AppError from backend:', reconstructionError);
                  this.error = AppError.wrap(error, {
                    category: ErrorCategory.SERVER,
                    userMessage: 'Failed to delete partner',
                    technicalMessage: `Error deleting partner: ${error?.message || 'Unknown error'}`,
                    source: 'PartnersStore.deletePartner',
                    layer: 'Store',
                    context: { operation: 'deletePartner' }
                  });
                }
              } else {
                // Wrap non-AppError instances as before
                this.error = AppError.wrap(error, {
                  category: ErrorCategory.SERVER,
                  userMessage: 'Failed to delete partner',
                  technicalMessage: `Error deleting partner: ${error?.message || 'Unknown error'}`,
                  source: 'PartnersStore.deletePartner',
                  layer: 'Store',
                  context: { operation: 'deletePartner' }
                });
              }
            }
          });
        }
      )
    );

	// Reaction for error handling
    this.reactionDisposers.push(
      reaction(
        () => this.error,
        (reason) => reason?.log(),
      )
    );
  }

  loadPartners(): void {
    const promise = queryPartners();
    this.loadPartnersRequest = fromPromise(promise);
  }

  createPartner(partnerData: PartnerBase): void {
    const promise = createPartner(partnerData);
    this.createPartnerRequest = fromPromise(promise);
  }
  
  updatePartner(partnerToUpdate: Partner): void {
    const promise = updatePartner(partnerToUpdate);
    this.updatePartnerRequest = fromPromise(promise);
  }

  createPartnerOptimistic(partnerData: PartnerBase): void {
    // Create temporary ID for optimistic partner
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const optimisticPartner: Partner = {
      ...partnerData,
      _id: tempId,
      _createdDate: new Date(),
      _updatedDate: new Date()
    };
    
    // Create self-managing operation
    const operation = this.createOptimisticOperation(
      // Resolve: remove temp partner, add real partner
      (response) => {
        this.partners.delete(tempId);
        this.partners.set(response._id, response);
      },
      // Reject: remove temp partner
      () => {
        this.partners.delete(tempId);
      }
    );
    
    // Perform the optimistic create
    this.partners.set(tempId, optimisticPartner);
    
    // Make actual API call with operationId - reactions will handle success/failure
    const promise = createPartner(partnerData, operation.operationId);
    this.createPartnerRequest = fromPromise(promise);
  }

  updatePartnerOptimistic(partnerToUpdate: Partner): void {
    const partnerId = partnerToUpdate._id;
    const previousState = this.partners.get(partnerId);
    
    // Create self-managing operation
    const operation = this.createOptimisticOperation(
      // Resolve: update with server response
      (response) => {
        this.partners.set(response._id, response);
      },
      // Reject: restore previous state
      () => {
        this.partners.set(previousState!._id, previousState!);
      }
    );
    
    // Perform the optimistic update
    const optimisticPartner = { ...partnerToUpdate };
    this.partners.set(partnerId, optimisticPartner);
    
    // Make actual API call with operationId - reactions will handle success/failure
    const promise = updatePartner(partnerToUpdate, operation.operationId);
    this.updatePartnerRequest = fromPromise(promise);
  }

  deletePartner(id: string): void {
    const promise = deletePartner(id); // No operationId = non-optimistic
    this.deletePartnerRequest = fromPromise(promise);
  }

  // Optimistic partner deletion - immediate UI feedback with rollback on failure
  deletePartnerOptimistic(id: string): void {
    const partnerToDelete = this.partners.get(id);
    
    if (partnerToDelete) {
      // Create self-managing operation
      const operation = this.createOptimisticOperation(
        // Resolve: partner already deleted optimistically, nothing to do
        () => {
          // Nothing needed - partner already removed optimistically
        },
        // Reject: restore deleted partner
        () => {
          this.partners.set(partnerToDelete._id, partnerToDelete);
        }
      );
      
      // Perform the optimistic delete (remove from UI immediately)
      this.partners.delete(id);
      
      // Make actual API call with operationId - reactions will handle success/failure
      const promise = deletePartner(id, operation.operationId);
      this.deletePartnerRequest = fromPromise(promise);
    }
  }

  getPartnerById(id: string): Partner | undefined {
    return this.partners.get(id);
  }

  getFilteredPartners(filter: PartnerFilter = {}): Partner[] {
    return Array.from(this.partners.values()).filter(partner => {
      if (filter.status && filter.status.trim() !== '' && partner.status !== filter.status) {
        return false;
      }
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        return (
          partner._id.toLowerCase().includes(keyword) ||
          partner.companyName.toLowerCase().includes(keyword) ||
          partner.memberId.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }

  getFilteredSortedPartners(filter: PartnerFilter = {}, sorting: PartnerSorting): Partner[] {
    const filteredPartners = this.getFilteredPartners(filter);
    
    return orderBy(filteredPartners, [sorting.field], [sorting.direction]);
  }

  getPartnersCount(): number {
    return this.partners.size;
  }

  getFilteredPartnersCount(filter: PartnerFilter = {}): number {
    return this.getFilteredPartners(filter).length;
  }

  clearError(): void {
    this.error = null;
  }

  get partnersAsArray(): Partner[] {
    return Array.from(this.partners.values());
  }

  get isLoading(): boolean {
    return (this.loadPartnersRequest.state === 'pending') ||
           (this.createPartnerRequest.state === 'pending') ||
           (this.updatePartnerRequest.state === 'pending') ||
           (this.deletePartnerRequest.state === 'pending'); 
  }
  
  get isLoadingPartners(): boolean {
    return this.loadPartnersRequest.state === 'pending';
  }
  
  get isCreatingPartner(): boolean {
    return this.createPartnerRequest.state === 'pending';
  }
  
  get isUpdatingPartner(): boolean {
    return this.updatePartnerRequest.state === 'pending';
  }
  
  get isDeletingPartner(): boolean {
    return this.deletePartnerRequest.state === 'pending';
  }

  // Base method to create self-managing optimistic operations
  private createOptimisticOperation(
    onResolve: (response: Partner) => void,
    onReject: () => void
  ): OptimisticOperation {
    // Generate unique operation ID internally
    const operationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const operation: OptimisticOperation = {
      operationId,
      resolve: (response: Partner) => {
        runInAction(() => {
          onResolve(response);
          // Self-remove from operations list on resolve
          this.optimisticOperations.delete(operationId);
        });
      },
      reject: () => {
        runInAction(() => {
          onReject();
          // Self-remove from operations list on reject
          this.optimisticOperations.delete(operationId);
        });
      }
    };
    
    // Self-add to operations list on creation
    this.optimisticOperations.set(operationId, operation);
    
    return operation;
  }

  dispose() {
    // Clean up reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
  }
}