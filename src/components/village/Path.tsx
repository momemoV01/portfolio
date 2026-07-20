/**
 * Subtle dirt path connecting spawn to bulletin board.
 * No physics — purely visual layout aid.
 */
export default function Path() {
	return (
		<group>
			{/* main spine: spawn (z=+5) → board (z=-2.5) */}
			<mesh position={[0, 0.02, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[1.4, 7.5]} />
				<meshStandardMaterial color="#5a4f3a" roughness={1} />
			</mesh>
			{/* east branch toward well */}
			<mesh position={[2, 0.02, 2]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
				<planeGeometry args={[1.0, 3.5]} />
				<meshStandardMaterial color="#5a4f3a" roughness={1} />
			</mesh>
			{/* west branch toward cabin */}
			<mesh position={[-3, 0.02, 2]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} receiveShadow>
				<planeGeometry args={[1.0, 4.5]} />
				<meshStandardMaterial color="#5a4f3a" roughness={1} />
			</mesh>
		</group>
	);
}
