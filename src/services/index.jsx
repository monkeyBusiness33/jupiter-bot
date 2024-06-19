import axios from "axios";
import appConfig from "../config/app.config";

const API = axios.create({ baseURL: appConfig.apiUrl });

export const testFunc = async (body) => {
  try {
    const response = await API.post("/test", body);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const importKey = async (body) => {
  try {
    const response = await API.post("/import-wallet", body);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const getWalletInfo = async (body) => {
  try {
    const response = await API.post("/wallet-info", body);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const swap = async (body) => {
  try {
    const res = await API.post("/swap", body);
    return res.data;
  } catch (error) {
    console.error("Error in swap function:", error);
    return "error"; // or handle the error accordingly
  }
};

export const multiSwap = async (body, tradeParam, publicKey) => {
  try {
    const results = await Promise.all(
      body.map(async (obj) => {
        try {
          const trade = Math.floor((obj.pool *(obj.tradeSize / 100)) * 100) / 100
          return await swap({
            slippage : tradeParam.slippage,
            priority_cost:tradeParam.priority_cost,
            address: obj.contractAddress,
            addTrade: trade.toString(),
            publicKey:publicKey,
            profitMin:obj.profitMin

          });
        } catch (error) {
          console.log("Error in swap operation:", error);
          return {address: obj.contractAddress, status : false};
        }
      })    
    );
    return results;
  } catch (error) {
    console.log("Error in multiSwap function:", error);
    throw error;
  }
};
export const closeAllSwap = async () => {
  try {
    const res = await API.get("/closeAllswap");
    return res.data;
  } catch (error) {
    console.log("Error in swap function:", error);
    return error.updatedPositions;
  }
};
export const closeSwap = async (body) => {
  try {
    const res = await API.post("/closeswap", body);
    return res.data;
  } catch (error) {
    console.log("Error in swap function:", error);
    return "error"; // or handle the error accordingly
  }
};
// export const allTradeTokenPairs = async () => {
//   try {
//     const response = await API.get("/allTradeTokenPairs");
//     return response.data;
//   } catch (error) {
//     console.error(error);
//   }
// };
export const allTradePaires = async () => {
  try {
    const response = await API.get("/allTradePairs");
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
