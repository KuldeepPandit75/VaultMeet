import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  msg: string;
}

interface VaultMeetState {
  sentMsg: Message[];
  recMsg: string[];
}

const initialState: VaultMeetState = {
  sentMsg: [],
  recMsg: [],
};

export const slice = createSlice({
  name: 'VaultMeet',
  initialState,
  reducers: {
    setSentMsgRedux(state, action: PayloadAction<string>) {
      state.sentMsg.push({ msg: action.payload });
    },
    setRecMsgRedux(state, action: PayloadAction<string>) {
      state.recMsg.push(action.payload);
    },
  },
});

export const { setSentMsgRedux, setRecMsgRedux } = slice.actions;

export default slice.reducer;
