import { ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Alert, Button, Card, Dropdown, Input, Table } from "./lib/components";
import { Layout } from "./lib/components/layout/layout.jsx";
import "./App.css";

function App() {
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
