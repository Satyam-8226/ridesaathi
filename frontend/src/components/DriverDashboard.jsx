import React, { useState, useRef } from 'react';
import '../styles/overlay.css';

export default function DriverDashboard(props) {
	const [passengersOpen, setPassengersOpen] = useState(false);

	// New: auto-centric / live ride state
	const [liveMode, setLiveMode] = useState(true); // default to live/auto-centric
	const [from, setFrom] = useState(''); // optional current route start
	const [to, setTo] = useState(''); // optional destination hint
	const [liveActive, setLiveActive] = useState(false);
	const watchIdRef = useRef(null);

	// Start streaming driver location (replace console.log with socket/REST emit)
	const startLiveRide = () => {
		if (!navigator.geolocation) {
			alert('Geolocation not supported in this browser.');
			return;
		}
		const id = navigator.geolocation.watchPosition(
			(pos) => {
				const payload = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					timestamp: pos.timestamp,
					from,
					to,
					mode: 'auto_live',
				};
				// TODO: emit payload via socket.io or POST to /api/rides/live
				console.log('LIVE LOCATION ->', payload);
			},
			(err) => console.warn('geo error', err),
			{ enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
		);
		watchIdRef.current = id;
		setLiveActive(true);
	};

	const stopLiveRide = () => {
		if (watchIdRef.current != null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		setLiveActive(false);
		// TODO: notify backend that live ride ended
		console.log('Live ride stopped');
	};

	return (
		<>
			{/* backdrop to capture clicks outside the panel and keep blurred content non-interactive */}
			{passengersOpen && (
				<div
					className="passengers-backdrop"
					onClick={() => setPassengersOpen(false)}
					aria-hidden="true"
				/>
			)}

			{/* Main driver UI: add app-blurred when panel open */}
			<div className={passengersOpen ? 'app-blurred' : ''} aria-hidden={passengersOpen}>
				{/* ...existing code... */}

				<header>
					{/* ...existing header code... */}
					<button
						onClick={() => setPassengersOpen(true)}
						aria-expanded={passengersOpen}
						aria-controls="passengers-panel"
					>
						Passengers
					</button>
				</header>

				{/* Replace/create-ride section: auto-centric live flow */}
				<section style={{ padding: 12 }}>
					<h3>Create Auto (Live) Ride</h3>

					<label style={{ display: 'block', marginTop: 8 }}>
						<input
							type="checkbox"
							checked={liveMode}
							onChange={(e) => setLiveMode(e.target.checked)}
						/>{' '}
						Live Auto Mode (broadcast current location)
					</label>

					{/* from/to are optional hints -- date/time removed for auto-centric flow */}
					<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
						<input
							placeholder="From (optional)"
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							style={{ flex: 1, padding: 8 }}
						/>
						<input
							placeholder="To (optional)"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							style={{ flex: 1, padding: 8 }}
						/>
					</div>

					<div style={{ marginTop: 10 }}>
						{liveActive ? (
							<>
								<span style={{ color: 'green', marginRight: 8 }}>Live: ON</span>
								<button onClick={stopLiveRide}>Stop Live Ride</button>
							</>
						) : (
							<button onClick={startLiveRide}>
								Start Live Ride {liveMode ? '(Auto-centric)' : ''}
							</button>
						)}
					</div>

					{/*
						...existing create-ride code...
						- Remove or ignore any date/time inputs here in favor of live updates above.
						- Integrate startLiveRide/stopLiveRide with backend (socket emit / REST) where indicated.
					*/}
				</section>

				{/* ...existing main dashboard UI... */}
			</div>

			{/* Passengers panel (fixed, interactive) */}
			<aside
				id="passengers-panel"
				className={`passengers-panel ${passengersOpen ? '' : 'hidden'}`}
				role="dialog"
				aria-modal="true"
			>
				<div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}}>
					<h3>Passengers</h3>
					<button className="passengers-close" onClick={() => setPassengersOpen(false)} aria-label="Close passengers panel">
						✕
					</button>
				</div>

				{/* ...existing passengers list / content goes here ... */}
				<div style={{padding:12}}>
					{/* ...existing code... */}
					{/* passengers content */}
				</div>
			</aside>
		</>
	);
}