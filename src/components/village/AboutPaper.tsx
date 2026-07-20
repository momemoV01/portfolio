import { Html } from '@react-three/drei';

const stack = [
	{ label: 'Engine', items: ['Unity 6', 'Unreal 5'] },
	{ label: 'Language', items: ['C#', 'HLSL', 'TypeScript'] },
	{ label: 'Rendering', items: ['URP', 'Shader Graph', 'Niagara'] },
	{ label: 'Tools', items: ['DOTween', 'UniTask', 'Addressables', 'Git'] },
];

const focus = [
	{ title: 'Real-time rendering', desc: '셰이더, 후처리, 라이팅' },
	{ title: 'Game feel', desc: '피드백, 애니메이션, 사운드의 결' },
	{ title: 'Procedural generation', desc: '코드로 만들어지는 형태와 패턴' },
	{ title: 'Workflow automation', desc: '본인이 쓰는 작은 도구 만들기' },
];

type Props = {
	visible: boolean;
};

export default function AboutPaper({ visible }: Props) {
	return (
		<Html
			position={[0, 3.4, 0]}
			center
			distanceFactor={6}
			zIndexRange={[100, 0]}
			style={{ pointerEvents: visible ? 'auto' : 'none' }}
		>
			<div
				style={{
					width: '420px',
					padding: '24px 26px',
					background: '#f4ecd8',
					color: '#1a1a1a',
					fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
					fontSize: '12px',
					lineHeight: '1.6',
					border: '1px solid #c9bfa4',
					borderRadius: '2px',
					boxShadow: '0 24px 60px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.1)',
					transform: visible ? 'rotate(-1deg) translateY(0)' : 'rotate(-1deg) translateY(8px)',
					opacity: visible ? 1 : 0,
					transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.1)',
					backgroundImage:
						'repeating-linear-gradient(transparent, transparent 19px, rgba(0,0,0,0.05) 19px, rgba(0,0,0,0.05) 20px)',
				}}
			>
				<div style={{ fontSize: '10px', color: '#7a6a4a', letterSpacing: '0.1em', marginBottom: '4px' }}>
					NOTICE — village board
				</div>
				<div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px', letterSpacing: '-0.02em' }}>
					김태수 <span style={{ color: '#65a30d' }}>·</span> @momemo
				</div>
				<div style={{ fontSize: '11px', color: '#5a4a2a', marginBottom: '14px' }}>
					Unity로 게임 만들고, Unreal로 비주얼 실험하는 솔로 개발자.
				</div>

				<div style={{ borderTop: '1px dashed #b8a883', paddingTop: '12px', marginBottom: '12px' }}>
					<div style={{ fontSize: '9px', color: '#7a6a4a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
						▸ now
					</div>
					<div style={{ fontSize: '11px' }}>
						Unity URP 기반 게임 프로토타이핑 중. Shader Graph 비주얼 실험 매일 기록.
					</div>
				</div>

				<div style={{ borderTop: '1px dashed #b8a883', paddingTop: '12px', marginBottom: '12px' }}>
					<div style={{ fontSize: '9px', color: '#7a6a4a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
						▸ stack
					</div>
					{stack.map((g) => (
						<div key={g.label} style={{ display: 'flex', gap: '8px', fontSize: '10.5px', marginBottom: '3px' }}>
							<span style={{ width: '70px', color: '#7a6a4a' }}>{g.label}</span>
							<span>{g.items.join(' · ')}</span>
						</div>
					))}
				</div>

				<div style={{ borderTop: '1px dashed #b8a883', paddingTop: '12px', marginBottom: '12px' }}>
					<div style={{ fontSize: '9px', color: '#7a6a4a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
						▸ focus
					</div>
					<ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: '10.5px' }}>
						{focus.map((f) => (
							<li key={f.title} style={{ marginBottom: '3px' }}>
								<strong>{f.title}</strong>
								<span style={{ color: '#5a4a2a' }}> — {f.desc}</span>
							</li>
						))}
					</ol>
				</div>

				<div style={{ borderTop: '1px dashed #b8a883', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
					<a href="/about" style={{ color: '#65a30d', textDecoration: 'underline' }}>full about ↗</a>
					<a href="/" style={{ color: '#65a30d', textDecoration: 'underline' }}>← back to site</a>
				</div>
			</div>
		</Html>
	);
}
