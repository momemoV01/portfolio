import { useEffect, useRef } from 'react';

export type CameraOrbit = {
	yaw: number;
	pitch: number;
	distance: number;
};

const SENS_X = 0.005;
const SENS_Y = 0.004;
const MIN_PITCH = 0.15;
const MAX_PITCH = Math.PI / 2 - 0.05;

export function useCameraDrag(initial: CameraOrbit) {
	const state = useRef<CameraOrbit>({ ...initial });

	useEffect(() => {
		let dragging = false;
		let lastX = 0;
		let lastY = 0;
		let pointerId: number | null = null;

		const isOnCanvas = (target: EventTarget | null) =>
			target instanceof HTMLElement && target.tagName === 'CANVAS';

		const onDown = (e: PointerEvent) => {
			if (e.button !== 0) return;
			if (!isOnCanvas(e.target)) return;
			dragging = true;
			pointerId = e.pointerId;
			lastX = e.clientX;
			lastY = e.clientY;
			(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
			document.body.style.cursor = 'grabbing';
			e.preventDefault();
		};

		const onMove = (e: PointerEvent) => {
			if (!dragging) return;
			const dx = e.clientX - lastX;
			const dy = e.clientY - lastY;
			lastX = e.clientX;
			lastY = e.clientY;
			state.current.yaw -= dx * SENS_X;
			state.current.pitch = Math.min(
				MAX_PITCH,
				Math.max(MIN_PITCH, state.current.pitch + dy * SENS_Y),
			);
		};

		const onUp = (e: PointerEvent) => {
			if (!dragging) return;
			dragging = false;
			if (pointerId !== null && e.target instanceof HTMLElement) {
				e.target.releasePointerCapture?.(pointerId);
			}
			pointerId = null;
			document.body.style.cursor = '';
		};

		const onContextMenu = (e: MouseEvent) => {
			if (isOnCanvas(e.target)) e.preventDefault();
		};

		window.addEventListener('pointerdown', onDown);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		window.addEventListener('contextmenu', onContextMenu);
		return () => {
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			window.removeEventListener('contextmenu', onContextMenu);
			document.body.style.cursor = '';
		};
	}, []);

	return state;
}
