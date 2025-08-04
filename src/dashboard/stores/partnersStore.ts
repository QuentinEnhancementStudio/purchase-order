import { makeAutoObservable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { Partner } from '../types';
import {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  invitePartner,
  updatePartnerStatus
} from '../../backend/web-methods/partners.web';

interface PartnerFilter {
  status?: string | null;
  companyName?: string | null;
}

export class PartnersStore {
  partners = new Map<string, Partner>();
  error: string | null = null;
  
  // Observable promises for reactive request states - initialized as resolved with empty arrays/objects
  loadPartnersRequest: IPromiseBasedObservable<Partner[]> = fromPromise.resolve([]);
  createPartnerRequest: IPromiseBasedObservable<Partner> = fromPromise.resolve({} as Partner);
  updatePartnerRequest: IPromiseBasedObservable<Partner> = fromPromise.resolve({} as Partner);
  invitePartnerRequest: IPromiseBasedObservable<void> = fromPromise.resolve(undefined);
  
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
        () => this.loadPartnersRequest,
        (request) => {
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
              console.error('Error loading partners:', error);
              this.error = 'Failed to load partners';
            }
          });
        }
      )
    );

    // Reaction for create partner requests
    this.reactionDisposers.push(
      reaction(
        () => this.createPartnerRequest,
        (request) => {
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
              console.error('Error creating partner:', error);
              this.error = 'Failed to create partner';
            }
          });
        }
      )
    );

    // Reaction for update partner requests
    this.reactionDisposers.push(
      reaction(
        () => this.updatePartnerRequest,
        (request) => {
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
              console.error('Error updating partner:', error);
              this.error = 'Failed to update partner';
            }
          });
        }
      )
    );

    // Reaction for invite partner requests
    this.reactionDisposers.push(
      reaction(
        () => this.invitePartnerRequest,
        (request) => {
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: () => {
            },
            rejected: (error: any) => {
              console.error('Error inviting partner:', error);
              this.error = 'Failed to send partner invitation';
            }
          });
        }
      )
    );
  }

  loadPartners(): void {
    const promise = getPartners();
    this.loadPartnersRequest = fromPromise(promise);
  }

  createPartner(partnerData: Omit<Partner, '_id' | '_createdDate' | '_updatedDate' | '_owner'>): void {
    const promise = createPartner(partnerData);
    this.createPartnerRequest = fromPromise(promise);
  }

  updatePartner(id: string, updates: Partial<Partner>): void {
    const partnerToUpdate = { _id: id, ...updates };
    const promise = updatePartner(partnerToUpdate);
    this.updatePartnerRequest = fromPromise(promise);
  }

  invitePartner(email: string, companyName: string): void {
    const promise = invitePartner(email, companyName);
    this.invitePartnerRequest = fromPromise(promise);
  }

  updatePartnerStatus(id: string, status: Partner['status']): void {
    const promise = updatePartnerStatus(id, status);
    this.updatePartnerRequest = fromPromise(promise);
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

  getPartnersByStatus(status: string): Partner[] {
    return this.getFilteredPartners({ status });
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

  get partnersAsArray(): Partner[] {
    return Array.from(this.partners.values());
  }

  get isLoading(): boolean {
    return (this.loadPartnersRequest.state === 'pending') ||
           (this.createPartnerRequest.state === 'pending') ||
           (this.updatePartnerRequest.state === 'pending') ||
           (this.invitePartnerRequest.state === 'pending');
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
  
  get isInvitingPartner(): boolean {
    return this.invitePartnerRequest.state === 'pending';
  }


  dispose() {
    // Clean up reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
  }
}