import { PlusIcon } from "@heroicons/react/24/solid";

import "./App.css";

function App() {
  return (
    <>
      <div></div>
      <h1 className="text-brand-400">HRIS</h1>
      <div className="flex justify-center items-center gap-4">
        <PlusIcon className="h-5 w-5 text-center" aria-hidden="true" />
      </div>
      <p>
        Edit <code>src/App.jsx</code> and save to test HMR
      </p>
      <p className="">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
