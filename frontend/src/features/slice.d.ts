declare module "../../features/slice.js" {
  import { AnyAction } from "redux";

  export const setUser: (user: any) => AnyAction;
  export const setNotification: (notification: any) => AnyAction;
  export const setRecMsgRedux: (msg: any) => AnyAction;
}
