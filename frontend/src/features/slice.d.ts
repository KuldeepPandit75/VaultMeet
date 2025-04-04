export interface SentMsg {
    msg: string;
  }
  
  export interface VaultMeetState {
    sentMsg: SentMsg[];
    recMsg: string[];
    notifications: string[];
    user: string;
  }
  
  // Action types
  export interface SetSentMsgReduxAction {
    type: string;
    payload: string;
  }
  
  export interface SetRecMsgReduxAction {
    type: string;
    payload: string;
  }
  export interface SetUserAction {
    type: string;
    payload: string;
  }
  export interface SetNotificationAction {
    type: string;
    payload: string;
  }
  
  // Export the action creators
  export const setUser: (user: any) => SetUserAction;
  export const setRecMsgRedux: (msg: string) => SetRecMsgReduxAction;
  export const setNotification: (notification: any) => SetNotificationAction;
  
  // Export the reducer
  export const reducer: any;
  