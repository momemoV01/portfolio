import type { TimeOfDay } from './villageState';

type Props = {
	position: [number, number, number];
	mode: TimeOfDay;
};

const POST = '#2a1d10';
const GLASS = '#fde68a';

export default function Lantern({ position, mode }: Props) {
	const lit = mode === 'night';
	return (
		<group position={position}>
			<mesh position={[0, 1.0, 0]} castShadow>
				<cylinderGeometry args={[0.04, 0.05, 2.0, 6]} />
				<meshStandardMaterial color={POST} roughness={1} />
			</mesh>
			<mesh position={[0.18, 1.95, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
				<cylinderGeometry args={[0.025, 0.025, 0.36, 6]} />
				<meshStandardMaterial color={POST} roughness={1} />
			</mesh>
			<mesh position={[0.36, 1.85, 0]}>
				<boxGeometry args={[0.18, 0.22, 0.18]} />
				<meshStandardMaterial
					color={GLASS}
					emissive={GLASS}
					emissiveIntensity={lit ? 1.4 : 0.05}
				/>
			</mesh>
			{lit && <pointLight position={[0.36, 1.85, 0]} intensity={0.7} distance={6} color={GLASS} />}
		</group>
	);
}
