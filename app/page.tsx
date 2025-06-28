"use client";
import React, { useRef, useState } from "react";

export default function Home() {
	const [running, setRunning] = useState(false);
	const [countdown, setCountdown] = useState(4);
	const [discount, setDiscount] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const startTime = useRef<number>(0);
	const wordSaid = useRef<boolean>(false);

	const handleStart = () => {
		setDiscount(null);
		setError(null);
		setCountdown(4);

		const SpeechRecognition =
			(typeof window !== "undefined" && (window as any).SpeechRecognition) ||
			(window as any).webkitSpeechRecognition;

		if (!SpeechRecognition) {
			setError("Speech recognition not supported.");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "en-US";
		recognition.continuous = false;

		recognition.onresult = (event: any) => {
			const spoken = event.results[0][0].transcript.toLowerCase().trim();
			if (spoken.includes("hello".toLocaleLowerCase())) {
				wordSaid.current = true;
				startTime.current = Date.now();
				runCountdown();
			} else {
				wordSaid.current = false;
				setError(
					`❌ Heard "${spoken}" — but only "Rectizza" unlocks flavor points!`
				);
			}
		};

		recognition.onerror = () => setError("Speech recognition failed.");

		recognition.start();
	};

	const runCountdown = () => {
		setRunning(true);
		let duration = 4;
		let tick = 4;
		setCountdown(tick);

		const timer = setInterval(() => {
			tick--;
			setCountdown(tick);
			if (tick <= 0) clearInterval(timer);
		}, 1000);

		setTimeout(() => {
			const spokenDuration = (Date.now() - startTime.current) / 1000;
			setRunning(false);

			if (!wordSaid.current || spokenDuration < 2) {
				setError(
					'🛑 Say "Rectizza" and hold it at least 2 seconds to earn a discount!'
				);
				return;
			}

			const finalDiscount = Math.min(50, Math.floor(spokenDuration * 10));
			setDiscount(finalDiscount);
		}, duration * 1000);
	};

	return (
		<main className="min-h-screen flex flex-col items-center bg-[#ffe8cc] font-sans text-[#1f1f1f]">
			{/* 🔥 Top Header */}
			<header className="text-center py-6">
				<h1 className="text-5xl font-extrabold text-[#ff5722] tracking-tight">
					RECTIZZA YELL CHALLENGE
				</h1>
				<p className="mt-2 text-sm text-[#333] uppercase">
					The louder you shout, the more you save
				</p>
			</header>

			{/* 🎤 Voice Capture Card */}
			<section className="bg-white shadow-lg rounded-3xl px-6 py-8 w-full max-w-md text-center relative">
				<div
					className={`rounded-full w-28 h-28 mx-auto flex items-center justify-center text-4xl font-bold transition-all duration-300 ${
						running
							? "bg-[#d72638]/80 animate-pulse text-white"
							: "bg-[#ff5722] text-white"
					}`}
				>
					🎤
				</div>

				<p className="mt-4 text-sm text-gray-600">
					Say <strong>"Rectizza"</strong> and hold it! The longer you shout, the
					bigger the bite.
				</p>

				<button
					onClick={handleStart}
					disabled={running}
					className={`mt-6 w-full py-3 rounded-full font-semibold transition-all duration-200 ${
						running
							? "bg-gray-300 text-gray-500 cursor-not-allowed"
							: "bg-[#ff5722] text-white hover:bg-[#e64a19]"
					}`}
				>
					{running ? "Listening…" : "Start Challenge"}
				</button>

				{running && (
					<div className="mt-4 text-[#ff5722] text-xl font-bold animate-pulse">
						⏱ {countdown}s
					</div>
				)}

				{discount !== null && (
					<div className="mt-6 bg-[#2ecc71]/10 border border-[#2ecc71] rounded-lg py-4 px-6 shadow text-[#2ecc71] font-semibold text-2xl">
						🎉 You unlocked {discount}% OFF!
					</div>
				)}

				{error && <div className="mt-6 text-red-600 font-medium">{error}</div>}
			</section>

			{/* 📍 Footer */}
			<footer className="mt-10 text-xs text-gray-500 text-center pb-6">
				© {new Date().getFullYear()} Rectizza. Crunch louder, save hotter. 🍕
			</footer>
		</main>
	);
}
