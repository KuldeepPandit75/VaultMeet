import {createSlice} from '@reduxjs/toolkit'

const initialState={
    user:null
}

export const slice=createSlice({
    name:'VaultMeet',
    initialState,
    reducers:{
        setUser(state,action){
            state.user=action.payload
        }
    }
})

export const {setUser} = slice.actions;

export default slice.reducer