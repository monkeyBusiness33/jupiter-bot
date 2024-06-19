import { useEffect, useState } from "react";
import { WalletConfig } from "./config";
import { useDispatch, useSelector } from "react-redux";
import { setFilterPairs, setTradeParameter, updateAllTradeSize } from "../redux/reducer/web3";
import { useGetBalance } from "../hooks/useWallet";

export const Header = () => {
  const dispatch = useDispatch();

  const connected = useSelector((state) => state.walletInfo.connected);
  const publicKey = useSelector((state) => state.walletInfo.publicKey);
  const balance = useGetBalance();
  const [modal, setModal] = useState(false);
  const [botParameters, setBotParameters] = useState({});
  const [liquidity, setLiquidity] = useState({});
  const [marketCap, setMarketCap] = useState({});
  const [tradeSize, setTradeSize] = useState();

  const handleParameter = (e) => {
    const { name, value } = e.target;
    setBotParameters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const tradeSizeEvent = (e) => {
    setTradeSize(e.target.value);
    dispatch(updateAllTradeSize(e.target.value));
  }
  useEffect(() => {
    dispatch(setTradeParameter(botParameters));
  }, [botParameters]);

  const handleLiquidityChange = (e) => {
    const { name, value } = e.target;
    setLiquidity((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleMarketCapChange = (e) => {
    const { name, value } = e.target;
    setMarketCap((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const setRefresh = () => {
    dispatch(setFilterPairs({ liquidity, marketCap }));
  };

  const accountInfo = (
    <>
      <div className="grid grid-cols-2 gap-3 items-center">
        <span className="text-xs sm:text-sm font-bold text-white">
          Connected Account
        </span>
        <input
          className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
          type="text"
          value={publicKey}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 items-center">
        <span className="text-xs sm:text-sm font-bold text-white">
          SOL Balance
        </span>
        <input
          className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
          type="text"
          value={balance?balance:0}
        />
      </div>
    </>
  );
  const connectButton = (
    <>
      <button
        onClick={() => setModal(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-md border-none focus:outline-none"
      >
        Connect Wallet
      </button>
    </>
  );

  return (
    <div className="header flex flex-col sm:flex-row justify-between items-center p-4 w-full gap-2">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex flex-row items-center gap-2">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex flex-row justify-between items-center w-full">
              <span className="text-xs sm:text-sm font-bold text-white">
                Liquidity (USD)
              </span>
              <div className="grid grid-cols-2 gap-2 items-center">
                <input
                  className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
                  type="text"
                  name="min"
                  value={liquidity.min}
                  onChange={handleLiquidityChange}
                  placeholder="1,500.00"
                />
                <input
                  className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
                  type="text"
                  name="max"
                  value={liquidity.max}
                  onChange={handleLiquidityChange}
                  placeholder="1,500.00"
                />
              </div>
            </div>
            <div className="flex flex-row justify-between items-center w-full gap-1">
              <span className="text-xs sm:text-sm font-bold text-white">
                Market Cap (USD)
              </span>
              <div className="grid grid-cols-2 gap-2 items-center">
                <input
                  value={marketCap.min}
                  className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
                  type="text"
                  name="min"
                  onChange={handleMarketCapChange}
                  placeholder="1000"
                />
                <input
                  value={marketCap.max}
                  className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
                  type="text"
                  name="max"
                  onChange={handleMarketCapChange}
                  placeholder="1000"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => setRefresh()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-md border-none focus:outline-none"
          >
            Refresh
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="grid grid-cols-2 gap-3 items-center">
            <span className="text-xs sm:text-sm font-bold text-white">
              Slippage (%)
            </span>
            <input
              className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
              type="text"
              name="slippage"
              placeholder="1.5 %"
              onChange={handleParameter}
              value={botParameters.slippage}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <span className="text-xs sm:text-sm font-bold text-white">
              Priority Cost (SOL)
            </span>
            <input
              className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
              type="text"
              placeholder="100.00"
              name="priority_cost"
              onChange={handleParameter}
              value={botParameters.priority_cost}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="grid grid-cols-2 gap-3 items-center">
            <span className="text-xs sm:text-sm font-bold text-white">
              Trade Size:Pooled SOL (%)
            </span>
            <input
              className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
              type="text"
              name="tradeSize"
              placeholder="1.5 %"
              value={tradeSize}
              onChange={tradeSizeEvent}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <span className="text-xs sm:text-sm font-bold text-white">
              Add Trades (SOL)
            </span>
            <input
              className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
              type="text"
              name="addTrade"
              placeholder="100.00"
              onChange={handleParameter}
              value={botParameters.addTrade}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <span className="text-xs sm:text-sm font-bold text-white">
              Profit Minimum (%)
            </span>
            <input
              className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-24 text-white bg-gray-900"
              type="text"
              name="profitMin"
              placeholder="20"
              onChange={handleParameter}
              value={botParameters.profitMin}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          {connected ? accountInfo : connectButton}
        </div>
      </div>
      <WalletConfig modal={modal} setModal={setModal} />
    </div>
  );
};
