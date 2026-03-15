import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Circle,
	Tooltip,
	useMap,
} from "react-leaflet";
import {
	ExclamationTriangleIcon,
	MapPinIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// KORDINAT KANTOR
const OFFICE_LOCATION = {
	lat: -6.2301,
	lng: 106.8467,
};
const ALLOWED_RADIUS_M = 100;

// OPTIMASI 1: Pindahkan array & object statis ke luar komponen
const MAP_CENTER = [OFFICE_LOCATION.lat, OFFICE_LOCATION.lng];
const MAP_STYLE = { height: "100%", width: "100%" };

// OPTIMASI 2: Auto fit bounds + auto-snap-back setelah user geser peta
function MapRefresher({ center }) {
	const map = useMap();
	const boundsRef = useRef(null);
	const timerRef = useRef(null);

	// Save target bounds and fly to them
	useEffect(() => {
		if (center) {
			boundsRef.current = L.latLngBounds([center, MAP_CENTER]);
			map.flyToBounds(boundsRef.current, {
				padding: [50, 50],
				maxZoom: 17,
				duration: 1.5,
			});
		}
	}, [center, map]);

	// Auto-snap-back after user drags/pans
	useEffect(() => {
		const handleMoveEnd = () => {
			if (!boundsRef.current) return;

			// Clear previous timer
			if (timerRef.current) clearTimeout(timerRef.current);

			// Set timer to snap back after 3 seconds
			timerRef.current = setTimeout(() => {
				if (boundsRef.current) {
					map.flyToBounds(boundsRef.current, {
						padding: [50, 50],
						maxZoom: 17,
						duration: 1.2,
					});
				}
			}, 5000);
		};

		map.on("dragend", handleMoveEnd);
		return () => {
			map.off("dragend", handleMoveEnd);
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [map]);

	return null;
}

export const LocationVerification = memo(function LocationVerification({
	onVerify,
	onCancel,
}) {
	const [location, setLocation] = useState(null);
	const [error, setError] = useState(null);
	const [status, setStatus] = useState("loading"); // loading | success | error
	const [distance, setDistance] = useState(null);

	// Haversine formula
	const calculateDistance = (lat1, lon1, lat2, lon2) => {
		const R = 6371;
		const dLat = (lat2 - lat1) * (Math.PI / 180);
		const dLon = (lon2 - lon1) * (Math.PI / 180);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1 * (Math.PI / 180)) *
				Math.cos(lat2 * (Math.PI / 180)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c * 1000;
	};

	const fetchLocation = useCallback(() => {
		if (!navigator.geolocation) {
			setError("Geolocation tidak didukung");
			setStatus("error");
			return;
		}

		setStatus("loading");
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const userLat = position.coords.latitude;
				const userLng = position.coords.longitude;
				const userPos = [userLat, userLng];
				const dist = calculateDistance(
					userLat,
					userLng,
					OFFICE_LOCATION.lat,
					OFFICE_LOCATION.lng,
				);

				setLocation(userPos);
				setDistance(dist);
				setStatus("success");
				setError(null);
			},
			(err) => {
				setError("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
				setStatus("error");
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
		);
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchLocation();
	}, [fetchLocation]);

	const isWithinRange = useMemo(
		() => distance !== null && distance <= ALLOWED_RADIUS_M,
		[distance],
	);

	const handleVerify = useCallback(() => {
		if (status === "success" && location && isWithinRange) {
			onVerify(location);
		}
	}, [status, location, isWithinRange, onVerify]);

	// OPTIMASI 3: Memoize pathOptions agar Circle tidak render ulang terus
	const circlePathOptions = useMemo(
		() => ({
			color: isWithinRange ? "#66BB6A" : "#ef4444",
			fillColor: isWithinRange ? "#66BB6A" : "#ef4444",
			fillOpacity: 0.1,
			weight: 1,
			dashArray: "5, 5",
		}),
		[isWithinRange],
	);

	// Create custom icons for better stability in react-leaflet 5
	const officeIcon = useMemo(
		() =>
			L.divIcon({
				className: "custom-office-icon",
				html: `<div style="width: 12px; height: 12px; background: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
				iconSize: [12, 12],
				iconAnchor: [6, 6],
			}),
		[],
	);

	const userIcon = useMemo(
		() =>
			L.divIcon({
				className: "custom-user-icon",
				html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>`,
				iconSize: [16, 16],
				iconAnchor: [8, 8],
			}),
		[],
	);

	return (
		<div className="flex flex-col bg-white overflow-hidden rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-100">
			{/* Restored Standard Header */}
			<div className="bg-[#A0C4DE] p-4 flex items-center justify-between">
				<h3 className="text-white text-lg font-medium">
					Konfirmasi lokasi saat ini
				</h3>
				{status !== "loading" && (
					<button
						onClick={fetchLocation}
						className="p-1 hover:bg-white/20 rounded-full transition-colors"
						title="Refresh Lokasi"
					>
						<ArrowPathIcon className="w-5 h-5 text-white" />
					</button>
				)}
			</div>

			<div className="p-4">
				<div className="w-full h-[350px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
					<MapContainer
						center={MAP_CENTER}
						zoom={17}
						scrollWheelZoom={true}
						style={MAP_STYLE}
						zoomControl={false}
						attributionControl={false}
						preferCanvas={true}
						zoomAnimation={true}
						fadeAnimation={true}
						markerZoomAnimation={true}
						zoomSnap={0.5}
						zoomDelta={0.5}
					>
						<TileLayer
							url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
							maxZoom={20}
						/>

						<MapRefresher center={location} />

						{/* Office Location */}
						<Marker position={MAP_CENTER} icon={officeIcon}>
							<Tooltip
								permanent
								direction="top"
								offset={[0, -8]}
								className="!bg-white !text-gray-700 !text-[10px] !font-semibold !border-gray-200 !shadow-md !rounded-md !px-2 !py-1"
							>
								Kantor
							</Tooltip>
						</Marker>
						<Circle
							center={MAP_CENTER}
							radius={ALLOWED_RADIUS_M}
							pathOptions={circlePathOptions}
						/>

						{/* User Pointer */}
						{location && (
							<Marker position={location} icon={userIcon}>
								<Tooltip
									permanent
									direction="top"
									offset={[0, -10]}
									className="!bg-blue-500 !text-white !text-[10px] !font-semibold !border-blue-400 !shadow-md !rounded-md !px-2 !py-1"
								>
									Posisi Anda
								</Tooltip>
							</Marker>
						)}
					</MapContainer>

					{status === "loading" && (
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 z-[1000]">
							<div className="w-10 h-10 border-4 border-[#7B8DFF] border-t-transparent rounded-full animate-spin"></div>
							<span className="mt-3 text-xs text-gray-500 font-medium">
								Mencari Lokasi...
							</span>
						</div>
					)}

					{status === "error" && (
						<div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 text-red-500 px-8 z-[2000] bg-white">
							<ExclamationTriangleIcon className="w-12 h-12" />
							<p className="text-sm font-semibold text-center">{error}</p>
							<button
								onClick={fetchLocation}
								className="text-xs underline font-medium hover:text-red-700"
							>
								Coba Lagi
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Restored Standard Footer */}
			<div className="p-4 flex items-center justify-between border-t border-gray-50">
				<div className="flex flex-col flex-1 pr-4">
					{status === "success" ? (
						<>
							<span
								className={`text-sm font-bold ${isWithinRange ? "text-[#66BB6A]" : "text-red-500"}`}
							>
								{isWithinRange
									? "Anda berada di area kantor"
									: "Di luar area kantor"}
							</span>
							<span className="text-[10px] text-gray-400">
								Jarak: {distance !== null ? Math.round(distance) : 0}m dari
								pusat
							</span>
						</>
					) : (
						<span className="text-gray-400 text-sm italic">
							{status === "loading" ? "Mendeteksi..." : "Gagal dideteksi"}
						</span>
					)}
				</div>

				<div className="flex gap-3">
					<button
						onClick={onCancel}
						className="px-6 py-2 rounded-lg bg-[#FF8A65] hover:bg-[#ff7b52] text-white text-sm font-medium transition-all active:scale-95 shadow-sm"
					>
						batal
					</button>
					<button
						onClick={handleVerify}
						disabled={!isWithinRange}
						className={`px-6 py-2 rounded-lg text-white text-sm font-medium transition-all active:scale-95 shadow-sm ${
							isWithinRange
								? "bg-[#7B8DFF] hover:bg-[#6a7ceb]"
								: "bg-gray-300 cursor-not-allowed"
						}`}
					>
						Lanjut
					</button>
				</div>
			</div>
		</div>
	);
});
