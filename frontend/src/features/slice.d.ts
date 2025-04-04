// vaultMeetSlice.d.ts

export interface Message {
  msg: string;
}

export interface VaultMeetState {
  user?: any;
  sentMsg: Message[];
  recMsg: any[];
  notifications?: any[];
}

export interface SetUserAction {
  payload: any;
}

export interface SetSentMsgReduxAction {
  payload: string;
}

export interface SetRecMsgReduxAction {
  payload: any;
}

export interface SetNotificationAction {
  payload: any;
}

export const setUser: (action: SetUserAction) => void;
export const setSentMsgRedux: (action: SetSentMsgReduxAction) => void;
export const setRecMsgRedux: (action: SetRecMsgReduxAction) => void;
export const setNotification: (action: SetNotificationAction) => void;

declare const reducer: (state: VaultMeetState | undefined, action: any) => VaultMeetState;
export default reducer;
