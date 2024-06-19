import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    connected: false,
    publicKey: '',
    privateKey:''
}

const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        setConnected(state, action) {
            state.connected = action.payload
        },
        setWalletAddress(state, action) {
            // state.privateKey = action.payload.privateKey;
            state.publicKey = action.payload.publicKey
        },
    }
})

export const {
    setConnected,
    setWalletAddress,
} = walletSlice.actions

export default walletSlice.reducer
