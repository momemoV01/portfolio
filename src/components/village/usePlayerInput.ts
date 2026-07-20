import { useEffect, useRef } from 'react';

export type InputState = {
	forward: number;
	right: number;
	sprint: boolean;
};

export function usePlayerInput() {
	const input = useRef<InputState>({ forward: 0, right: 0, sprint: false });

	useEffect(() => {
		const keys = {
			w: false, a: false, s: false, d: false,
			up: false, down: false, left: false, right: false,
			shift: false,
		};

		const update = () => {
			const forward = (keys.w || keys.up ? 1 : 0) - (keys.s || keys.down ? 1 : 0);
			const right = (keys.d || keys.right ? 1 : 0) - (keys.a || keys.left ? 1 : 0);
			input.current.forward = forward;
			input.current.right = right;
			input.current.sprint = keys.shift;
		};

		const onDown = (e: KeyboardEvent) => {
			switch (e.code) {
				case 'KeyW': keys.w = true; break;
				case 'KeyA': keys.a = true; break;
				case 'KeyS': keys.s = true; break;
				case 'KeyD': keys.d = true; break;
				case 'ArrowUp': keys.up = true; break;
				case 'ArrowDown': keys.down = true; break;
				case 'ArrowLeft': keys.left = true; break;
				case 'ArrowRight': keys.right = true; break;
				case 'ShiftLeft':
				case 'ShiftRight': keys.shift = true; break;
				default: return;
			}
			update();
		};

		const onUp = (e: KeyboardEvent) => {
			switch (e.code) {
				case 'KeyW': keys.w = false; break;
				case 'KeyA': keys.a = false; break;
				case 'KeyS': keys.s = false; break;
				case 'KeyD': keys.d = false; break;
				case 'ArrowUp': keys.up = false; break;
				case 'ArrowDown': keys.down = false; break;
				case 'ArrowLeft': keys.left = false; break;
				case 'ArrowRight': keys.right = false; break;
				case 'ShiftLeft':
				case 'ShiftRight': keys.shift = false; break;
				default: return;
			}
			update();
		};

		const onBlur = () => {
			(Object.keys(keys) as Array<keyof typeof keys>).forEach((k) => (keys[k] = false));
			update();
		};

		window.addEventListener('keydown', onDown);
		window.addEventListener('keyup', onUp);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('keydown', onDown);
			window.removeEventListener('keyup', onUp);
			window.removeEventListener('blur', onBlur);
		};
	}, []);

	return input;
}
