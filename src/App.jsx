import { PlusIcon } from "@heroicons/react/24/solid";
import "./App.css";
import { Alert, Button, Dropdown, Input, Table } from "./lib/components";

function App() {
  return (
    <>
      <div></div>
      <h1 className="text-brand-400">HRIS</h1>
      <div className="flex justify-center items-center gap-4">
        <PlusIcon className="h-5 w-5 text-center" aria-hidden="true" />
      </div>
      <Alert />
      <Button variant="primary" className={"bg-amber-300"}>Tutup</Button>
      <Dropdown />
      <Input />
      <Table />
    </>
  );
}

export default App;
