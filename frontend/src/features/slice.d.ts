// src/features/slice.d.ts

import { Action } from "@reduxjs/toolkit";

interface UserInfo {
  // Define your actual user structure if you know it
  [key: string]: any;
}

interface Notification {
  noti: string;
  notiType: string;
}

interface VaultMeetState {
  user: UserInfo | null;
  recMsg: any[]; // You can type messages more strictly if needed
  notifications: Notification[];
}

type SetUserAction = Action<"VaultMeet/setUser"> & {
  payload: UserInfo;
};

type SetNotificationAction = Action<"VaultMeet/setNotification"> & {
  payload: Notification;
};

type SetRecMsgReduxAction = Action<"VaultMeet/setRecMsgRedux"> & {
  payload: any;
};
