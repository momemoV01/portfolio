import { RigidBody } from '@react-three/rapier';

type Props = {
	position?: [number, number, number];
	rotation?: number;
};

const WALL = '#7a624a';
const ROOF = '#3e2818';
const DOOR = '#2a1d10';
const WINDOW = '#7fb5d8';

/** Simple blockout cabin — primitives only, for layout placement. */
export default function Cabin({ position = [0, 0, 0], rotation = 0 }: Props) {
	return (
		<group position={position} rotation={[0, rotation, 0]}>
			<RigidBody type="fixed" colliders="cuboid">
				{/* main body */}
				<mesh position={[0, 1.1, 0]} castShadow receiveShadow>
					<boxGeometry args={[3.0, 2.2, 2.6]} />
					<meshStandardMaterial color={WALL} roughness={0.95} />
				</mesh>
			</RigidBody>

			{/* roof — gable */}
			<mesh position={[0, 2.6, 0.7]} rotation={[Math.PI / 5, 0, 0]} castShadow>
				<boxGeometry args={[3.4, 0.12, 1.9]} />
				<meshStandardMaterial color={ROOF} roughness={0.9} />
			</mesh>
			<mesh position={[0, 2.6, -0.7]} rotation={[-Math.PI / 5, 0, 0]} castShadow>
				<boxGeometry args={[3.4, 0.12, 1.9]} />
				<meshStandardMaterial color={ROOF} roughness={0.9} />
			</mesh>
			{/* roof ridge cap */}
			<mesh position={[0, 3.16, 0]} castShadow>
				<boxGeometry args={[3.4, 0.08, 0.2]} />
				<meshStandardMaterial color={ROOF} roughness={0.9} />
			</mesh>

			{/* door (front face, +Z) */}
			<mesh position={[0, 0.65, 1.31]}>
				<planeGeometry args={[0.7, 1.3]} />
				<meshStandardMaterial color={DOOR} roughness={1} />
			</mesh>
			{/* window left */}
			<mesh position={[-0.9, 1.3, 1.31]}>
				<planeGeometry args={[0.55, 0.55]} />
				<meshStandardMaterial color={WINDOW} emissive={WINDOW} emissiveIntensity={0.05} />
			</mesh>
			{/* window right */}
			<mesh position={[0.9, 1.3, 1.31]}>
				<planeGeometry args={[0.55, 0.55]} />
				<meshStandardMaterial color={WINDOW} emissive={WINDOW} emissiveIntensity={0.05} />
			</mesh>
			{/* chimney */}
			<mesh position={[1.0, 3.4, 0]} castShadow>
				<boxGeometry args={[0.32, 0.7, 0.32]} />
				<meshStandardMaterial color={ROOF} roughness={0.95} />
			</mesh>
		</group>
	);
}
