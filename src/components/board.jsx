import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import DataTable, { createTheme } from "react-data-table-component";
import { useTradingPairs } from "../hooks/useTokens";
import {
  updateTradeSize,
  updateProfit,
  saveSellInfo,
  trigerFlag,
  closePosition,
} from "../redux/reducer/web3";
import { multiSwap, swap, closeSwap, closeAllSwap } from "../services";
import { show } from "../redux/reducer/notification";

export const Board = () => {
  const dispatch = useDispatch();
  const tradeParameters = useSelector(
    (state) => state.solanaToken.tradeParameter
  );
  const publicKey = useSelector((state) => state.walletInfo.publicKey);
  const tradePairs = useTradingPairs();
  const [dataArray, SetDataArray] = useState();
  const [pending, setPending] = useState(true);
  const [selectedData, setSelectedData] = useState();
  const [tradeSizeValues, setTradeSizeValues] = useState(0.1);
  const [profitMin, setProfitMin] = useState(10);
  const [closeAll, setCloseAll] = useState(false);

  const copyToClipboard = (address) => {
    navigator.clipboard.writeText(address).then(
      () => {
        alert(`Copied: ${address}`);
      },
      (err) => {
        console.error("Failed to copy: ", err);
      }
    );
  };

  useEffect(() => {
    SetDataArray(tradePairs);
    if (tradePairs.length > 0) {
      setPending(false);
    }
  }, [tradePairs]);

  const handleChange = (state) => {
    setSelectedData(state.selectedRows);
  };

  const closeTrade = async (row) => {
    dispatch(trigerFlag({ contractAddress: row.contractAddress, flag: true }));
    const paramtersInfo = {
      address: row.contractAddress,
      publicKey: publicKey,
    };
    const res = await closeSwap(paramtersInfo);
    if (res.message == "Position updated successfully.") {
      dispatch(
        trigerFlag({ contractAddress: row.contractAddress, flag: true })
      );
      dispatch(
        closePosition({
          address: res.address,
        })
      );
      dispatch(
        show({
          title: "Success",
          body: "Closed Successfull.",
          type: "success",
        })
      );
    } else {
      dispatch(
        show({
          title: "Error",
          body: res.message,
          type: "error",
        })
      );
    }
  };

  const closeAllPosition = async () => {
    dataArray.map((obj) => {
      if (obj.openRole) {
        console.log(obj.contractAddress)
        dispatch(
          trigerFlag({ contractAddress: obj.contractAddress, flag: true })
        );
        console.log(obj)
      }
    });
    setCloseAll(true);
    const res = await closeAllSwap();
    setCloseAll(false);
    console.log("res--", res)
    if (res.message == "All positions processed") {
      res.updatedPositions.map((obj) => {
        dispatch(
          trigerFlag({ contractAddress: obj.contractAddress, flag: false })
        );
        dispatch(
          closePosition({
            address: obj.address,
          })
        );
      });
    } else {
      dataArray.map((obj) => {
        if (obj.openRole) {
          console.log(obj.contractAddress)
          dispatch(
            trigerFlag({ contractAddress: obj.contractAddress, flag: false })
          );
        }
      });
      dispatch(
        show({
          title: "error",
          body: res + "address is failed to sell.",
          type: "Error",
        })
      );
    }
  };

  const addTrade = async (row) => {
    if (!publicKey) {
      dispatch(
        show({
          title: "Error",
          body: "Please link your wallet",
          type: "error",
        })
      );
      return;
    }
    if (
      !tradeParameters.addTrade ||
      !tradeParameters.profitMin ||
      !tradeParameters.slippage
    ) {
      dispatch(
        show({
          title: "Error",
          body: "Please enter trade size, slippage and profit minimum",
          type: "error",
        })
      );
    } else {
      if (row.openRole) {
        dispatch(
          show({
            title: "Error",
            body: "This token is already trading",
            type: "error",
          })
        );
      } else {
        dispatch(
          trigerFlag({ contractAddress: row.contractAddress, flag: true })
        );
        const paramtersInfo = {
          ...tradeParameters,
          address: row.contractAddress,
          publicKey: publicKey,
        };

        const res = await swap(paramtersInfo);
        if (res.status) {
          dispatch(
            trigerFlag({ contractAddress: row.contractAddress, flag: false })
          );
          dispatch(
            saveSellInfo({
              address: res.msg?.address,
              sellPrice: res.msg?.sellPrice,
              openPosition: res.msg?.openPosition,
              openRole: res.msg?.openRole,
            })
          );
          dispatch(
            show({
              title: "Success",
              body: "Transaction Successfully",
              type: "success",
            })
          );
        } else {
          dispatch(
            trigerFlag({ contractAddress: row.contractAddress, flag: false })
          );
          dispatch(
            show({
              title: "Error",
              body: res.msg,
              type: "error",
            })
          );
        }
      }
    }
  };

  const tradeEvent = async () => {
    if (!publicKey) {
      dispatch(
        show({
          title: "Error",
          body: "Please link your wallet",
          type: "error",
        })
      );
      return;
    }
    for (const data of selectedData) {
      if (!data.profitMin || !data.tradeSize) {
        // Dispatch error message
        dispatch(
          show({
            title: "Error",
            body: `Please enter trade size and profit minimum for ${
              data.id + 1
            }th trade`,
            type: "error",
          })
        );
        // Exit the function early
        return;
      }
      if (data.pool == "---") {
        // Dispatch error message
        dispatch(
          show({
            title: "Error",
            body: `${data.id + 1}th trade can't run due to not Pooled SOL`,
            type: "error",
          })
        );
        // Exit the function early
        return;
      }
    }
    for (const data of selectedData) {
      if (!data.openRole && tradeParameters.slippage) {
        dispatch(
          trigerFlag({ contractAddress: data.contractAddress, flag: true })
        );
      }
      if (data.openRole) {
        dispatch(
          show({
            title: "Error",
            body: "This token is already trading",
            type: "error",
          })
        );
        return;
      }
    }
    if (selectedData.length == 0) {
      dispatch(
        show({
          title: "Error",
          body: "Please select trade pairs",
          type: "error",
        })
      );
      return;
    }
    if (!tradeParameters.slippage) {
      dispatch(
        show({
          title: "Error",
          body: "Please enter slippage.",
          type: "error",
        })
      );
      return;
    }
    const res = await multiSwap(selectedData, tradeParameters, publicKey);
    res.map((obj) => {
      if (obj.status) {
        dispatch(
          trigerFlag({ contractAddress: obj.msg?.address, flag: false })
        );
        dispatch(
          saveSellInfo({
            address: obj.msg?.address,
            sellPrice: obj.msg?.sellPrice,
            openPosition: obj.msg?.openPosition,
            openRole: obj.msg?.openRole,
          })
        );
        dispatch(
          show({
            title: "Success",
            body: obj.msg?.address + "Transaction Successfully",
            type: "success",
          })
        );
      } else {
        dispatch(
          show({
            title: "Error",
            body: "Transaction was Failed.",
            type: "error",
          })
        );
      }
    });
    for (const data of selectedData) {
      dispatch(
        trigerFlag({ contractAddress: data.contractAddress, flag: false })
      );
    }
  };

  const setTradeInput = (e, idx) => {
    setTradeSizeValues(() => ({
      [idx]: e.target.value,
    }));
    dispatch(updateTradeSize({ id: idx, value: e.target.value }));
  };

  const handleProfitMin = (e, idx) => {
    setProfitMin(() => ({
      ...profitMin,
      [idx]: e.target.value,
    }));
    dispatch(updateProfit({ id: idx, value: e.target.value }));
  };

  const columns = [
    {
      name: "Contract Address",
      selector: (row) => (
        <div className="flex items-center">
          <span
            onClick={() => copyToClipboard(row.contractAddress)}
            className="cursor-pointer text-blue-500 hover:text-blue-700"
          >
            {`${row.contractAddress.slice(0, 6)}...${row.contractAddress.slice(
              -4
            )}`}
          </span>
        </div>
      ),
      sortable: true, // sort function
    },
    {
      name: "Ticker",
      selector: (row) => row.symbol,
    },
    {
      name: "Name",
      selector: (row) => row.name,
    },
    {
      name: "Liquidity (USD)",
      selector: (row) => row.liquidity,
    },
    {
      name: "Market Cap (USD)",
      selector: (row) => row.marketCap,
    },
    {
      name: "Pooled SOL (SOL)",
      selector: (row) => row.pool,
    },
    {
      name: "Trade Size",
      cell: (row) => (
        <input
          className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-20 text-white bg-gray-900"
          id={row.id}
          value={row.tradeSize}
          placeholder={"0.1"}
          type={"text"}
          onChange={(e) => setTradeInput(e, row.id)}
        />
      ),
    },
    {
      name: "Price Impact (%)",
      selector: (row) => row.priceImpact,
    },
    {
      name: "Add Trades",
      button: "true",
      cell: (row) => (
        <button
          onClick={() => addTrade(row)}
          className="px-2 py-1 text-white bg-green-500 hover:bg-green-600 border-none rounded"
        >
          Add Trades
        </button>
      ),
    },
    {
      name: "Profit Minimum",
      cell: (row) => (
        <input
          className="border-none p-1 text-sm focus:outline-none h-6 w-16 sm:w-20 text-white bg-gray-900"
          id={row.id}
          value={row.profitMin}
          placeholder="10"
          name="profitMin"
          type="text"
          onChange={(e) => handleProfitMin(e, row.id)}
        />
      ),
    },
    {
      name: "Open Position",
      selector: (row) => row.openPosition,
    },
    {
      name: "Close",
      button: "true",
      cell: (row) =>
        row.openRole ? (
          <button
            onClick={() => closeTrade(row)}
            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white border-none rounded"
          >
            {row.flag ? <SmallSpinner style={{ margin: "3px" }} /> : "Close"}
          </button>
        ) : row.flag ? (
          <SmallSpinner />
        ) : (
          ""
        ),
    },
    {
      name: "Red Flags",
      selector: (row) => row.redFlag,
    },
  ];
  const paginationComponentOptions = {
    rowsPerPageText: "Filas por página",
    rangeSeparatorText: "de",
    selectAllRowsItem: true,
    selectAllRowsItemText: "Todos",
  };

  const data = dataArray;
  return (
    <>
      <div className="w-full flex flex-col items-center justify-center gap-4 mx-2">
        <div className="flex flex-col items-center justify-center gap-4 mt-4 w-full">
          <DataTable
            fixedHeader
            columns={columns}
            data={data}
            selectableRows
            theme="solarized"
            pagination
            paginationComponentOptions={paginationComponentOptions}
            progressPending={pending}
            progressComponent={<CustomLoader />}
            highlightOnHover
            pointerOnHover
            onSelectedRowsChange={handleChange}
          />
        </div>
        <div className="flex flex-row items-center justify-between gap-4 mt-4 w-full px-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md border-none focus:outline-none">
            Next Page
          </button>
          <button
            onClick={tradeEvent}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-4 sm:py-2 rounded-md border-none focus:outline-none"
          >
            Trade
          </button>
          <button
            onClick={closeAllPosition}
            className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md border-none focus:outline-none"
          >
            <div className="row flex">
              Close All Open Positions{" "}
              {closeAll ? <SmallSpinner style={{ margin: "4px" }} /> : ""}
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  margin: 16px;
  animation: ${rotate360} 1s linear infinite;
  transform: translateZ(0);
  border-top: 2px solid grey;
  border-right: 2px solid grey;
  border-bottom: 2px solid grey;
  border-left: 4px solid black;
  background: transparent;
  width: 80px;
  height: 80px;
  border-radius: 50%;
`;
const SmallSpinner = styled.div`
  margin: 16px;
  animation: ${rotate360} 1s linear infinite;
  transform: translateZ(0);
  border-top: 2px solid grey;
  border-right: 2px solid grey;
  border-bottom: 2px solid grey;
  border-left: 4px solid black;
  background: transparent;
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const CustomLoader = () => (
  <div style={{ padding: "24px" }}>
    <Spinner />
    <div>Loading...</div>
  </div>
);

createTheme(
  "solarized",
  {
    text: {
      primary: "#268bd2",
      secondary: "#2aa198",
    },
    background: {
      default: "#252525",
    },
    context: {
      background: "#cb4b16",
      text: "#f0f8ff",
    },
    divider: {
      default: "#073642",
    },
    action: {
      button: "rgba(0,0,0,.54)",
      hover: "rgba(0,0,0,.08)",
      disabled: "rgba(0,0,0,.12)",
    },
  },
  "dark"
);
