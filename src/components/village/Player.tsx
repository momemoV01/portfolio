import { useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Stickman from './Stickman';
import { usePlayerInput } from './usePlayerInput';
import { useCameraDrag } from './useCameraDrag';
import type { PlayerPos } from './Minimap';

const WALK_SPEED = 4;
const RUN_SPEED = 7;
const TURN_LERP = 0.18;
const INITIAL_DISTANCE = Math.hypot(4.5, 6.5);
const INITIAL_PITCH = Math.atan2(4.5, 6.5);

type Props = {
	playerPosRef: MutableRefObject<PlayerPos>;
};

export default function Player({ playerPosRef }: Props) {
	const body = useRef<RapierRigidBody>(null);
	const stickmanGroup = useRef<THREE.Group>(null);
	const input = usePlayerInput();
	const orbit = useCameraDrag({ yaw: 0, pitch: INITIAL_PITCH, distance: INITIAL_DISTANCE });
	const { camera } = useThree();

	const speedRef = useRef(0);
	const targetYaw = useRef(0);
	const currentYaw = useRef(0);
	const tmp = new THREE.Vector3();
	const offset = new THREE.Vector3();
	const camTarget = new THREE.Vector3();
	const lookTarget = new THREE.Vector3();
	const lookCurrent = new THREE.Vector3();
	const initialized = useRef(false);

	useFrame((_, dt) => {
		if (!body.current || !stickmanGroup.current) return;

		// Camera-relative movement (W = away from camera, etc.)
		const { forward, right, sprint } = input.current;
		const len = Math.hypot(forward, right);
		const camYaw = orbit.current.yaw;
		const sinY = Math.sin(camYaw);
		const cosY = Math.cos(camYaw);

		let wx = 0, wz = 0;
		if (len > 0) {
			const f = forward / len;
			const r = right / len;
			wx = f * (-sinY) + r * cosY;
			wz = f * (-cosY) + r * (-sinY);
		}

		const targetSpeed = sprint ? RUN_SPEED : WALK_SPEED;
		const vx = wx * targetSpeed;
		const vz = wz * targetSpeed;

		const cur = body.current.linvel();
		body.current.setLinvel({ x: vx, y: cur.y, z: vz }, true);

		speedRef.current = Math.hypot(vx, vz);

		if (len > 0) {
			targetYaw.current = Math.atan2(wx, wz);
		}

		let delta = targetYaw.current - currentYaw.current;
		while (delta > Math.PI) delta -= Math.PI * 2;
		while (delta < -Math.PI) delta += Math.PI * 2;
		currentYaw.current += delta * TURN_LERP;
		stickmanGroup.current.rotation.y = currentYaw.current;

		const wrap = stickmanGroup.current.parent;
		if (!wrap) return;
		wrap.getWorldPosition(camTarget);

		// Publish position for minimap and other consumers
		playerPosRef.current.x = camTarget.x;
		playerPosRef.current.z = camTarget.z;
		playerPosRef.current.yaw = currentYaw.current;

		// Spherical → cartesian for orbit offset
		const { yaw, pitch, distance } = orbit.current;
		const cp = Math.cos(pitch);
		offset.set(distance * cp * Math.sin(yaw), distance * Math.sin(pitch), distance * cp * Math.cos(yaw));

		const k = 1 - Math.pow(0.001, dt);
		tmp.copy(offset).add(camTarget);

		if (!initialized.current) {
			camera.position.copy(tmp);
			lookCurrent.set(camTarget.x, camTarget.y + 1, camTarget.z);
			initialized.current = true;
		} else {
			camera.position.lerp(tmp, k);
		}

		lookTarget.set(camTarget.x, camTarget.y + 1, camTarget.z);
		lookCurrent.lerp(lookTarget, k);
		camera.lookAt(lookCurrent);
	});

	return (
		<RigidBody
			ref={body}
			name="player"
			colliders={false}
			type="dynamic"
			position={[0, 1, 5]}
			enabledRotations={[false, false, false]}
			linearDamping={4}
			mass={1}
		>
			<CapsuleCollider args={[0.5, 0.25]} />
			<group ref={stickmanGroup} position={[0, -0.75, 0]}>
				<Stickman speedRef={speedRef} />
			</group>
		</RigidBody>
	);
}
