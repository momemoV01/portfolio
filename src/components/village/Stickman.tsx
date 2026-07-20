import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
	speedRef: MutableRefObject<number>;
};

const WHITE = '#f4f4f5';
const MOVE_THRESHOLD = 0.05;

export default function Stickman({ speedRef }: Props) {
	const leftLeg = useRef<THREE.Group>(null);
	const rightLeg = useRef<THREE.Group>(null);
	const leftArm = useRef<THREE.Group>(null);
	const rightArm = useRef<THREE.Group>(null);
	const root = useRef<THREE.Group>(null);
	const phase = useRef(0);

	useFrame((_, dt) => {
		const speed = speedRef.current;
		const moving = Math.min(speed / 3, 1);
		const isMoving = moving > MOVE_THRESHOLD;

		if (isMoving) {
			// Sprint detection by raw speed → faster cadence + bigger swing
			const isSprinting = speed > 5;
			const cadence = isSprinting ? 1.6 : 1.0;
			const amp = isSprinting ? 1.25 : 1.0;

			phase.current += dt * (4 + moving * 6) * cadence;
			const legSwing = Math.sin(phase.current) * (0.3 + moving * 0.7) * amp;
			const armSwing = Math.sin(phase.current) * (0.2 + moving * 0.5) * amp;
			const bob = Math.abs(Math.sin(phase.current)) * 0.04 * moving * amp;

			if (leftLeg.current) leftLeg.current.rotation.x = legSwing;
			if (rightLeg.current) rightLeg.current.rotation.x = -legSwing;
			if (leftArm.current) leftArm.current.rotation.x = -armSwing;
			if (rightArm.current) rightArm.current.rotation.x = armSwing;
			if (root.current) root.current.position.y = bob;
		} else {
			// Idle — lerp limbs back to neutral, then stay still
			const k = 1 - Math.pow(0.0005, dt);
			if (leftLeg.current) leftLeg.current.rotation.x += (0 - leftLeg.current.rotation.x) * k;
			if (rightLeg.current) rightLeg.current.rotation.x += (0 - rightLeg.current.rotation.x) * k;
			if (leftArm.current) leftArm.current.rotation.x += (0 - leftArm.current.rotation.x) * k;
			if (rightArm.current) rightArm.current.rotation.x += (0 - rightArm.current.rotation.x) * k;
			if (root.current) root.current.position.y += (0 - root.current.position.y) * k;
		}
	});

	return (
		<group ref={root}>
			<mesh position={[0, 1.55, 0]} castShadow>
				<sphereGeometry args={[0.18, 16, 16]} />
				<meshStandardMaterial color={WHITE} roughness={0.6} />
			</mesh>

			<mesh position={[0, 1.05, 0]} castShadow>
				<capsuleGeometry args={[0.08, 0.5, 4, 12]} />
				<meshStandardMaterial color={WHITE} roughness={0.6} />
			</mesh>

			<group ref={leftArm} position={[-0.18, 1.25, 0]}>
				<mesh position={[0, -0.25, 0]} castShadow>
					<capsuleGeometry args={[0.05, 0.4, 4, 8]} />
					<meshStandardMaterial color={WHITE} roughness={0.6} />
				</mesh>
			</group>

			<group ref={rightArm} position={[0.18, 1.25, 0]}>
				<mesh position={[0, -0.25, 0]} castShadow>
					<capsuleGeometry args={[0.05, 0.4, 4, 8]} />
					<meshStandardMaterial color={WHITE} roughness={0.6} />
				</mesh>
			</group>

			<group ref={leftLeg} position={[-0.09, 0.75, 0]}>
				<mesh position={[0, -0.3, 0]} castShadow>
					<capsuleGeometry args={[0.06, 0.5, 4, 8]} />
					<meshStandardMaterial color={WHITE} roughness={0.6} />
				</mesh>
			</group>

			<group ref={rightLeg} position={[0.09, 0.75, 0]}>
				<mesh position={[0, -0.3, 0]} castShadow>
					<capsuleGeometry args={[0.06, 0.5, 4, 8]} />
					<meshStandardMaterial color={WHITE} roughness={0.6} />
				</mesh>
			</group>
		</group>
	);
}
