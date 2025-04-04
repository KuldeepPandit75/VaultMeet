declare module './slice.js';
export interface SentMsg {
    msg: string;
  }
  
  export interface VaultMeetState {
    sentMsg: SentMsg[];
    recMsg: string[];
    notifications: string[];
    user: string[];
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
  