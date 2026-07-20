import { useEffect, useRef, type MutableRefObject } from 'react';
import { TREES, FENCE_RADIUS } from './villageLayout';

export type PlayerPos = { x: number; z: number; yaw: number };

type Props = {
	playerPosRef: MutableRefObject<PlayerPos>;
};

const MAP_WORLD_HALF = 32; // worlds units shown from center
const SIZE = 168;

const STATIC_PROPS: Array<{ kind: 'board' | 'cabin' | 'well' | 'lantern'; x: number; z: number }> = [
	{ kind: 'board', x: 0, z: -3 },
	{ kind: 'cabin', x: -7, z: 2 },
	{ kind: 'well', x: 5.5, z: 1 },
	{ kind: 'lantern', x: -2.4, z: -2.6 },
	{ kind: 'lantern', x: 2.4, z: -2.6 },
];

export default function Minimap({ playerPosRef }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = SIZE * dpr;
		canvas.height = SIZE * dpr;
		ctx.scale(dpr, dpr);

		const worldToMap = (x: number, z: number) => {
			const px = ((x + MAP_WORLD_HALF) / (MAP_WORLD_HALF * 2)) * SIZE;
			const py = ((z + MAP_WORLD_HALF) / (MAP_WORLD_HALF * 2)) * SIZE;
			return [px, py] as const;
		};

		let raf = 0;
		const draw = () => {
			ctx.clearRect(0, 0, SIZE, SIZE);

			// background
			ctx.fillStyle = 'rgba(10, 10, 10, 0.78)';
			ctx.fillRect(0, 0, SIZE, SIZE);

			// inner grid (world 4m squares)
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
			ctx.lineWidth = 1;
			const step = (4 / (MAP_WORLD_HALF * 2)) * SIZE;
			ctx.beginPath();
			for (let i = 0; i <= MAP_WORLD_HALF * 2; i += 4) {
				const p = worldToMap(i - MAP_WORLD_HALF, -MAP_WORLD_HALF);
				ctx.moveTo(p[0], 0);
				ctx.lineTo(p[0], SIZE);
				ctx.moveTo(0, p[0]);
				ctx.lineTo(SIZE, p[0]);
			}
			ctx.stroke();
			void step;

			// fence rect
			const [fx0, fy0] = worldToMap(-FENCE_RADIUS, -FENCE_RADIUS);
			const [fx1, fy1] = worldToMap(FENCE_RADIUS, FENCE_RADIUS);
			ctx.strokeStyle = 'rgba(163, 230, 53, 0.35)';
			ctx.lineWidth = 1;
			ctx.strokeRect(fx0, fy0, fx1 - fx0, fy1 - fy0);

			// fence south gate (gap)
			ctx.strokeStyle = 'rgba(10, 10, 10, 1)';
			ctx.lineWidth = 2;
			const [gx0] = worldToMap(-3, FENCE_RADIUS);
			const [gx1] = worldToMap(3, FENCE_RADIUS);
			ctx.beginPath();
			ctx.moveTo(gx0, fy1);
			ctx.lineTo(gx1, fy1);
			ctx.stroke();

			// trees
			ctx.fillStyle = 'rgba(60, 100, 70, 0.65)';
			for (const t of TREES) {
				const [px, py] = worldToMap(t.pos[0], t.pos[2]);
				ctx.beginPath();
				ctx.arc(px, py, 1.6 * t.scale, 0, Math.PI * 2);
				ctx.fill();
			}

			// static props
			for (const p of STATIC_PROPS) {
				const [px, py] = worldToMap(p.x, p.z);
				if (p.kind === 'board') {
					ctx.fillStyle = '#a3e635';
					ctx.fillRect(px - 3, py - 3, 6, 6);
				} else if (p.kind === 'cabin') {
					ctx.fillStyle = '#a78b6a';
					ctx.fillRect(px - 4, py - 3, 8, 6);
				} else if (p.kind === 'well') {
					ctx.fillStyle = '#7fb5d8';
					ctx.beginPath();
					ctx.arc(px, py, 3, 0, Math.PI * 2);
					ctx.fill();
				} else if (p.kind === 'lantern') {
					ctx.fillStyle = '#fde68a';
					ctx.beginPath();
					ctx.arc(px, py, 1.5, 0, Math.PI * 2);
					ctx.fill();
				}
			}

			// player as direction triangle
			const { x, z, yaw } = playerPosRef.current;
			const [px, py] = worldToMap(x, z);
			ctx.save();
			ctx.translate(px, py);
			ctx.rotate(yaw);
			ctx.fillStyle = '#f4f4f5';
			ctx.beginPath();
			ctx.moveTo(0, -6);
			ctx.lineTo(4, 4);
			ctx.lineTo(-4, 4);
			ctx.closePath();
			ctx.fill();
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();

			// north indicator
			ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
			ctx.font = '10px ui-monospace, Menlo, monospace';
			ctx.textAlign = 'center';
			ctx.fillText('N', SIZE / 2, 12);

			raf = requestAnimationFrame(draw);
		};
		draw();
		return () => cancelAnimationFrame(raf);
	}, [playerPosRef]);

	return (
		<div
			style={{
				position: 'absolute',
				bottom: 16,
				right: 16,
				border: '1px solid rgba(163, 230, 53, 0.3)',
				borderRadius: '4px',
				padding: '4px',
				background: 'rgba(10, 10, 10, 0.6)',
				backdropFilter: 'blur(4px)',
				fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
			}}
		>
			<div
				style={{
					fontSize: '10px',
					color: '#71717a',
					padding: '2px 4px 4px',
					letterSpacing: '0.06em',
				}}
			>
				$ minimap
			</div>
			<canvas
				ref={canvasRef}
				style={{
					width: SIZE,
					height: SIZE,
					display: 'block',
					borderRadius: '2px',
				}}
			/>
		</div>
	);
}
