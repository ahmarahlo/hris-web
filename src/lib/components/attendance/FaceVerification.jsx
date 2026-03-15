import { useState, useEffect, useRef, useCallback, memo } from "react";
import * as faceapi from "face-api.js";
import {
	ArrowPathIcon,
	CheckCircleIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";

// Settings
const ANALYSIS_INTERVAL_MS = 500;
const REQUIRED_DURATION_MS = 4000; // 4 detik

let modelsLoaded = false;

export const FaceVerification = memo(function FaceVerification({
	onVerify,
	onCancel,
}) {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const intervalRef = useRef(null);
	const streamRef = useRef(null);
	const faceStartTimeRef = useRef(null);

	const [cameraReady, setCameraReady] = useState(false);
	const [error, setError] = useState(null);
	const [capturedImage, setCapturedImage] = useState(null);
	const [faceDetected, setFaceDetected] = useState(false);
	const [progress, setProgress] = useState(0);
	const [modelReady, setModelReady] = useState(modelsLoaded);

	// Load face-api models (TinyFaceDetector + 68 landmarks)
	useEffect(() => {
		if (modelsLoaded) {
			setModelReady(true);
			return;
		}
		const loadModels = async () => {
			try {
				await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
				await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
				modelsLoaded = true;
				setModelReady(true);
				console.log("Face API Models Loaded!");
			} catch (err) {
				console.error("Gagal load model:", err);
				setModelReady(true); // let camera work anyway
			}
		};
		loadModels();
	}, []);

	const startCamera = useCallback(async () => {
		try {
			setError(null);
			setCameraReady(false);
			setProgress(0);
			faceStartTimeRef.current = null;
			setCapturedImage(null);
			setFaceDetected(false);

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 640 },
					height: { ideal: 480 },
				},
				audio: false,
			});

			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.onloadedmetadata = () => {
					videoRef.current.play();
					setCameraReady(true);
				};
			}
		} catch (err) {
			if (err.name === "NotAllowedError")
				setError("Akses kamera ditolak. Izinkan akses kamera di browser.");
			else if (err.name === "NotFoundError")
				setError("Kamera tidak ditemukan.");
			else setError("Gagal membuka kamera: " + err.message);
		}
	}, []);

	const stopCamera = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
	}, []);

	const capturePhoto = useCallback(() => {
		if (!videoRef.current) return;
		const video = videoRef.current;
		const vw = video.videoWidth,
			vh = video.videoHeight;
		const ratio = 16 / 9,
			vr = vw / vh;
		let sx = 0,
			sy = 0,
			sw = vw,
			sh = vh;
		if (vr > ratio) {
			sw = vh * ratio;
			sx = (vw - sw) / 2;
		} else {
			sh = vw / ratio;
			sy = (vh - sh) / 2;
		}

		const c = document.createElement("canvas");
		c.width = sw;
		c.height = sh;
		const ctx = c.getContext("2d");
		ctx.translate(sw, 0);
		ctx.scale(-1, 1);
		ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
		setCapturedImage(c.toDataURL("image/jpeg", 0.8));
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		// Stop camera immediately
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
	}, []);

	// Face detection with landmarks (mata, hidung, mulut)
	const analyzeFrame = useCallback(async () => {
		if (!videoRef.current || capturedImage || !modelsLoaded) return;

		try {
			// Detect face + 68 facial landmarks (mata, hidung, mulut, dagu)
			const detection = await faceapi
				.detectSingleFace(
					videoRef.current,
					new faceapi.TinyFaceDetectorOptions({
						inputSize: 160,
						scoreThreshold: 0.5,
					}),
				)
				.withFaceLandmarks();

			if (detection) {
				setFaceDetected(true);

				// Timer
				const now = Date.now();
				if (!faceStartTimeRef.current) faceStartTimeRef.current = now;
				const elapsed = now - faceStartTimeRef.current;
				const pct = Math.min(100, (elapsed / REQUIRED_DURATION_MS) * 100);
				setProgress(pct);

				if (elapsed >= REQUIRED_DURATION_MS) {
					capturePhoto();
				}
			} else {
				setFaceDetected(false);
				faceStartTimeRef.current = null;
				setProgress((prev) => Math.max(0, prev - 10));
			}
		} catch (err) {
			console.warn("Detection error:", err);
		}
	}, [capturedImage, capturePhoto]);

	useEffect(() => {
		if (cameraReady && !capturedImage && modelReady) {
			intervalRef.current = setInterval(analyzeFrame, ANALYSIS_INTERVAL_MS);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [cameraReady, capturedImage, analyzeFrame, modelReady]);

	useEffect(() => {
		startCamera();
		return () => stopCamera();
	}, [startCamera, stopCamera]);

	const handleConfirm = () => {
		stopCamera();
		onVerify(capturedImage);
	};
	const handleCancel = () => {
		stopCamera();
		onCancel();
	};
	const handleRetry = () => {
		setCapturedImage(null);
		setProgress(0);
		faceStartTimeRef.current = null;
		setFaceDetected(false);
		startCamera();
	};

	return (
		<div className="flex flex-col bg-white overflow-hidden rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-100">
			<div className="bg-[#A0C4DE] px-4 py-3 flex items-center justify-between">
				<div>
					<h3 className="text-white text-base font-semibold">
						Verifikasi wajah
					</h3>
					<p className="text-white/80 text-[11px]">Arahkan wajah ke kamera</p>
				</div>
				{capturedImage && (
					<button
						onClick={handleRetry}
						className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
						title="Foto ulang"
					>
						<ArrowPathIcon className="w-5 h-5 text-white" />
					</button>
				)}
			</div>

			<div className="px-4 pt-3 pb-2">
				<div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
					<canvas ref={canvasRef} className="hidden" />

					{error ? (
						<div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 text-red-400 px-8 bg-gray-900">
							<XCircleIcon className="w-10 h-10" />
							<p className="text-xs font-semibold text-center">{error}</p>
							<button
								onClick={startCamera}
								className="text-xs underline font-medium hover:text-red-300"
							>
								Coba Lagi
							</button>
						</div>
					) : capturedImage ? (
						<div className="absolute inset-0">
							<img
								src={capturedImage}
								alt="Captured face"
								className="w-full h-full object-cover"
							/>
							<div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
								<CheckCircleIcon className="w-4 h-4" />
								Foto berhasil
							</div>
						</div>
					) : (
						<>
							<video
								ref={videoRef}
								autoPlay
								playsInline
								muted
								className="w-full h-full object-cover"
								style={{ transform: "scaleX(-1)" }}
							/>

							{cameraReady && (
								<div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
									<span
										className={`text-[11px] font-medium px-3 py-1 rounded-full  ${faceDetected ? "bg-green-500/80 text-white" : "bg-black/50 text-white"}`}
									>
										{!modelReady
											? "Memuat model deteksi..."
											: faceDetected
												? "Wajah terdeteksi, tetap diam..."
												: "Posisikan wajah di dalam lingkaran"}
									</span>
								</div>
							)}

							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<div
									className={`w-36 h-44 rounded-full border-[3px] transition-colors duration-300 ${faceDetected ? "border-green-400 border-solid" : "border-white/50 border-dashed"}`}
								/>
							</div>

							{cameraReady && (
								<div className="absolute bottom-0 left-0 right-0">
									<div className="w-full h-1 bg-white/20">
										<div
											className="h-full bg-green-400 transition-all duration-200"
											style={{ width: `${progress}%` }}
										/>
									</div>
								</div>
							)}

							{(!cameraReady || !modelReady) && !error && (
								<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
									<div className="w-8 h-8 border-3 border-[#7B8DFF] border-t-transparent rounded-full animate-spin" />
									<span className="mt-2 text-[11px] text-gray-400 font-medium">
										{!modelReady
											? "Memuat model deteksi wajah..."
											: "Membuka kamera..."}
									</span>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			<div className="px-4 pb-3">
				{!capturedImage && (
					<p className="text-[10px] text-gray-400 mt-1 mb-2 text-center">
						Lepas kacamata, masker, & topi. Pastikan pencahayaan cukup.
					</p>
				)}
				<div className="flex items-center justify-between pt-2 border-t border-gray-100">
					<div className="flex flex-col flex-1 pr-4">
						{capturedImage ? (
							<span className="text-sm font-bold text-green-500">
								Verifikasi wajah berhasil ✓
							</span>
						) : cameraReady ? (
							<span
								className={`text-xs font-semibold ${faceDetected ? "text-green-500" : "text-gray-400"}`}
							>
								{faceDetected
									? "Mendeteksi wajah..."
									: "Wajah tidak terdeteksi"}
							</span>
						) : (
							<span className="text-gray-400 text-xs italic">
								Mempersiapkan kamera...
							</span>
						)}
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleCancel}
							className="px-5 py-1.5 rounded-lg bg-[#FF8A65] hover:bg-[#ff7b52] text-white text-sm font-medium transition-all active:scale-95 shadow-sm"
						>
							Batal
						</button>
						{capturedImage && (
							<button
								onClick={handleConfirm}
								className="px-5 py-1.5 rounded-lg bg-[#7B8DFF] hover:bg-[#6a7ceb] text-white text-sm font-medium transition-all active:scale-95 shadow-sm"
							>
								Lanjut
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
});
