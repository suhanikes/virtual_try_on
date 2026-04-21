import React, { useCallback, useEffect, useState } from 'react';
import { GarmentViewer } from './GarmentViewer';
import { garmentStyles } from '../config/garmentStyles';

const NECKLINE_PREVIEW_PURPLE = '#9E6AFF';

interface NecklineTestingProps {
	selectedGarmentId?: string;
	onGarmentSelect?: (garmentId: string) => void;
	garmentColor?: string;
	disabled?: boolean;
}

export function NecklineTesting({ selectedGarmentId, onGarmentSelect, disabled = false }: NecklineTestingProps) {
	const [internalActiveGarment, setInternalActiveGarment] = useState(garmentStyles[0]?.id ?? '');
	const [canLoad3D, setCanLoad3D] = useState(false);
	const hasAnyConfiguredModel = garmentStyles.some((style) => Boolean(style.modelUrl));
	const activeGarment = selectedGarmentId ?? internalActiveGarment;
	const [loadedCardIds, setLoadedCardIds] = useState<Set<string>>(() => {
		const initialCardId = selectedGarmentId ?? garmentStyles[0]?.id ?? '';
		return initialCardId ? new Set([initialCardId]) : new Set();
	});

	useEffect(() => {
		if (canLoad3D || typeof window === 'undefined') {
			return;
		}

		let idleId: number | null = null;
		let timeoutId: number | null = null;

		const enable3D = () => {
			setCanLoad3D(true);
			window.removeEventListener('pointerdown', enable3D);
			window.removeEventListener('keydown', enable3D);
			window.removeEventListener('touchstart', enable3D);
			if (idleId !== null && 'cancelIdleCallback' in window) {
				window.cancelIdleCallback(idleId);
			}
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId);
			}
		};

		if ('requestIdleCallback' in window) {
			idleId = window.requestIdleCallback(enable3D, { timeout: 1500 });
		} else {
			timeoutId = window.setTimeout(enable3D, 200);
		}

		window.addEventListener('pointerdown', enable3D, { passive: true, once: true });
		window.addEventListener('keydown', enable3D, { once: true });
		window.addEventListener('touchstart', enable3D, { passive: true, once: true });

		return () => {
			window.removeEventListener('pointerdown', enable3D);
			window.removeEventListener('keydown', enable3D);
			window.removeEventListener('touchstart', enable3D);
			if (idleId !== null && 'cancelIdleCallback' in window) {
				window.cancelIdleCallback(idleId);
			}
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [canLoad3D]);

	useEffect(() => {
		if (!activeGarment) {
			return;
		}

		setLoadedCardIds((prev) => {
			if (prev.has(activeGarment)) {
				return prev;
			}

			const next = new Set(prev);
			next.add(activeGarment);
			return next;
		});
	}, [activeGarment]);

	const markCardAsLoaded = useCallback((garmentId: string) => {
		setLoadedCardIds((prev) => {
			if (prev.has(garmentId)) {
				return prev;
			}

			const next = new Set(prev);
			next.add(garmentId);
			return next;
		});
	}, []);

	const handleGarmentSelect = (garmentId: string) => {
		if (disabled) {
			return;
		}

		setInternalActiveGarment(garmentId);
		markCardAsLoaded(garmentId);
		onGarmentSelect?.(garmentId);
	};

	return (
		<div className={`absolute left-[370px] top-[688px] w-[585px] overflow-hidden rounded-[22px] border border-[rgba(226,219,239,0.82)] bg-[rgba(255,255,255,0.9)] shadow-[0_10px_22px_-18px_rgba(49,34,84,0.45)] ${disabled ? 'opacity-50' : 'opacity-100'}`}>
			<div className="relative z-10 flex min-h-[188px] flex-col px-5 pb-3 pt-3">
				<div className="content-stretch flex h-[24px] items-center">
					<p className="font-['Cabin:Bold',sans-serif] text-[13px] font-bold leading-[20px] uppercase tracking-[0.7px] text-[#4a465f]" style={{ fontVariationSettings: "'wdth' 100" }}>
						Necklines Testing
					</p>
				</div>

				{!hasAnyConfiguredModel && (
					<p className="pt-1 text-[10px] text-[#7a7a7a] font-['Cabin',sans-serif]">
						Place GLB files in public/models. Cards auto-populate and are served from /models in the app.
					</p>
				)}

				<div className="relative z-10 mt-2 overflow-x-auto overflow-y-hidden pb-1" style={{ scrollbarWidth: 'none' }}>
					<div className="flex min-w-max items-start gap-3 pr-2">
						{garmentStyles.map((style) => {
							const modelUrl = style.modelUrl;
							const isActive = style.id === activeGarment;
							const shouldLoadViewer = canLoad3D && loadedCardIds.has(style.id);

							return (
								<button
									key={style.id}
									type="button"
									onClick={() => handleGarmentSelect(style.id)}
									onMouseEnter={() => markCardAsLoaded(style.id)}
									onFocus={() => markCardAsLoaded(style.id)}
									onPointerDown={() => markCardAsLoaded(style.id)}
									disabled={disabled}
									className="shrink-0"
								>
									<div
										className={`relative h-[86px] w-[86px] overflow-hidden rounded-[12px] border transition-all ${
											isActive
												? 'border-[#9E6AFF] shadow-[0_0_0_2px_rgba(158,106,255,0.18)]'
												: 'border-[rgba(158,106,255,0.24)] hover:border-[rgba(158,106,255,0.5)]'
										}`}
									>
										{shouldLoadViewer ? (
											<GarmentViewer
												modelUrl={modelUrl}
												garmentType={style.id}
												garmentColor={NECKLINE_PREVIEW_PURPLE}
												applyFabricTextures={false}
												alignBottom={true}
												autoRotate={false}
												transparentBackground={true}
												autoFit={true}
												modelScale={1.16}
												fitPadding={0.9}
												cameraYOffset={0}
												bottomAnchorNdc={-1.1}
												className="absolute inset-0 h-full w-full bg-[linear-gradient(180deg,rgba(237,228,255,0.92)_0%,rgba(226,210,255,0.88)_100%)]"
											/>
										) : (
											<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(237,228,255,0.92)_0%,rgba(226,210,255,0.88)_100%)]" />
										)}
									</div>
									<p className="mt-1.5 max-w-[86px] truncate text-center text-[10px] font-semibold text-[#4f4a66]">
										{style.name}
									</p>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
