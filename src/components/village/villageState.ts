export type TimeOfDay = 'night' | 'day';

export type Palette = {
	bg: string;
	fogColor: string;
	fogNear: number;
	fogFar: number;
	ambient: number;
	keyIntensity: number;
	keyColor: string;
	rimIntensity: number;
	rimColor: string;
	groundColor: string;
	gridMajor: string;
	gridMinor: string;
	showStars: boolean;
};

export const PALETTES: Record<TimeOfDay, Palette> = {
	night: {
		bg: '#050507',
		fogColor: '#050507',
		fogNear: 18,
		fogFar: 70,
		ambient: 0.35,
		keyIntensity: 1.1,
		keyColor: '#ffffff',
		rimIntensity: 0.25,
		rimColor: '#a3e635',
		groundColor: '#1a1f24',
		gridMajor: '#3a4148',
		gridMinor: '#262b30',
		showStars: true,
	},
	day: {
		bg: '#b8d0e0',
		fogColor: '#cfdee8',
		fogNear: 28,
		fogFar: 95,
		ambient: 0.85,
		keyIntensity: 1.6,
		keyColor: '#fff2da',
		rimIntensity: 0,
		rimColor: '#a3e635',
		groundColor: '#5a6b5a',
		gridMajor: '#3e4a3e',
		gridMinor: '#4a5a4a',
		showStars: false,
	},
};
