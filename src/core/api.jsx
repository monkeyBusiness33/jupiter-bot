import appConfig from "../config/app.config";

const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 2);
const isoDateString = currentDate.toISOString();
const CurrentDateString = encodeURIComponent(isoDateString);
currentDate.setMonth(currentDate.getMonth() - 3);
const oneMonthBeforeDate = currentDate.toISOString();
const oneMonthBeforeDateString = encodeURIComponent(oneMonthBeforeDate);

const options = {
  headers: {
    Accept: "application/json",
    "x-api-key": appConfig.api_key,
  },
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getSolanaPools = async (page) => {
  try {
    const startTime = performance.now();
    const response = await fetch(
      `${appConfig.pool_Url}/${appConfig.chain}?sort=creationTime&order=desc&from=${oneMonthBeforeDateString}&to=${CurrentDateString}&page=${page}&pageSize=10`,
      options
    );
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const res = await response.json();
    const endTime = performance.now();
    const duration = endTime - startTime;
    const remainingTime = 1000 - duration;
    if (remainingTime > 0) {
      await delay(remainingTime);
    } else {
      await delay(1000 + remainingTime);
    }
    return res.data;
  } catch (err) {
    console.error(err);
  }
};

export const getSolanaMarketCap = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.token_Url}/${appConfig.chain}/${address}/info`,
      options
    );
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const res = await response.json();

    return res.data;
  } catch (err) {
    console.error(err);
  }
};

export const getPoolPrice = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.pool_Url}/${appConfig.chain}/${address}/price`,
      options
    );
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const res = await response.json();
    return res.data;
  } catch (err) {
    console.error(err);
  }
};

export const getPoolLiquidity = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.pool_Url}/${appConfig.chain}/${address}/liquidity`,
      options
    );
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const res = await response.json();
    return res.data;
  } catch (err) {
    console.error(err);
  }
};

export const getSolanaTokens = async () => {
  try {
    const response = await fetch(
      `${appConfig.token_Url}/${appConfig.chain}?sort=creationTime&order=desc&from=${oneMonthBeforeDateString}&to=${CurrentDateString}&page=40&pageSize=5`,
      options
    );

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
  }
};

export const getTokenPools = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.token_Url}/${appConfig.chain}/${address}/pools?sort=creationTime&order=desc&from=${oneMonthBeforeDateString}&to=${CurrentDateString}&page=0&pageSize=  `,
      options
    );

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

export const getTokenPrice = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.token_Url}/${appConfig.chain}/${address}/price`,
      options
    );

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const res = await response.json();
    return res.data;
  } catch (err) {
    console.log(err);
  }
};

export const getTokenAudit = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.token_Url}/${appConfig.chain}/${address}/audit`,
      options
    );

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const res = await response.json();
    return res.data;
  } catch (err) {
    console.log(err);
  }
};

export const getTokenScore = async (address) => {
  try {
    const response = await fetch(
      `${appConfig.token_Url}/${appConfig.chain}/${address}/score`,
      options
    );

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const data = await response.json();

    return data;
  } catch (err) {
    console.log(err);
  }
};
