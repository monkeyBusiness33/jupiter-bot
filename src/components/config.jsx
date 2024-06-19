import { useState } from "react";
import Modal from "react-modal";
import { getWalletInfo, importKey } from "../services";
import { useDispatch } from "react-redux";
import { show } from "../redux/reducer/notification";
import { setWalletAddress, setConnected } from "../redux/reducer/wallet";

export const WalletConfig = ({ modal, setModal }) => {
  const dispatch = useDispatch();

  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState(false);

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#252525",
      //   width: "50%",
      //   height: "50%",
      borderRadius: "5px",
      zIndex: 10,
    },
  };

  const importWallet = async () => {
    try {
      if (!publicKey || !privateKey) {
        dispatch(
          show({
            title: "Error",
            body: "Please enter your wallet address and private key",
            type: "error",
          })
        );
        console.error("Please enter your wallet address and private key");
        setError(true);
        return;
      }
      dispatch(setConnected(true));
      dispatch(setWalletAddress({publicKey,privateKey}));
      const response = await importKey({ publicKey, privateKey });
      if (response) {
        if (response.status === "success") {
          await walletInfo(response.data.publicKey);
          dispatch(
            show({ title: "Success", body: response.message, type: "success" })
          );
          closeModal();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const walletInfo = async (publicKey) => {
    try {
      const response = await getWalletInfo({ publicKey });
      if (response) {
        console.log(response);
        closeModal();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const closeModal = () => {
    setModal(false);
  };

  return (
    <Modal
      isOpen={modal}
      contentLabel="Wallet Configuration"
      style={customStyles}
      onRequestClose={closeModal}
    >
      <div className="flex flex-col items-center justify-center gap-2 w-[300px] sm:w-[560px]">
        <div className="text-xl font-bold text-white">Wallet Configuration</div>
        <div className="flex flex-col  items-center justify-center w-full mt-5">
          <input
            onChange={(e) => setPublicKey(e.target.value.trim())}
            className="text-sm w-full px-2 py-2 rounded focus:outline-none mt-2"
            type="text"
            value={publicKey}
            placeholder="Please enter your wallet address"
          />

          <input
            onChange={(e) => setPrivateKey(e.target.value.trim())}
            className="text-sm w-full px-2 py-2 rounded focus:outline-none mt-5"
            type="text"
            value={privateKey}
            placeholder="Please enter your private key"
          />
          <button
            onClick={importWallet}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-2 sm:py-2 rounded-md border-none mt-5 "
          >
            Connect
          </button>
        </div>
      </div>
    </Modal>
  );
};
