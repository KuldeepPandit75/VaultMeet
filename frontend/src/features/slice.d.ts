export interface SentMsg {
    msg: string;
  }
  
  export interface VaultMeetState {
    sentMsg: SentMsg[];
    recMsg: string[];
    notifications: string[];
    user: string | null;
  }
  
  // Action types
  export interface SetSentMsgReduxAction {
    type: string;
    payload: string;
    [key: string]: any; 
  }
  
  export interface SetRecMsgReduxAction {
    type: string;
    payload: string;
    [key: string]: any; 
  }
  export interface SetUserAction {
    type: string;
    payload: any;
    [key: string]: any; 
  }
  export interface SetNotificationAction {
    type: string;
    payload: any;
    [key: string]: any; 
  }
  
  export const setUser: (user: any) => SetUserAction;
  export const setRecMsgRedux: (msg: string) => SetRecMsgReduxAction;
  export const setNotification: (notification: any) => SetNotificationAction;
  
  export const reducer: any;
  