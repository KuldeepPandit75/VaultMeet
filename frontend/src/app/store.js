import meetReducer from '../features/slice.js'
import { configureStore } from '@reduxjs/toolkit'

const store=configureStore({
    reducer: meetReducer,
})

export default store;