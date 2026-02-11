import { PencilIcon } from "@heroicons/react/24/solid";
import { Table, Badge, Layout, Card } from "./lib/components";
import "./App.css";

function App() {
  // Data sample sesuai gambar

  return (
    <Layout>
      <Card variant="absen_belum" onAction={() => alert("Masuk")}>
        i
      </Card>
      <Card variant="absen_sudah" onAction={() => alert("Masuk")}>
        i
      </Card>
      <Card variant="absen_lengkap" onAction={() => alert("Masuk")}>
        i
      </Card>
      <Card variant="cuti" onAction={() => alert("Masuk")}>
        i
      </Card>
    </Layout>
  );
}

export default App;
