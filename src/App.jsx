import { ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Alert, Button, Card, Dropdown, Input, Table } from "./lib/components";
import { Layout } from "./lib/components/layout/layout.jsx";
import "./App.css";
import { AlertBanner } from "./lib/components/alert/alertBanner.jsx";

function App() {
	const columns = [
		{ header: "No", accessor: "no" },
		{ header: "Tanggal", accessor: "tanggal" },
		{ header: "Bulan", accessor: "bulan" },
		{ header: "Durasi kerja", accessor: "durasi" },
		{ header: "Jam masuk", accessor: "masuk" },
		{ header: "Jam pulang", accessor: "pulang" },
	];

	// 2. Dummy Data (Sesuai Isi Gambar)
	// Nanti ini bisa diganti hasil fetch API
	const attendanceData = [
		{
			no: 1,
			tanggal: 10,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		{
			no: 2,
			tanggal: 10,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		{
			no: 3,
			tanggal: 10,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		{
			no: 4,
			tanggal: 10,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		{
			no: 5,
			tanggal: 10,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		// Tambah data lagi biar kelihatan scroll-nya
		{
			no: 6,
			tanggal: 11,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		{
			no: 7,
			tanggal: 11,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
		{
			no: 8,
			tanggal: 11,
			bulan: 23,
			durasi: "8 Jam",
			masuk: "08.00",
			pulang: "17.00",
		},
	];

	return (
		<Layout>
			<div className="w-full max-w-4xl">
				<Table 	columns={columns} data={attendanceData} maxheight="400px" />
			</div>
		</Layout>
	);
}

export default App;
