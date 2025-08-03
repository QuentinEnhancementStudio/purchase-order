import { makeAutoObservable } from 'mobx';
import { RootStore } from './rootStore';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export class UiStore {
  notifications: Notification[] = [];
  isModalOpen = false;
  modalType: string | null = null;
  modalData: any = null;
  isDrawerOpen = false;
  drawerContent: React.ReactNode | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setSuccess(message: string, duration = 5000) {
    this.addNotification({
      type: 'success',
      message,
      duration,
    });
  }

  setError(message: string, duration = 7000) {
    this.addNotification({
      type: 'error',
      message,
      duration,
    });
  }

  setWarning(message: string, duration = 6000) {
    this.addNotification({
      type: 'warning',
      message,
      duration,
    });
  }

  setInfo(message: string, duration = 4000) {
    this.addNotification({
      type: 'info',
      message,
      duration,
    });
  }

  private addNotification(notification: Omit<Notification, 'id'>) {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
    };

    this.notifications.push(newNotification);

    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clearNotifications() {
    this.notifications = [];
  }

  openModal(type: string, data?: any) {
    this.modalType = type;
    this.modalData = data;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalType = null;
    this.modalData = null;
  }

  openDrawer(content: React.ReactNode) {
    this.drawerContent = content;
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.drawerContent = null;
  }

  dispose() {
    this.clearNotifications();
  }
}