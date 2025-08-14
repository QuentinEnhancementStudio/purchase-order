import { makeAutoObservable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { Member } from '../../backend/entities/member';
import {
  queryMembers,
} from '../../backend/web-methods/members.web';
import { MemberFilter } from '../../backend/services/members';
import { AppError } from '../services/AppError/AppError';
import { ErrorCategory } from '../services/AppError/ErrorCategories';

export class MembersStore {
  members = new Map<string, Member>();
  error: AppError | null = null;
  
  // Observable promises for reactive request states - initialized as resolved with empty arrays/objects
  loadMembersRequest: IPromiseBasedObservable<Member[]> = fromPromise.resolve([]);

  // Reaction disposers for cleanup
  private reactionDisposers: IReactionDisposer[] = [];

  constructor() {
    makeAutoObservable(this);
    this.setupReactions();
  }

  private setupReactions() {
    // Reaction for load members requests
    this.reactionDisposers.push(
      reaction(
        () => ({ state: this.loadMembersRequest.state, value: this.loadMembersRequest.value }),
        () => {
          const request = this.loadMembersRequest;
          request.case({
            pending: () => {
              // Clear any previous errors when request starts
              this.error = null;
            },
            fulfilled: (response: Member[]) => {
              if (response) {
                runInAction(() => {
                  this.members.clear();
                  response.forEach((member: Member) => {
                    this.members.set(member._id, member);
                  });
                });
              }
            },
            rejected: (error: any) => {
              this.error = AppError.wrap(error, {
                category: ErrorCategory.SERVER,
                userMessage: 'Failed to load members',
                technicalMessage: `Error loading members: ${error?.message || 'Unknown error'}`,
                source: 'MembersStore.loadMembers',
                layer: 'Store',
                context: { operation: 'loadMembers' }
              });
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

  loadMembers(): void {
    const promise = queryMembers();
    this.loadMembersRequest = fromPromise(promise);
  }

  getMemberById(id: string): Member | undefined {
    return this.members.get(id);
  }

  getFilteredMembers(filter: MemberFilter = {}): Member[] {
    return Array.from(this.members.values()).filter(member => {
      if (filter.status && filter.status.length > 0 && !filter.status.includes(member.status)) {
        return false;
      }
      return true;
    });
  }

  searchMembersByEmail(email: string): Member[] {
    return Array.from(this.members.values()).filter(member => 
      member.loginEmail.toLowerCase().includes(email.toLowerCase())
    );
  }

  getMembersCount(): number {
    return this.members.size;
  }

  getFilteredMembersCount(filter: MemberFilter = {}): number {
    return this.getFilteredMembers(filter).length;
  }

  clearError(): void {
    this.error = null;
  }

  get membersAsArray(): Member[] {
    return Array.from(this.members.values());
  }

  get isLoading(): boolean {
    return (this.loadMembersRequest.state === 'pending');
  }
  
  get isLoadingMembers(): boolean {
    return this.loadMembersRequest.state === 'pending';
  }

  dispose() {
    // Clean up reactions
    this.reactionDisposers.forEach(disposer => disposer());
    this.reactionDisposers = [];
  }
}