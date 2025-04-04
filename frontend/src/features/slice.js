import {createSlice} from '@reduxjs/toolkit'

const initialState={
    sentMsg:[],
    recMsg:[]
}

export const slice=createSlice({
    name:'VaultMeet',
    initialState,
    reducers:{
        setUser(state,action){
            state.user=action.payload;
        },
        setSentMsgRedux(state,action){
            state.sentMsg.push({msg:action.payload});
        },
        setRecMsgRedux(state,action){
            state.recMsg.push(action.payload);
        },
        setNotification(state,action){
            state.notifications.push(action.payload);
        }
    }
})

export const {setSentMsgRedux,setRecMsgRedux, setUser, setNotification} = slice.actions;

export default slice.reducer