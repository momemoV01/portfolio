import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import Player from './Player';
import Ground from './Ground';
import BulletinBoard from './BulletinBoard';
import Trees from './Trees';
import Fence from './Fence';
import Lantern from './Lantern';
import Cabin from './Cabin';
import Well from './Well';
import Path from './Path';
import Mountains from './Mountains';
import Minimap, { type PlayerPos } from './Minimap';
import { PALETTES, type TimeOfDay } from './villageState';
import type { MutableRefObject } from 'react';

type SceneProps = { mode: TimeOfDay; playerPosRef: MutableRefObject<PlayerPos> };

function Scene({ mode, playerPosRef }: SceneProps) {
	const palette = PALETTES[mode];
	const fog = useMemo(
		() => new THREE.Fog(palette.fogColor, palette.fogNear, palette.fogFar),
		[palette.fogColor, palette.fogNear, palette.fogFar],
	);
	const bg = useMemo(() => new THREE.Color(palette.bg), [palette.bg]);

	return (
		<>
			<primitive attach="fog" object={fog} />
			<primitive attach="background" object={bg} />

			<ambientLight intensity={palette.ambient} />
			<directionalLight
				position={[6, 12, 6]}
				intensity={palette.keyIntensity}
				color={palette.keyColor}
				castShadow
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
				shadow-camera-left={-15}
				shadow-camera-right={15}
				shadow-camera-top={15}
				shadow-camera-bottom={-15}
				shadow-camera-near={0.5}
				shadow-camera-far={40}
			/>
			{palette.rimIntensity > 0 && (
				<pointLight
					position={[-6, 3, -2]}
					intensity={palette.rimIntensity}
					color={palette.rimColor}
					distance={14}
				/>
			)}

			{palette.showStars && (
				<Stars radius={80} depth={40} count={1500} factor={3} saturation={0} fade speed={0.4} />
			)}

			<Mountains />

			<Suspense fallback={null}>
				<Physics gravity={[0, -16, 0]}>
					<Ground palette={palette} />
					<Path />
					<Fence />
					<Trees />
					<Cabin position={[-7, 0, 2]} rotation={Math.PI / 5} />
					<Well position={[5.5, 0, 1]} />
					<Lantern position={[-2.4, 0, -2.6]} mode={mode} />
					<Lantern position={[2.4, 0, -2.6]} mode={mode} />
					<Player playerPosRef={playerPosRef} />
					<BulletinBoard />
				</Physics>
			</Suspense>
		</>
	);
}

export default function Village() {
	const [mode, setMode] = useState<TimeOfDay>('night');
	const playerPosRef = useRef<PlayerPos>({ x: 0, z: 5, yaw: 0 });

	// Persist user choice across reloads
	useEffect(() => {
		try {
			const saved = localStorage.getItem('village.mode');
			if (saved === 'day' || saved === 'night') setMode(saved);
		} catch {}
	}, []);

	const toggle = () => {
		const next: TimeOfDay = mode === 'night' ? 'day' : 'night';
		setMode(next);
		try {
			localStorage.setItem('village.mode', next);
		} catch {}
	};

	return (
		<>
			<Canvas
				shadows
				dpr={[1, 2]}
				camera={{ position: [0, 5, 12], fov: 55, near: 0.1, far: 250 }}
				gl={{ antialias: true }}
			>
				<Scene mode={mode} playerPosRef={playerPosRef} />
			</Canvas>

			{/* HUD */}
			<div
				style={{
					position: 'absolute',
					top: 16,
					left: 16,
					fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
					fontSize: '12px',
					color: '#a3e635',
					background: 'rgba(10, 10, 10, 0.6)',
					border: '1px solid rgba(163, 230, 53, 0.3)',
					padding: '8px 12px',
					borderRadius: '4px',
					letterSpacing: '0.04em',
					pointerEvents: 'none',
					backdropFilter: 'blur(4px)',
				}}
			>
				<div style={{ color: '#71717a', fontSize: '10px', marginBottom: '4px' }}>$ village.run</div>
				<div>WASD / 방향키 — 이동</div>
				<div>Shift — 달리기</div>
				<div>마우스 드래그 — 카메라 회전</div>
				<div>게시판에 가까이 가서 읽기</div>
			</div>

			{/* Day/night toggle */}
			<div
				style={{
					position: 'absolute',
					top: 16,
					right: 100,
					display: 'flex',
					gap: 4,
					fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
					fontSize: '12px',
					background: 'rgba(10, 10, 10, 0.6)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					borderRadius: '4px',
					padding: '4px',
					backdropFilter: 'blur(4px)',
				}}
			>
				<button
					type="button"
					onClick={() => mode !== 'night' && toggle()}
					style={{
						background: mode === 'night' ? 'rgba(163, 230, 53, 0.18)' : 'transparent',
						color: mode === 'night' ? '#a3e635' : '#a1a1aa',
						border: 'none',
						padding: '4px 10px',
						borderRadius: '3px',
						cursor: 'pointer',
						fontFamily: 'inherit',
						fontSize: 'inherit',
						letterSpacing: '0.04em',
					}}
					aria-pressed={mode === 'night'}
				>
					◑ night
				</button>
				<button
					type="button"
					onClick={() => mode !== 'day' && toggle()}
					style={{
						background: mode === 'day' ? 'rgba(253, 230, 138, 0.22)' : 'transparent',
						color: mode === 'day' ? '#fde68a' : '#a1a1aa',
						border: 'none',
						padding: '4px 10px',
						borderRadius: '3px',
						cursor: 'pointer',
						fontFamily: 'inherit',
						fontSize: 'inherit',
						letterSpacing: '0.04em',
					}}
					aria-pressed={mode === 'day'}
				>
					☀ day
				</button>
			</div>

			<Minimap playerPosRef={playerPosRef} />

			<a
				href="/"
				style={{
					position: 'absolute',
					top: 16,
					right: 16,
					fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
					fontSize: '12px',
					color: '#e4e4e7',
					background: 'rgba(10, 10, 10, 0.6)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					padding: '8px 12px',
					borderRadius: '4px',
					textDecoration: 'none',
					backdropFilter: 'blur(4px)',
				}}
			>
				← exit
			</a>
		</>
	);
}
