const MOUNTAIN: string = '#1a232a';

const MOUNTAINS: Array<{ pos: [number, number, number]; scale: [number, number, number] }> = [
	{ pos: [-38, 0, -38], scale: [16, 10, 16] },
	{ pos: [-18, 0, -48], scale: [14, 9, 14] },
	{ pos: [6, 0, -52], scale: [20, 13, 20] },
	{ pos: [30, 0, -45], scale: [16, 10, 16] },
	{ pos: [44, 0, -28], scale: [14, 9, 14] },
	{ pos: [48, 0, -2], scale: [13, 8, 13] },
	{ pos: [42, 0, 30], scale: [15, 9, 15] },
	{ pos: [-44, 0, -14], scale: [13, 8, 13] },
	{ pos: [-46, 0, 22], scale: [14, 9, 14] },
	{ pos: [-22, 0, 44], scale: [15, 9, 15] },
	{ pos: [12, 0, 50], scale: [14, 9, 14] },
];

export default function Mountains() {
	return (
		<group>
			{MOUNTAINS.map((m, i) => (
				<mesh key={i} position={m.pos} scale={m.scale}>
					<coneGeometry args={[0.5, 1, 5]} />
					<meshStandardMaterial color={MOUNTAIN} roughness={1} flatShading />
				</mesh>
			))}
		</group>
	);
}
