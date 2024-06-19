import "./App.css";
import { Board } from "./components/board";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetTokens } from "./hooks/useTokens";

function App() {

  useGetTokens();

  return (
    <>
      <ToastContainer
        autoClose={2000}
        closeOnClick
        theme="dark"
        position="bottom-right"
      />
      <div className="h-screen flex flex-col">
        <Header />
        <div className="mb-auto flex items-center justify-center">
         <Board />
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;
