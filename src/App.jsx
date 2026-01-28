import { ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import "./App.css";
import { Alert, Button, Dropdown, Input, Table } from "./lib/components";

function App() {
  return (
    <>
      <h1 className="text-brand-400">HRIS</h1>
      <div className="flex justify-center items-center gap-4">
        <PlusIcon className="h-5 w-5 text-center" aria-hidden="true" />
      </div>
      <Alert/>
      
      <Dropdown />

      
    <Input
      placeholder="Username"
    />

    <Input
      placeholder="Password"
    />

    <Button variant="primary" onClick={()=>{console.log('masuk')}}>
        Tutup 
        <ClockIcon className="h-5 w-5 text-center gap-4"/></Button>


      <Table />
    </>
  );
}

export default App;
