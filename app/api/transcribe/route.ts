import { NextResponse } from "next/server";
// import { SpeechClient } from "@google-cloud/speech";

// AssemblyAI API key should be set in your environment variables
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

export async function POST(req: Request) {
	const formData = await req.formData();
	const audio = formData.get("audio");

	if (!audio || !(audio instanceof Blob)) {
		return NextResponse.json({ error: "No audio uploaded" }, { status: 400 });
	}

	// Convert Blob to ArrayBuffer
	const buffer = await audio.arrayBuffer();
	const bufferSize = buffer.byteLength;
	const mimeType = audio.type || "unknown";
	// AssemblyAI expects raw binary data, not a Blob

	if (!ASSEMBLYAI_API_KEY) {
		return NextResponse.json(
			{ error: "AssemblyAI API key not set" },
			{ status: 500 }
		);
	}

	// Step 1: Upload audio to AssemblyAI
	const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
		method: "POST",
		headers: {
			authorization: ASSEMBLYAI_API_KEY,
			"content-type":
				mimeType === "unknown" ? "application/octet-stream" : mimeType,
		},
		body: Buffer.from(buffer), // Send raw binary data
	});
	if (!uploadRes.ok) {
		const errorText = await uploadRes.text();
		return NextResponse.json(
			{
				error: "Upload failed: " + errorText,
				bufferSize,
				mimeType,
			},
			{ status: 500 }
		);
	}
	const uploadData = await uploadRes.json();
	const audio_url = uploadData.upload_url;

	// Step 2: Request transcription
	const transcriptRes = await fetch(
		"https://api.assemblyai.com/v2/transcript",
		{
			method: "POST",
			headers: {
				authorization: ASSEMBLYAI_API_KEY,
				"content-type": "application/json",
			},
			body: JSON.stringify({ audio_url, language_code: "en" }),
		}
	);
	if (!transcriptRes.ok) {
		const errorText = await transcriptRes.text();
		return NextResponse.json(
			{ error: "Transcription request failed: " + errorText },
			{ status: 500 }
		);
	}
	const transcriptData = await transcriptRes.json();
	const transcriptId = transcriptData.id;

	// Step 3: Poll for completion (faster: 1s interval, max 10 tries)
	let transcriptText = "";
	for (let i = 0; i < 10; i++) {
		await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
		const pollRes = await fetch(
			`https://api.assemblyai.com/v2/transcript/${transcriptId}`,
			{
				headers: { authorization: ASSEMBLYAI_API_KEY },
			}
		);
		const pollData = await pollRes.json();
		if (pollData.status === "completed") {
			transcriptText = pollData.text;
			break;
		} else if (pollData.status === "failed") {
			return NextResponse.json(
				{ error: "Transcription failed" },
				{ status: 500 }
			);
		}
	}
	if (!transcriptText) {
		return NextResponse.json(
			{
				error:
					"Transcription still in progress. Please try again in a few seconds.",
			},
			{ status: 202 }
		);
	}
	return NextResponse.json({ transcript: transcriptText });
}
