import * as web3 from "@solana/web3.js";
import { Connection } from '@solana/web3.js';
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import appConfig from "../config/app.config";

export const useGetBalance = () => {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.solanaToken.tradingPairs);
  const connected = useSelector((state) => state.walletInfo.connected);
  const publicKey = useSelector((state) => state.walletInfo.publicKey);
  const [balance, setBalance] = useState();
  useEffect(() => {
    const connection = new Connection(appConfig.RPC_URL, "confirmed");

    if (publicKey){
      connection.getBalance(new web3.PublicKey(publicKey)).then((res) =>{
        setBalance(res/web3.LAMPORTS_PER_SOL)});
    }
  }, [connected, publicKey, dispatch,data]);

  return balance;
};
