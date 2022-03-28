import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { mainSlice } from './main'
import { mainMiddleware } from './main/middleware'

export const REDUX_STORE = configureStore({
  reducer: {
    main: mainSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([mainMiddleware]),
})

export type RootState = ReturnType<typeof REDUX_STORE.getState>
export type AppDispatch = typeof REDUX_STORE.dispatch

export const useRootDispatch = () => useDispatch<AppDispatch>()
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector
