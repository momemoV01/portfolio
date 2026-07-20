import { RigidBody } from '@react-three/rapier';
import type { Palette } from './villageState';

type Props = { palette: Palette };

const SIZE = 120;
const DIVISIONS = 60;

export default function Ground({ palette }: Props) {
	return (
		<>
			<RigidBody type="fixed" colliders="cuboid">
				<mesh receiveShadow position={[0, -0.05, 0]}>
					<boxGeometry args={[SIZE, 0.1, SIZE]} />
					<meshStandardMaterial color={palette.groundColor} roughness={1} metalness={0} />
				</mesh>
			</RigidBody>

			<gridHelper
				args={[SIZE, DIVISIONS, palette.gridMajor, palette.gridMinor]}
				position={[0, 0.01, 0]}
			/>
		</>
	);
}
