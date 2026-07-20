import { RigidBody } from '@react-three/rapier';

type Props = {
	position?: [number, number, number];
};

const STONE = '#6a6a6e';
const STONE_DARK = '#3e3e42';
const WOOD = '#3e2d18';
const WATER = '#0e2433';

export default function Well({ position = [0, 0, 0] }: Props) {
	return (
		<group position={position}>
			<RigidBody type="fixed" colliders="cuboid">
				{/* base ring (4 stone segments arranged as low octagon-ish) */}
				<mesh position={[0, 0.3, 0]} castShadow receiveShadow>
					<cylinderGeometry args={[0.7, 0.75, 0.6, 12]} />
					<meshStandardMaterial color={STONE} roughness={0.95} />
				</mesh>
				{/* support posts */}
				<mesh position={[-0.6, 1.1, 0]} castShadow>
					<boxGeometry args={[0.1, 1.4, 0.1]} />
					<meshStandardMaterial color={WOOD} roughness={1} />
				</mesh>
				<mesh position={[0.6, 1.1, 0]} castShadow>
					<boxGeometry args={[0.1, 1.4, 0.1]} />
					<meshStandardMaterial color={WOOD} roughness={1} />
				</mesh>
			</RigidBody>

			{/* water (dark inset, no collider) */}
			<mesh position={[0, 0.55, 0]}>
				<cylinderGeometry args={[0.55, 0.55, 0.02, 12]} />
				<meshStandardMaterial color={WATER} roughness={0.3} metalness={0.1} />
			</mesh>

			{/* roof — pyramid */}
			<mesh position={[0, 2.0, 0]} castShadow>
				<coneGeometry args={[0.95, 0.6, 4]} />
				<meshStandardMaterial color={STONE_DARK} roughness={0.85} />
			</mesh>

			{/* crossbeam */}
			<mesh position={[0, 1.7, 0]} castShadow>
				<boxGeometry args={[1.4, 0.08, 0.08]} />
				<meshStandardMaterial color={WOOD} roughness={1} />
			</mesh>

			{/* bucket on rope */}
			<mesh position={[0, 1.4, 0]} castShadow>
				<cylinderGeometry args={[0.12, 0.12, 0.18, 8]} />
				<meshStandardMaterial color={WOOD} roughness={1} />
			</mesh>
			<mesh position={[0, 1.55, 0]}>
				<cylinderGeometry args={[0.005, 0.005, 0.3, 4]} />
				<meshStandardMaterial color="#1a1a1a" />
			</mesh>
		</group>
	);
}
