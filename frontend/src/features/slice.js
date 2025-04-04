import {createSlice} from '@reduxjs/toolkit'

const initialState={
    sentMsg:[],
    recMsg:[]
}

export const slice=createSlice({
    name:'VaultMeet',
    initialState,
    reducers:{
        setSentMsgRedux(state,action){
            state.sentMsg.push({msg:action.payload});
        },
        setRecMsgRedux(state,action){
            state.recMsg.push(action.payload);
        }
    }
})

export const {setSentMsgRedux,setRecMsgRedux} = slice.actions;

export default slice.reducer