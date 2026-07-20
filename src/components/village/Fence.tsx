import { RigidBody } from '@react-three/rapier';

const WOOD = '#3e2d18';
const RADIUS = 28;
const SPACING = 2.5;
const POST_HEIGHT = 0.9;

type Segment = { from: [number, number]; to: [number, number]; gap?: [number, number] };

// 4 sides of a square fence; gap behind player spawn (south side, around z=+RADIUS)
const SEGMENTS: Segment[] = [
	{ from: [-RADIUS, -RADIUS], to: [RADIUS, -RADIUS] }, // north
	{ from: [-RADIUS, RADIUS], to: [RADIUS, RADIUS], gap: [-3, 3] }, // south (with opening)
	{ from: [-RADIUS, -RADIUS], to: [-RADIUS, RADIUS] }, // west
	{ from: [RADIUS, -RADIUS], to: [RADIUS, RADIUS] }, // east
];

function buildPosts(seg: Segment): Array<[number, number]> {
	const posts: Array<[number, number]> = [];
	const dx = seg.to[0] - seg.from[0];
	const dz = seg.to[1] - seg.from[1];
	const len = Math.hypot(dx, dz);
	const steps = Math.round(len / SPACING);
	const ux = dx / steps;
	const uz = dz / steps;
	for (let i = 0; i <= steps; i++) {
		const x = seg.from[0] + ux * i;
		const z = seg.from[1] + uz * i;
		if (seg.gap && x > seg.gap[0] && x < seg.gap[1]) continue;
		posts.push([x, z]);
	}
	return posts;
}

export default function Fence() {
	const posts: Array<[number, number]> = [];
	for (const seg of SEGMENTS) {
		posts.push(...buildPosts(seg));
	}

	const rails: Array<{ pos: [number, number, number]; rot: [number, number, number]; len: number }> = [];
	for (const seg of SEGMENTS) {
		const dx = seg.to[0] - seg.from[0];
		const dz = seg.to[1] - seg.from[1];
		const len = Math.hypot(dx, dz);
		const cx = (seg.from[0] + seg.to[0]) / 2;
		const cz = (seg.from[1] + seg.to[1]) / 2;
		const rot = Math.atan2(dz, dx);
		// skip rail if there's a gap (just leave posts)
		if (seg.gap) {
			// build two short rails skipping the gap
			const gapStart = seg.gap[0];
			const gapEnd = seg.gap[1];
			// left rail (from start to gap)
			const leftLen = gapStart - seg.from[0];
			if (leftLen > 0.1) {
				const lcx = (seg.from[0] + gapStart) / 2;
				rails.push({ pos: [lcx, 0.5, cz], rot: [0, -rot, 0], len: leftLen });
				rails.push({ pos: [lcx, 0.85, cz], rot: [0, -rot, 0], len: leftLen });
			}
			const rightLen = seg.to[0] - gapEnd;
			if (rightLen > 0.1) {
				const rcx = (gapEnd + seg.to[0]) / 2;
				rails.push({ pos: [rcx, 0.5, cz], rot: [0, -rot, 0], len: rightLen });
				rails.push({ pos: [rcx, 0.85, cz], rot: [0, -rot, 0], len: rightLen });
			}
			continue;
		}
		rails.push({ pos: [cx, 0.5, cz], rot: [0, -rot, 0], len });
		rails.push({ pos: [cx, 0.85, cz], rot: [0, -rot, 0], len });
	}

	return (
		<group>
			<RigidBody type="fixed" colliders="cuboid">
				{posts.map(([x, z], i) => (
					<mesh key={`post-${i}`} position={[x, POST_HEIGHT / 2, z]} castShadow>
						<boxGeometry args={[0.08, POST_HEIGHT, 0.08]} />
						<meshStandardMaterial color={WOOD} roughness={1} />
					</mesh>
				))}
				{rails.map((r, i) => (
					<mesh key={`rail-${i}`} position={r.pos} rotation={r.rot} castShadow>
						<boxGeometry args={[r.len, 0.04, 0.04]} />
						<meshStandardMaterial color={WOOD} roughness={1} />
					</mesh>
				))}
			</RigidBody>
		</group>
	);
}
