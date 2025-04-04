export interface NotificationMessage {
    title: string;
    message: string;
  }
  
  export interface ApiNotificationMessages {
    loading: NotificationMessage;
    success: NotificationMessage;
    responseFailure: NotificationMessage;
    requestFailure: NotificationMessage;
    networkError: NotificationMessage;
  }
  
  export interface ServiceCallConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: boolean;
    query?: boolean;
  }
  
  export interface ServiceCalls {
    [key: string]: ServiceCallConfig;
  }
  
  export const API_NOTIFICATION_MESSAGES: ApiNotificationMessages;
  
  export const SERVICE_CALLS: ServiceCalls;
  