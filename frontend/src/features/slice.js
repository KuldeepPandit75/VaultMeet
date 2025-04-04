import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    recMsg: [],
    user: null,
    notifications: []
}

export const slice = createSlice({
    name: 'VaultMeet',
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
        },
        setRecMsgRedux(state, action) {
            state.recMsg.push(action.payload);
        },
        setNotification(state, action) {
            state.notifications.push(action.payload);
        }
    }
})

export const { setUser, setRecMsgRedux, setNotification } = slice.actions;

export default slice.reducer