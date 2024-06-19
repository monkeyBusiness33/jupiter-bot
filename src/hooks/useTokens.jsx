import React, { useState, useEffect } from "react";
import {
  getSolanaPools,
  getSolanaMarketCap,
  getPoolLiquidity,
  getTokenPrice,
  getTokenAudit,
} from "../core/api";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import {
  setTradingPairs,
  setTradingFlag,
  setTradingTempPairs,
} from "../redux/reducer/web3";
import { allTradePaires } from "../services";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMarketCap = async (address) => {
  const res = await getSolanaMarketCap(address);
  const token = await getTokenPrice(address);
  if (!res.mcap) {
    return Number(res.totalSupply) * Number(token.price);
  } else {
    return res.mcap;
  }
};

export const priceImpactFunc = (reserves, tradeSize) => {
  if (!reserves.mainToken || !reserves.sideToken) return null;
  const k = reserves.mainToken * reserves.sideToken;
  const marketPrice = reserves.sideToken / reserves.mainToken;
  const changedMainToken = k / (reserves.sideToken * (1 + tradeSize / 100));
  const reward = reserves.mainToken - changedMainToken;
  const paidPrice = (reserves.sideToken * tradeSize) / 100 / reward;
  const priceImpact = ((paidPrice - marketPrice) / marketPrice) * 100;
  return priceImpact;
};

const auditCalculate = (audit) => {
  let result = "";
  if (audit?.isHoneypot == "yes") result += "Honeypot, ";
  if (audit?.isPotentiallyScam == "yes") result += "PotentiallyScam, ";
  if (audit?.isMintable == "yes") result += "Mintable, ";
  if (audit?.isProxy == "yes") result += "Proxy, ";
  if (audit?.isBlacklisted == "yes") result += "Blacklisted, ";
  if (audit?.isContractRenounced == "yes") result += "Renounced, ";
  return result;
};

const asyncPoolWithRateLimit = async (
  poolLimit,
  rateLimit,
  array,
  iteratorFn
) => {
  const ret = [];
  const executing = [];
  let idx = 0;

  const executeNext = async () => {
    if (idx === array.length) return;
    const item = array[idx++];
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (executing.length >= poolLimit) {
      await Promise.race(executing);
    }

    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);

    if (executing.length >= poolLimit) {
      await new Promise((resolve) => setTimeout(resolve, rateLimit));
    }

    await executeNext();
  };

  // Start executing with initial concurrency
  while (executing.length < poolLimit && idx < array.length) {
    executing.push(executeNext());
    await new Promise((resolve) => setTimeout(resolve, rateLimit));
  }

  await Promise.all(executing);
  return Promise.all(ret);
};

export const useGetTokens = () => {
  const dispatch = useDispatch();
  //  allTradeTokenPairs();
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const pairs = await allTradePaires();
      try {
        let page = 0;
        let totalPages = 0;
        const allResults = [];
        // Fetch the initial page to get the total number of pages
        const initialResponse = await getSolanaPools(page);
        if (isMounted && initialResponse && initialResponse.totalPages) {
          totalPages = initialResponse.totalPages;
          for (page = 0; page < totalPages; page++) {
            console.log("Fetching page:", page);
            const response = await getSolanaPools(page);

            if (isMounted && response.results) {
              const startTime = performance.now();

              const poolArrayData = await asyncPoolWithRateLimit(
                2,
                300,
                response.results,
                async (item) => {
                  const pool = await getPoolLiquidity(item.address);
                  // const marketcap = await getMarketCap(item.mainToken.address);
                  const resMarket = await getSolanaMarketCap(
                    item.mainToken.address
                  );
                  const token = await getTokenPrice(item.mainToken.address);
                  const marketcap = resMarket.mcap
                    ? resMarket.mcap
                    : Number(resMarket.totalSupply) * Number(token.price);
                  const audit = await getTokenAudit(item.mainToken.address);
                  let openPosition = "";
                  let openRole = "";
                  const matchingPair = pairs.find(
                    (pair) => pair.address === item.mainToken.address
                  );
                  if (matchingPair) {
                    openPosition = matchingPair.openPosition;
                    openRole = matchingPair.openRole;
                  }
                  return {
                    id: uuidv4(),
                    address: item.address,
                    contractAddress: item.mainToken.address,
                    symbol: item.mainToken.symbol,
                    name: item.mainToken.name,
                    liquidity: pool.liquidity ? pool.liquidity : "---",
                    marketCap: marketcap ? marketcap : "---",
                    pool: pool.reserves.sideToken
                      ? pool.reserves.sideToken
                      : "---",
                    tradeSize: 0.1,
                    flag: false,
                    reserves: pool?.reserves,
                    priceImpact: priceImpactFunc(pool?.reserves, 0.1)
                      ? priceImpactFunc(pool?.reserves, 0.1)
                      : null,
                    redFlag: auditCalculate(audit),
                    openPosition: openPosition,
                    openRole: openRole,
                  };
                }
              );
              const endTime = performance.now();
              const duration = endTime - startTime;
              console.log("duration", duration);
              allResults.push(...poolArrayData);
              dispatch(setTradingTempPairs(allResults));
            }
          }
          if (isMounted) {
            // const pairs = await allTradePaires();
            // dispatch(setTradingPairs(pairs));
            dispatch(setTradingFlag(true));
          }
        }
      } catch (error) {
        console.log("Error fetching tokens:", error);
        if (isMounted) {
          dispatch(setTradingPairs([]));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);
};

export const useTradingPairs = () => {
  const data = useSelector((state) => state.solanaToken.tradingPairs);
  const flag = useSelector((state) => state.solanaToken.tradeFlag);
  //------------filter variable----------------
  const liquidity = useSelector((state) => state.solanaToken.liquidityFilter);
  const marketCap = useSelector((state) => state.solanaToken.marketCapFilter);
  const [poolArray, setPoolArray] = useState([]);

  useEffect(() => {
    let filteredData = data;
    //--------------------------------Filter----------------------
    if (liquidity.min && liquidity.max && !marketCap.min && !marketCap.max) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.liquidity) <= parseFloat(liquidity.max)
      );
      setPoolArray(filteredData);
    } else if (
      marketCap.min &&
      marketCap.max &&
      !liquidity.min &&
      !liquidity.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.marketCap) >= parseFloat(marketCap.min) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      liquidity.max &&
      marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.liquidity) <= parseFloat(liquidity.max) &&
          parseFloat(data.marketCap) >= parseFloat(marketCap.min) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );

      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      !liquidity.max &&
      !marketCap.min &&
      !marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) => parseFloat(data.liquidity) >= parseFloat(liquidity.min)
      );
      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      !liquidity.max &&
      marketCap.min &&
      !marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.marketCap) >= parseFloat(marketCap.min)
      );
      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      !liquidity.max &&
      marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.marketCap) >= parseFloat(marketCap.min) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else if (
      !liquidity.min &&
      liquidity.max &&
      !marketCap.min &&
      !marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) => parseFloat(data.liquidity) <= parseFloat(liquidity.max)
      );
      setPoolArray(filteredData);
    } else if (
      !liquidity.min &&
      liquidity.max &&
      marketCap.min &&
      !marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) <= parseFloat(liquidity.max) &&
          parseFloat(data.marketCap) >= parseFloat(marketCap.min)
      );
      setPoolArray(filteredData);
    } else if (
      !liquidity.min &&
      liquidity.max &&
      marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) <= parseFloat(liquidity.max) &&
          parseFloat(data.marketCap) >= parseFloat(marketCap.min) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else if (
      !liquidity.min &&
      !liquidity.max &&
      marketCap.min &&
      !marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) => parseFloat(data.marketCap) >= parseFloat(marketCap.min)
      );
      setPoolArray(filteredData);
    } else if (
      !liquidity.min &&
      !liquidity.max &&
      !marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) => parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      liquidity.max &&
      marketCap.min &&
      !marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.liquidity) <= parseFloat(liquidity.max) &&
          parseFloat(data.marketCap) >= parseFloat(marketCap.min)
      );
      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      !liquidity.max &&
      !marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else if (
      !liquidity.min &&
      liquidity.max &&
      !marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) <= parseFloat(liquidity.max) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else if (
      liquidity.min &&
      liquidity.max &&
      !marketCap.min &&
      marketCap.max
    ) {
      filteredData = filteredData.filter(
        (data) =>
          parseFloat(data.liquidity) >= parseFloat(liquidity.min) &&
          parseFloat(data.liquidity) <= parseFloat(liquidity.max) &&
          parseFloat(data.marketCap) <= parseFloat(marketCap.max)
      );
      setPoolArray(filteredData);
    } else {
      setPoolArray(filteredData);
    }
  }, [data, flag, liquidity, marketCap]);

  return poolArray;
};
