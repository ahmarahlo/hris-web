import { ClockIcon } from "@heroicons/react/24/outline";
import { Button } from "../button/Button.jsx";

export function Card({
  variant,
  jamMasuk,
  jamPulang,
  durasi,
  totalCuti,
  sisaCuti,
  onAction,
  children,
}) {
  // Jika ada children (misal untuk container generik seperti di App.jsx), kita render children saja
  if (children) {
    return (
      <div className="w-97 max-w-sm bg-white rounded-xl shadow-md overflow-hidden font-sans border flex flex-col h-fit">
        {children}
      </div>
    );
  }

  // Selebihnya logika lama (Absensi/Cuti) tetep jalan normal
  // 1. Mapping Variant ke Design Token (CSS Variables)
  const config = {
    absen_belum: {
      bg: "bg-danger",
      title: "Anda belum absen hari ini!",
      subTitle: "Absensi anda",
      btnText: "Clock In",
      btnVariant: "clock",
      isCuti: false,
    },
    absen_sudah: {
      bg: "bg-brand",
      title: "Anda sudah absen hari ini!",
      subTitle: "Absensi anda",
      btnText: "Clock Out",
      btnVariant: "clock",
      isCuti: false,
    },
    absen_lengkap: {
      bg: "bg-success",
      title: "Absensi anda sudah lengkap!",
      subTitle: "Absensi anda",
      btnText: null,
      isCuti: false,
    },
    cuti: {
      bg: "bg-info",
      title: "Info cuti anda",
      subTitle: null,
      btnText: "Ambil cuti",
      btnVariant: "clock",
      isCuti: true,
    },
  };

  const style = config[variant] || config["absen_belum"];

  return (
    <div className="w-97 max-w-sm bg-white rounded-xl shadow-md overflow-hidden font-sans border flex flex-col h-fit">
      {/* --- HEADER --- */}
      <div className={`${style.bg} p-5 text-white`}>
        <h3 className="font-bold text-lg leading-tight">{style.title}</h3>
        {style.subTitle && (
          <p className="text-xs opacity-90 mt-1">{style.subTitle}</p>
        )}
      </div>

      {/* --- BODY --- */}
      <div className="p-6 flex-1">
        {/* LOGIC CUTI (Single Column) */}
        {style.isCuti ? (
          <div className="flex flex-col h-full space-y-6">
            <div className="text-center space-y-6 text-brand-900 mt-2">
              <div>
                <p className="text-xs text-brand-700 mb-1">
                  Total pengajuan cuti tahun ini
                </p>
                <p className="text-5xl font-bold">{totalCuti || 0}</p>
              </div>
              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs text-brand-700 mb-1">
                  Cuti tersisa tahun ini
                </p>
                <p className="text-5xl font-bold">{sisaCuti || 0}</p>
              </div>
            </div>
            <div className="mt-auto">
              <Button
                variant={style.btnVariant}
                onClick={onAction}
                className="w-full justify-center"
              >
                {style.btnText}
              </Button>
            </div>
          </div>
        ) : (
          /* LOGIC ABSENSI (Split View: Kiri Info, Kanan Tombol) */
          <div className="flex flex-row h-full gap-4">
            {/* BAGIAN KIRI: Stack Informasi */}
            <div className="flex-1 flex flex-col gap-5 text-brand-900">
              {/* Jam Masuk */}
              <div>
                <p className="text-brand-650 text-xs mb-1">Jam masuk</p>
                <p
                  className={`font-semibold ${jamMasuk ? "text-3xl" : "text-xl"}`}
                >
                  {jamMasuk || "-"}
                </p>
              </div>

              {/* Jam Pulang */}
              <div>
                <p className="text-brand-650 text-xs mb-1">Jam pulang</p>
                <p
                  className={`font-semibold ${jamPulang ? "text-3xl" : "text-xl"}`}
                >
                  {jamPulang || "-"}
                </p>
              </div>

              {/* Durasi */}
              <div>
                <p className="text-brand-650 text-xs mb-1">Durasi kerja</p>
                <p className="font-semibold text-xl">{durasi || "-"}</p>
              </div>
            </div>

            {/* BAGIAN KANAN: Tombol di Bawah */}
            <div className="w-[40%] flex flex-col justify-end items-end">
              {variant === "absen_lengkap" ? (
                <div className="flex flex-col gap-2 w-full items-end">
                  <button
                    disabled
                    className="bg-disable-color text-white w-full px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-not-allowed opacity-70"
                  >
                    Clock In <ClockIcon className="w-3 h-3" />
                  </button>
                  <button
                    disabled
                    className="bg-disable-color text-white w-full px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-not-allowed opacity-70"
                  >
                    Clock Out <ClockIcon className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Button
                  variant={style.btnVariant}
                  onClick={onAction}
                  className="w-full justify-center text-sm"
                >
                  {style.btnText} <ClockIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
