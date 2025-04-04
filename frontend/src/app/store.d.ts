import { Store } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import meetReducer from '../features/slice';

declare const store: ReturnType<typeof configureStore>;

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;

export default store;
