export type SofaTypeKey =
  | 'SOFA_2'
  | 'SOFA_3'
  | 'CORNER_SOFA'
  | 'CORNER_SOFA_5'
  | 'U_SHAPE_SOFA';

export type ExtraServiceId =
  | 'heavy_soil'
  | 'odor_removal'
  | 'fast_drying'
  | 'sleep_place'
  | 'seat_place'
  | 'fabric_velour'
  | 'fabric_flock'
  | 'fabric_boucle';

export interface SofaPricing {
  key: SofaTypeKey;
  label: string;
  shortLabel: string;
  /** цена за один диван */
  pricePerUnit: number;
  unit: 'шт';
  minUnits: number;
  maxUnits: number;
  /** размер из прайс-листа */
  sizeHint: string;
}

export interface ExtraService {
  id: ExtraServiceId;
  label: string;
  description: string;
  priceMode: 'multiplier' | 'fixed';
  value: number;
}

/**
 * Прайс на химчистку диванов — источник: price-list.pdf (раздел «Мягкая мебель», только диваны).
 */
export const FURNITURE_PRICING: Record<SofaTypeKey, SofaPricing> = {
  SOFA_2: {
    key: 'SOFA_2',
    label: 'Диван 2-местный',
    shortLabel: 'дивана 2-местного',
    pricePerUnit: 1700,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 5,
    sizeHint: '100–140 см',
  },
  SOFA_3: {
    key: 'SOFA_3',
    label: 'Диван 3-местный',
    shortLabel: 'дивана 3-местного',
    pricePerUnit: 2100,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 5,
    sizeHint: '150–180 см',
  },
  CORNER_SOFA: {
    key: 'CORNER_SOFA',
    label: 'Угловой / 4-местный диван',
    shortLabel: 'углового дивана',
    pricePerUnit: 2600,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 5,
    sizeHint: '180–230 см',
  },
  CORNER_SOFA_5: {
    key: 'CORNER_SOFA_5',
    label: 'Угловой 5-местный диван',
    shortLabel: 'углового 5-местного дивана',
    pricePerUnit: 3000,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 5,
    sizeHint: '250–290 см',
  },
  U_SHAPE_SOFA: {
    key: 'U_SHAPE_SOFA',
    label: 'П-образный диван',
    shortLabel: 'П-образного дивана',
    pricePerUnit: 4300,
    unit: 'шт',
    minUnits: 1,
    maxUnits: 5,
    sizeHint: '300–340 см',
  },
};

/** Дополнительные услуги и наценки — источник: price-list.pdf */
export const EXTRA_SERVICES: ExtraService[] = [
  {
    id: 'heavy_soil',
    label: 'Сильные загрязнения',
    description: 'Застарелые пятна, следы животных',
    priceMode: 'multiplier',
    value: 1.2,
  },
  {
    id: 'odor_removal',
    label: 'Выведение запахов',
    description: 'Нейтрализация запахов животных, табака',
    priceMode: 'fixed',
    value: 800,
  },
  {
    id: 'fast_drying',
    label: 'Быстрая сушка',
    description: 'Профессиональная сушка после чистки',
    priceMode: 'fixed',
    value: 1500,
  },
  {
    id: 'sleep_place',
    label: 'Выдвижное спальное место',
    description: 'Чистка выдвижной части дивана',
    priceMode: 'fixed',
    value: 800,
  },
  {
    id: 'seat_place',
    label: 'Доп. посадочное место',
    description: 'Чистка дополнительного посадочного места',
    priceMode: 'fixed',
    value: 500,
  },
  {
    id: 'fabric_velour',
    label: 'Велюр',
    description: 'Деликатная обивка — наценка 30%',
    priceMode: 'multiplier',
    value: 1.3,
  },
  {
    id: 'fabric_flock',
    label: 'Флок',
    description: 'Обивка флок — наценка 40%',
    priceMode: 'multiplier',
    value: 1.4,
  },
  {
    id: 'fabric_boucle',
    label: 'Букле',
    description: 'Обивка букле — наценка 50%',
    priceMode: 'multiplier',
    value: 1.5,
  },
];

/** Наценки за тип обивки — взаимоисключающие (radio в UI) */
export const FABRIC_SERVICE_IDS: ExtraServiceId[] = ['fabric_velour', 'fabric_flock', 'fabric_boucle'];

/** Дополнительные позиции из прайса (справочно, на страницу /ceny) */
export const PRICE_EXTRAS_TABLE = [
  { label: 'Выдвижное спальное место дивана', price: '800 ₽' },
  { label: 'Посадочное место дивана', price: '500 ₽' },
  { label: 'Подушки малые', price: '200 ₽' },
  { label: 'Подушки средние', price: '250 ₽' },
  { label: 'Подушки большие', price: '300 ₽' },
  { label: 'Выведение запахов', price: 'от 800 ₽' },
  { label: 'Сильные загрязнения', price: '+20%' },
  { label: 'Быстрая сушка', price: '1 500 ₽' },
  { label: 'Наценка за флок', price: '+40%' },
  { label: 'Наценка за букле', price: '+50%' },
  { label: 'Наценка за велюр', price: '+30%' },
];

export interface CalcPriceInput {
  furnitureType: SofaTypeKey;
  units: number;
  services: ExtraServiceId[];
}

/** Округление до 50 ₽ в большую сторону */
function round50(value: number): number {
  return Math.ceil(value / 50) * 50;
}

export function calcPrice(input: CalcPriceInput): number {
  const sofa = FURNITURE_PRICING[input.furnitureType];
  if (!sofa) return 0;
  const units = Math.min(Math.max(Math.round(input.units || sofa.minUnits), sofa.minUnits), sofa.maxUnits);

  let total = sofa.pricePerUnit * units;

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
export function priceFrom(furnitureType: SofaTypeKey): number {
  const sofa = FURNITURE_PRICING[furnitureType];
  return calcPrice({ furnitureType, units: sofa.minUnits, services: [] });
}
