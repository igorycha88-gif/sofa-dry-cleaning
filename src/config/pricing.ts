export type FurnitureTypeKey =
  | 'SOFA'
  | 'CORNER_SOFA'
  | 'ARMCHAIR'
  | 'MATTRESS'
  | 'CARPET'
  | 'CHAIR'
  | 'OTTOMAN'
  | 'OTHER';

export type ExtraServiceId = 'heavy_soil' | 'urgent' | 'antibacterial' | 'odor_removal';

export interface FurniturePricing {
  key: FurnitureTypeKey;
  label: string;
  shortLabel: string;
  /** цена за единицу (место / м² / шт) */
  pricePerUnit: number;
  unit: 'место' | 'секция' | 'шт' | 'м²' | 'сп. место';
  minUnits: number;
  maxUnits: number;
  hint: string;
}

export interface ExtraService {
  id: ExtraServiceId;
  label: string;
  description: string;
  priceMode: 'multiplier' | 'fixed';
  value: number;
}

export const FURNITURE_PRICING: Record<FurnitureTypeKey, FurniturePricing> = {
  SOFA: {
    key: 'SOFA',
    label: 'Диван',
    shortLabel: 'дивана',
    pricePerUnit: 1500,
    unit: 'место',
    minUnits: 1,
    maxUnits: 6,
    hint: 'Прямой диван: 1–6 мест',
  },
  CORNER_SOFA: {
    key: 'CORNER_SOFA',
    label: 'Угловой диван',
    shortLabel: 'углового дивана',
    pricePerUnit: 1600,
    unit: 'секция',
    minUnits: 3,
    maxUnits: 8,
    hint: 'Угловой диван: 3–8 секций',
  },
  ARMCHAIR: {
    key: 'ARMCHAIR',
    label: 'Кресло',
    shortLabel: 'кресла',
    pricePerUnit: 1200,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 6,
    hint: 'Кресло: 1–6 шт',
  },
  MATTRESS: {
    key: 'MATTRESS',
    label: 'Матрас',
    shortLabel: 'матраса',
    pricePerUnit: 1600,
    unit: 'сп. место',
    minUnits: 1,
    maxUnits: 4,
    hint: 'Матрас: 1–4 сп. места',
  },
  CARPET: {
    key: 'CARPET',
    label: 'Ковёр',
    shortLabel: 'ковра',
    pricePerUnit: 350,
    unit: 'м²',
    minUnits: 2,
    maxUnits: 40,
    hint: 'Ковёр: 2–40 м²',
  },
  CHAIR: {
    key: 'CHAIR',
    label: 'Стул',
    shortLabel: 'стула',
    pricePerUnit: 500,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 20,
    hint: 'Стул: 1–20 шт',
  },
  OTTOMAN: {
    key: 'OTTOMAN',
    label: 'Пуф / банкетка',
    shortLabel: 'пуфа',
    pricePerUnit: 700,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 10,
    hint: 'Пуф: 1–10 шт',
  },
  OTHER: {
    key: 'OTHER',
    label: 'Другое',
    shortLabel: 'изделия',
    pricePerUnit: 1500,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 10,
    hint: 'Другая мягкая мебель',
  },
};

export const EXTRA_SERVICES: ExtraService[] = [
  {
    id: 'heavy_soil',
    label: 'Сильное загрязнение',
    description: 'Пятна, следы животных, застарелые загрязнения',
    priceMode: 'multiplier',
    value: 1.25,
  },
  {
    id: 'urgent',
    label: 'Срочный выезд',
    description: 'Приедем в течение 3 часов',
    priceMode: 'multiplier',
    value: 1.2,
  },
  {
    id: 'antibacterial',
    label: 'Антибактериальная обработка',
    description: 'Устранение микробов и аллергенов',
    priceMode: 'fixed',
    value: 900,
  },
  {
    id: 'odor_removal',
    label: 'Удаление запахов',
    description: 'Нейтрализация запахов животных, табака',
    priceMode: 'fixed',
    value: 1200,
  },
];

export interface CalcPriceInput {
  furnitureType: FurnitureTypeKey;
  units: number;
  services: ExtraServiceId[];
}

/** Округление до 50 ₽ в большую сторону */
function round50(value: number): number {
  return Math.ceil(value / 50) * 50;
}

export function calcPrice(input: CalcPriceInput): number {
  const furniture = FURNITURE_PRICING[input.furnitureType];
  if (!furniture) return 0;
  const units = Math.min(Math.max(Math.round(input.units || furniture.minUnits), furniture.minUnits), furniture.maxUnits);

  let total = furniture.pricePerUnit * units;

  const multipliers = EXTRA_SERVICES.filter(
    (s) => s.priceMode === 'multiplier' && input.services?.includes(s.id)
  );
  for (const m of multipliers) {
    total *= m.value;
  }

  const fixed = EXTRA_SERVICES.filter(
    (s) => s.priceMode === 'fixed' && input.services?.includes(s.id)
  );
  for (const f of fixed) {
    total += f.value;
  }

  return round50(total);
}

/** Минимальная цена «от» для карточек услуг */
export function priceFrom(furnitureType: FurnitureTypeKey): number {
  const furniture = FURNITURE_PRICING[furnitureType];
  return calcPrice({ furnitureType, units: furniture.minUnits, services: [] });
}
