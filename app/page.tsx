"use client";
import React, { useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export default function Home() {
	const [recording, setRecording] = useState(false);
	const [running, setRunning] = useState(false);
	const [discount, setDiscount] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [transcript, setTranscript] = useState<string>("");
	const [volume, setVolume] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const startTimeRef = useRef<number>(0);
	const speakingRef = useRef<boolean>(false);
	const wordSaid = useRef<boolean>(false);

	const handleStart = async () => {
		setDiscount(null);
		setError(null);
		setTranscript("");
		setVolume(0);
		setDuration(0);
		speakingRef.current = false;

		if (!navigator.mediaDevices?.getUserMedia) {
			setError("Your browser does not support audio recording.");
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamRef.current = stream;
			const recorder = new MediaRecorder(stream);
			chunksRef.current = [];
			setRecording(true);
			startTimeRef.current = Date.now();

			// Web Audio API for loudness
			audioContextRef.current = new window.AudioContext();
			const source = audioContextRef.current.createMediaStreamSource(stream);
			analyserRef.current = audioContextRef.current.createAnalyser();
			analyserRef.current.fftSize = 2048;
			source.connect(analyserRef.current);

			// Track loudness in real time
			let maxRMS = 0;
			let rmsSum = 0;
			let rmsCount = 0;

			const getRMS = (analyser: AnalyserNode) => {
				const arr = new Uint8Array(analyser.fftSize);
				analyser.getByteTimeDomainData(arr);
				let sum = 0;
				for (let i = 0; i < arr.length; i++) {
					const val = arr[i] - 128;
					sum += val * val;
				}
				return Math.sqrt(sum / arr.length) / 128;
			};

			const tickVolume = () => {
				if (!analyserRef.current) return;
				const rms = getRMS(analyserRef.current);
				setVolume(rms);
				if (rms > 0.12) {
					// threshold for "speaking"
					if (!speakingRef.current) {
						speakingRef.current = true;
						startTimeRef.current = Date.now();
					}
					maxRMS = Math.max(maxRMS, rms);
					rmsSum += rms;
					rmsCount++;
				} else {
					if (speakingRef.current) {
						speakingRef.current = false;
					}
				}
			};
			const volumeInterval = setInterval(tickVolume, 100);

			recorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					chunksRef.current.push(e.data);
				}
			};

			recorder.onstop = async () => {
				clearInterval(volumeInterval);
				setRecording(false);
				audioContextRef.current?.close();
				mediaStreamRef.current?.getTracks().forEach((t) => t.stop());

				if (chunksRef.current.length === 0) {
					setError("No audio recorded. Please try again.");
					return;
				}
				const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
				const formData = new FormData();
				formData.append("audio", audioBlob);
				// Send to backend
				setRunning(true);
				try {
					const res = await fetch("/api/transcribe", {
						method: "POST",
						body: formData,
					});
					const data = await res.json();
					setTranscript(data.transcript || "");

					// Fuzzy match
					const keywords = [
						"rectizza",
						"rectisa",
						"rectiza",
						"rectizzaa",
						"rectisaa",
						"rectisaaa",
					];
					const matched = keywords.some((word) =>
						(data.transcript || "").toLowerCase().includes(word)
					);
					wordSaid.current = matched;

					// Calculate discount
					const totalDuration = (
						(Date.now() - startTimeRef.current) /
						1000
					).toFixed(2);
					let finalDiscount = 0;
					if (matched) {
						// Calculate loudnessScore and durationScore
						const avgRMS = rmsCount > 0 ? rmsSum / rmsCount : 0;
						const loudnessScore = Math.min(avgRMS / 0.5, 1); // normalize to [0,1], assuming 0.5 is "max" loudness
						const durationScore = Math.min(Number(totalDuration) / 4, 1); // normalize to [0,1], 4s max
						// Weighted: 60% loudness, 40% duration
						finalDiscount = Math.round(
							(loudnessScore * 0.6 + durationScore * 0.4) * 50
						);
					}
					setDiscount(finalDiscount);
					setDuration(Number(totalDuration));
					if (!matched) {
						if (!data.transcript || data.transcript.trim() === "") {
							setError("🗣️ Please speak to win the discount!");
						} else {
							setError(
								`❌ Heard &quot;${data.transcript}&quot; — but only &quot;Rectizza&quot; (or close) unlocks flavor points!`
							);
						}
					}
				} catch {
					setError("Transcription failed. Please try again.");
				} finally {
					setRunning(false);
				}
			};

			recorder.start();
			setTimeout(() => {
				recorder.stop();
			}, 4000);
		} catch {
			setError("Could not access microphone. Please allow microphone access.");
		}
	};

	return (
		<main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#ffe8cc] to-[#fff] font-sans text-[#1f1f1f]">
			<header className="text-center py-6">
				<h1 className="text-5xl font-extrabold text-[#ff5722] tracking-tight drop-shadow-lg">
					RECTIZZA YELL CHALLENGE
				</h1>
				<p className="mt-2 text-sm text-[#333] uppercase">
					The louder and longer you shout, the more you save!
				</p>
			</header>

			<section className="bg-white shadow-2xl rounded-3xl px-8 py-10 w-full max-w-lg text-center relative">
				<div
					className={`rounded-full w-32 h-32 mx-auto flex items-center justify-center text-5xl font-bold transition-all duration-300 ${
						recording
							? "bg-[#d72638]/80 animate-pulse text-white"
							: "bg-[#ff5722] text-white"
					}`}
				>
					🎤
				</div>
				<p className="mt-4 text-base text-gray-700">
					Say <strong className="text-[#d72638]">&quot;Rectizza&quot;</strong>{" "}
					(or close) and hold it!
					<br />
					<span className="text-xs text-gray-500">
						Longer &amp; louder = bigger discount.
					</span>
				</p>

				<button
					onClick={handleStart}
					disabled={recording || running}
					className={`mt-6 w-full py-3 rounded-full font-semibold transition-all duration-200 ${
						recording || running
							? "bg-gray-300 text-gray-500 cursor-not-allowed"
							: "bg-[#ff5722] text-white hover:bg-[#e64a19]"
					}`}
				>
					{recording
						? "Recording…"
						: running
						? "Transcribing…"
						: "Start Challenge"}
				</button>

				{recording && (
					<div className="mt-4 text-[#d72638] text-xl font-bold animate-pulse">
						⏺ Recording…
					</div>
				)}
				{recording && (
					<div className="mt-2 text-[#ff5722] text-lg">
						Volume: {(volume * 100).toFixed(0)}%
					</div>
				)}
				{running && (
					<div className="mt-4 text-[#ff5722] text-xl font-bold animate-pulse">
						⏱ Transcribing…
					</div>
				)}

				{discount !== null && discount > 0 && (
					<div className="mt-6 bg-[#2ecc71]/10 border border-[#2ecc71] rounded-lg py-4 px-6 shadow text-[#2ecc71] font-semibold text-2xl">
						🎉 You unlocked{" "}
						<span className="font-extrabold">{discount}% OFF!</span>
						<br />
						<span className="text-base text-[#333]">
							({duration.toFixed(2)}s, transcript: &quot;{transcript}&quot;)
						</span>
					</div>
				)}

				{error && <div className="mt-6 text-red-600 font-medium">{error}</div>}
			</section>

			<footer className="mt-10 text-xs text-gray-500 text-center pb-6">
				© {new Date().getFullYear()} Rectizza. Crunch louder, save hotter. 🍕
			</footer>
		</main>
	);
}
