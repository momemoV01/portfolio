export const FENCE_RADIUS = 28;

export type TreeData = { pos: [number, number, number]; scale: number; rot: number };

export const TREES: TreeData[] = [
	// inner ring (r ~7-12)
	{ pos: [-7, 0, -8], scale: 1.0, rot: 0.3 },
	{ pos: [-9, 0, -3], scale: 1.3, rot: 1.2 },
	{ pos: [-11, 0, 2], scale: 0.9, rot: 2.1 },
	{ pos: [-8, 0, 7], scale: 1.1, rot: 0.7 },
	{ pos: [-4, 0, -11], scale: 1.2, rot: 1.6 },
	{ pos: [3, 0, -10], scale: 1.0, rot: 0.4 },
	{ pos: [7, 0, -8], scale: 1.4, rot: 2.4 },
	{ pos: [10, 0, -4], scale: 1.1, rot: 0.9 },
	{ pos: [11, 0, 6], scale: 0.95, rot: 0.6 },
	{ pos: [5, 0, 10], scale: 1.05, rot: 2.7 },
	{ pos: [-5, 0, 11], scale: 1.15, rot: 1.1 },
	// outer ring (r ~14-22)
	{ pos: [-14, 0, -16], scale: 1.5, rot: 0.2 },
	{ pos: [-19, 0, -8], scale: 1.4, rot: 1.7 },
	{ pos: [-22, 0, 0], scale: 1.3, rot: 0.8 },
	{ pos: [-19, 0, 11], scale: 1.45, rot: 2.2 },
	{ pos: [-13, 0, 19], scale: 1.2, rot: 1.4 },
	{ pos: [0, 0, 22], scale: 1.35, rot: 0.5 },
	{ pos: [13, 0, 19], scale: 1.25, rot: 1.9 },
	{ pos: [20, 0, 12], scale: 1.5, rot: 0.6 },
	{ pos: [22, 0, 0], scale: 1.4, rot: 2.5 },
	{ pos: [19, 0, -10], scale: 1.3, rot: 1.0 },
	{ pos: [13, 0, -18], scale: 1.45, rot: 0.4 },
	{ pos: [-2, 0, -20], scale: 1.4, rot: 2.0 },
	{ pos: [4, 0, -22], scale: 1.2, rot: 1.3 },
	// scattered far singles
	{ pos: [-25, 0, -20], scale: 1.6, rot: 0.9 },
	{ pos: [25, 0, -22], scale: 1.55, rot: 2.3 },
	{ pos: [-26, 0, 18], scale: 1.5, rot: 1.5 },
	{ pos: [25, 0, 20], scale: 1.6, rot: 0.7 },
];
