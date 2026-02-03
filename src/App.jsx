import { ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Alert, Button, Card, Dropdown, Input, Table } from "./lib/components";
import { Layout } from "./lib/components/layout/layout.jsx";
import "./App.css";
import { AlertBanner } from "./lib/components/alert/alertBanner.jsx";

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

			<AlertBanner
				variant="success"
				message="APASIH?">

			</AlertBanner>
		</Layout>
	);
}

export default App;
