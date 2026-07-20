import { useState } from 'react';
import { Html } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import AboutPaper from './AboutPaper';

const POSITION: [number, number, number] = [0, 0, -3];
const TRIGGER_RADIUS = 2.2;

const WOOD = '#6b4f2a';
const WOOD_DARK = '#3e2d18';
const PAPER = '#e8dfc4';

export default function BulletinBoard() {
	const [near, setNear] = useState(false);

	return (
		<group position={POSITION}>
			{/* fixed colliders for the posts (so player can't walk through) */}
			<RigidBody type="fixed" colliders="cuboid">
				<mesh position={[-0.55, 0.9, 0]} castShadow>
					<boxGeometry args={[0.12, 1.8, 0.12]} />
					<meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
				</mesh>
				<mesh position={[0.55, 0.9, 0]} castShadow>
					<boxGeometry args={[0.12, 1.8, 0.12]} />
					<meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
				</mesh>
			</RigidBody>

			{/* board face — no physics, decorative */}
			<group>
				{/* wooden frame */}
				<mesh position={[0, 1.65, 0]} castShadow>
					<boxGeometry args={[1.5, 1.0, 0.08]} />
					<meshStandardMaterial color={WOOD} roughness={0.85} />
				</mesh>
				{/* paper background */}
				<mesh position={[0, 1.65, 0.045]}>
					<planeGeometry args={[1.3, 0.82]} />
					<meshStandardMaterial color={PAPER} roughness={0.95} />
				</mesh>
				{/* roof */}
				<mesh position={[0, 2.22, 0]} rotation={[0, 0, 0]} castShadow>
					<boxGeometry args={[1.7, 0.06, 0.4]} />
					<meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
				</mesh>
				<mesh position={[0, 2.27, 0.12]} rotation={[Math.PI / 8, 0, 0]} castShadow>
					<boxGeometry args={[1.7, 0.06, 0.3]} />
					<meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
				</mesh>
				<mesh position={[0, 2.27, -0.12]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
					<boxGeometry args={[1.7, 0.06, 0.3]} />
					<meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
				</mesh>
			</group>

			{/* sensor — proximity trigger */}
			<RigidBody type="fixed" colliders={false} sensor>
				<CuboidCollider
					args={[TRIGGER_RADIUS, 1.5, TRIGGER_RADIUS]}
					position={[0, 1.5, 1.2]}
					sensor
					onIntersectionEnter={(e) => {
						if (e.rigidBodyObject?.name === 'player') setNear(true);
					}}
					onIntersectionExit={(e) => {
						if (e.rigidBodyObject?.name === 'player') setNear(false);
					}}
				/>
			</RigidBody>

			{/* hint label — only when not near */}
			{!near && (
				<Html position={[0, 2.7, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
					<div
						style={{
							fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
							fontSize: '11px',
							color: '#a3e635',
							background: 'rgba(10, 10, 10, 0.7)',
							padding: '4px 10px',
							border: '1px solid #a3e635',
							borderRadius: '3px',
							whiteSpace: 'nowrap',
							textShadow: '0 0 8px rgba(163, 230, 53, 0.4)',
						}}
					>
						about · 가까이 가서 읽기
					</div>
				</Html>
			)}

			<AboutPaper visible={near} />
		</group>
	);
}
