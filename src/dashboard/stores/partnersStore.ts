import { makeAutoObservable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { Partner } from '../types';
import {
  queryPartners,
  createPartner,
  updatePartner,
  deletePartner
} from '../../backend/web-methods/partners.web';
// Remove import for missing errorPropagation module
import { AppError } from '../services/AppError/AppError';
import { ErrorCategory } from '../services/AppError/ErrorCategories';

interface PartnerFilter {
  status?: string | null;
  companyName?: string | null;
}

export class PartnersStore {
  partners = new Map<string, Partner>();
  error: AppError | null = null;
  
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

    // Reaction for create partner requests
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
            fulfilled: (response: Partner) => {
              if (response) {
                runInAction(() => {
                  this.partners.set(response._id, response);
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
                    userMessage: 'Failed to create partner',
                    technicalMessage: `Error creating partner: ${error?.message || 'Unknown error'}`,
                    source: 'PartnersStore.createPartner',
                    layer: 'Store',
                    context: { operation: 'createPartner' }
                  });
                }
              } else {
                // Wrap non-AppError instances as before
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

    // Reaction for update partner requests
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
            fulfilled: (response: Partner) => {
              if (response) {
                runInAction(() => {
                  this.partners.set(response._id, response);
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
                    userMessage: 'Failed to update partner',
                    technicalMessage: `Error updating partner: ${error?.message || 'Unknown error'}`,
                    source: 'PartnersStore.updatePartner',
                    layer: 'Store',
                    context: { operation: 'updatePartner' }
                  });
                }
              } else {
                // Wrap non-AppError instances as before
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
            fulfilled: (deletedPartner: Partner) => {
              if (deletedPartner) {
                runInAction(() => {
                  this.partners.delete(deletedPartner._id);
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

  createPartner(partnerData: Omit<Partner, '_id' | '_createdDate' | '_updatedDate' | '_owner'>): void {
    const promise = createPartner(partnerData);
    this.createPartnerRequest = fromPromise(promise);
  }

  updatePartner(partnerToUpdate: Partner): void {
    const promise = updatePartner(partnerToUpdate);
    this.updatePartnerRequest = fromPromise(promise);
  }


  deletePartner(id: string): void {
    const promise = deletePartner(id);
    this.deletePartnerRequest = fromPromise(promise);
  }

  getPartnerById(id: string): Partner | undefined {
    return this.partners.get(id);
  }

  getFilteredPartners(filter: PartnerFilter = {}): Partner[] {
    return Array.from(this.partners.values()).filter(partner => {
      if (filter.status && partner.status !== filter.status) {
        return false;
      }
      if (filter.companyName && !partner.companyName.toLowerCase().includes(filter.companyName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  getActivePartners(): Partner[] {
    return this.getFilteredPartners({ status: 'active' });
  }

  searchPartnersByCompany(companyName: string): Partner[] {
    return this.getFilteredPartners({ companyName });
  }

  getPartnersCount(): number {
    return this.partners.size;
  }

  getFilteredPartnersCount(filter: PartnerFilter = {}): number {
    return this.getFilteredPartners(filter).length;
  }

  getActivePartnersCount(): number {
    return this.getActivePartners().length;
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

  dispose() {
    // Clean up reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
  }
}