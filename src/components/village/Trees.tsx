import { RigidBody } from '@react-three/rapier';
import { TREES } from './villageLayout';

const TRUNK = '#2a1d10';
const FOLIAGE = '#1f2a22';

export default function Trees() {
	return (
		<group>
			{TREES.map((t, i) => (
				<RigidBody key={i} type="fixed" colliders="cuboid" position={t.pos} rotation={[0, t.rot, 0]}>
					<group scale={t.scale}>
						<mesh position={[0, 0.6, 0]} castShadow>
							<cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
							<meshStandardMaterial color={TRUNK} roughness={1} />
						</mesh>
						<mesh position={[0, 1.6, 0]} castShadow>
							<coneGeometry args={[0.95, 1.4, 7]} />
							<meshStandardMaterial color={FOLIAGE} roughness={0.95} />
						</mesh>
						<mesh position={[0, 2.35, 0]} castShadow>
							<coneGeometry args={[0.7, 1.1, 7]} />
							<meshStandardMaterial color={FOLIAGE} roughness={0.95} />
						</mesh>
						<mesh position={[0, 3.0, 0]} castShadow>
							<coneGeometry args={[0.45, 0.8, 7]} />
							<meshStandardMaterial color={FOLIAGE} roughness={0.95} />
						</mesh>
					</group>
				</RigidBody>
			))}
		</group>
	);
}
