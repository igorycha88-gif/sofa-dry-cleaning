'use client';

import { useCallback, useRef, useState } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * Интерактивный слайдер «до/после».
 * Фото — CSS-заглушки, заменить на реальные снимки в public/ и подставить в next/image.
 */
export function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, percent)));
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    updateFromClientX(event.clientX);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    updateFromClientX(event.clientX);
  }

  function stopDragging() {
    dragging.current = false;
  }

  return (
    <section className="container-x py-24" id="before-after">
      <SectionHeading
        eyebrow="Результат"
        title={
          <>
            До и после — <span className="text-gradient">разница очевидна</span>
          </>
        }
        subtitle="Потяните ползунок: даже «безнадёжная» обивка оживает после профессиональной чистки."
      />

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        className="relative mx-auto aspect-[16/9] w-full max-w-3xl cursor-ew-resize touch-none select-none overflow-hidden rounded-bento shadow-bento"
        role="slider"
        aria-label="Сравнение до и после чистки"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 5));
          if (event.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 5));
        }}
      >
        {/* После (нижний слой) */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-200 via-sky-100 to-violet-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span aria-hidden className="text-7xl">✨🛋️</span>
              <p className="mt-3 font-heading text-lg font-bold text-cyan-900">После</p>
              <p className="text-xs text-cyan-800/70">Чистая обивка, ворс расчёсан</p>
            </div>
          </div>
          <span className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-cyan-900 backdrop-blur">
            ПОСЛЕ
          </span>
        </div>

        {/* До (верхний слой, обрезается) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-400 via-amber-800/60 to-stone-600"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span aria-hidden className="text-7xl">🛋️😖</span>
              <p className="mt-3 font-heading text-lg font-bold text-stone-100">До</p>
              <p className="text-xs text-stone-200/70">Пятна, засаленность, пыль</p>
            </div>
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-stone-900/60 px-3 py-1 text-xs font-bold text-stone-100">
            ДО
          </span>
        </div>

        {/* Разделитель */}
        <div
          className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-white shadow-glow"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow">
            <span aria-hidden className="text-sm font-bold">⇄</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        * Демонстрационный визуал. Здесь будут реальные фото наших работ.
      </p>
    </section>
  );
}
