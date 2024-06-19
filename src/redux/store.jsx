import { configureStore } from "@reduxjs/toolkit";

import notificationReducer from "../redux/reducer/notification";
import web3Reducer from "./reducer/web3";
import walletReducer from "./reducer/wallet";

const reducer = {
  notification: notificationReducer,
  solanaToken:web3Reducer,
  walletInfo : walletReducer
};

const preloadedState = {
  notification: {
    show: false,
  },
};

export const store = configureStore({
  reducer,
  preloadedState,
});
