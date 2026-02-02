import { ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Alert, Button, Card, Dropdown, Input, Table } from "./lib/components";
import { Layout } from "./lib/components/layout/layout.jsx";
import "./App.css";

function App() {
	return (
		<Layout>
			<Alert
				variant="question"
				title="Hapus data ini?"
				// Tombol "Ya, Lanjutkan"
				onConfirm={() => {
					console.log("Data Dihapus!");
					setAlertType(null);
				}}
				// Tombol "Batal"
				onCancel={() => {
					console.log("Batal hapus.");
					setAlertType(null);
				}}
			/>
		</Layout>
	);
}

export default App;
