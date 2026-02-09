import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/solid";
import { Table, Badge, Layout } from "./lib/components";
import "./App.css";

function App() {
  // Data sample sesuai gambar
  const cutiData = [
    {
      no: 1,
      nama: "Reno",
      tanggal: 3,
      alasan: "Sakit",
      catatan: "",
      status: "approve",
      lastUser: "Admin09",
    },
    {
      no: 2,
      nama: "Reno",
      tanggal: 3,
      alasan: "Sakit",
      catatan: "",
      status: "pending",
      lastUser: "Admin09",
    },
    {
      no: 3,
      nama: "Reno",
      tanggal: 3,
      alasan: "Sakit",
      catatan: "",
      status: "approve",
      lastUser: "Admin09",
    },
    {
      no: 4,
      nama: "Reno",
      tanggal: 3,
      alasan: "Sakit",
      catatan: "",
      status: "reject",
      lastUser: "Admin09",
    },
    {
      no: 5,
      nama: "Farid",
      tanggal: 3,
      alasan: "Sakit",
      catatan: "",
      status: "approve",
      lastUser: "Admin09",
    },
  ];

  const columns = [
    { header: "No", accessor: "no" },
    { header: "Nama karyawan", accessor: "nama" },
    { header: "Tanggal cuti", accessor: "tanggal" },
    { header: "Alasan", accessor: "alasan" },
    {
      header: "Catatan HR",
      accessor: "catatan",
      render: (row) => row.catatan || "-",
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={row.status}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    { header: "Last user", accessor: "lastUser" },
    {
      header: "Action",
      accessor: "action",
      render: () => (
        <button className="p-2 text-brand-600 hover:text-brand-800 hover:bg-brand-100 rounded-lg transition-colors">
          <PencilIcon className="h-5 w-5" />
        </button>
      ),
    },
  ];

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
