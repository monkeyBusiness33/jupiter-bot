import { createSlice } from "@reduxjs/toolkit";
import { priceImpactFunc } from "../../hooks/useTokens";
const initialState = {
  tradingPairs: [],
  tradingPoolPairs: [],
  selectedTradingPair: "",
  tradeFlag: false,
  liquidityFilter: {},
  marketCapFilter: {},
  tradeParameter: {},
};

const web3Slice = createSlice({
  name: "web3",
  initialState,
  reducers: {
    trigerFlag(state, action) {
      const { contractAddress, flag } = action.payload;
      state.tradingPairs = state.tradingPairs.map((obj) => {
        if (obj.contractAddress === contractAddress) {
          return {
            ...obj,
            flag: flag
          };
        }
        return obj;
      });
    },
    setTradingPairs(state, action) {
      const pairs = action.payload;
      pairs.forEach((pair) => {
        const item = state.tradingPairs.find(item => item.contractAddress === pair.address);
        if (item) {
          item.openPosition = pair.openPosition;
          item.openRole = pair.openRole;
        }
      });
    },
    setTradingTempPairs(state, action) {
      // Create a map for quick lookup of existing trading pairs
      const existingPairsMap = new Map(state.tradingPairs.map(pair => [pair.id, pair]));
    
      // Add/update items from action.payload in the map
      action.payload.forEach(item => {
        if (!existingPairsMap.has(item.id)) {
          existingPairsMap.set(item.id, { ...item });
        }
      });

      // Convert the map back to an array
      state.tradingPairs = Array.from(existingPairsMap.values());
    },
    setTradingPoolPairs(state, action) {
      state.tradingPoolPairs = action.payload;
    },
    setSelectedTradingPair(state, action) {
      state.selectedTradingPair = action.payload;
    },
    setTradingFlag(state, action) {
      state.tradeFlag = action.payload;
    },
    setFilterPairs(state, action) {
      state.liquidityFilter = action.payload.liquidity;
      state.marketCapFilter = action.payload.marketCap;
    },
    updateTradeSize(state, action) {
      const { id, value } = action.payload;
      const index = state.tradingPairs.findIndex((obj) => obj.id === id);
      if (index !== -1) {
        state.tradingPairs[index].tradeSize = value;
        state.tradingPairs[index].priceImpact = priceImpactFunc(
          state.tradingPairs[index].reserves,
          value
        );
      }
    },
    updateAllTradeSize(state, action) {
      const size = action.payload;
      state.tradingPairs = state.tradingPairs.map((obj) => ({
        ...obj,
        tradeSize: size,
      }));
    },
    updateProfit(state, action) {
      const { id, value } = action.payload;
      const index = state.tradingPairs.findIndex((obj) => obj.id === id);
      if (index !== -1) {
        state.tradingPairs[index].profitMin = value;
      }
    },
    closePosition(state, action) {
      const { address } = action.payload;
      const index = state.tradingPairs.findIndex(
        (obj) => obj.address === address
      );
      if (index !== -1) {
        state.tradingPairs[index].openRole = false;
      }
    },
    saveSellInfo(state, action) {
      const { address, sellPrice, openPosition, openRole } = action.payload;
      const index = state.tradingPairs.findIndex(
        (obj) => obj.contractAddress === address
      );
      if (index !== -1) {
        state.tradingPairs[index].sellPrice = sellPrice;
        state.tradingPairs[index].openPosition = openPosition;
        state.tradingPairs[index].openRole = openRole;
      }
    },
    setTradeParameter(state, action) {
      state.tradeParameter = action.payload;
    },
  },
});

export const {
  setTradingPairs,
  setTradingTempPairs,
  updateTradeSize,
  closePosition,
  trigerFlag,
  updateProfit,
  saveSellInfo,
  updateAllTradeSize,
  setTradeParameter,
  setSelectedTradingPair,
  setTradingPoolPairs,
  setTradingFlag,
  setFilterPairs,
} = web3Slice.actions;

export default web3Slice.reducer;
