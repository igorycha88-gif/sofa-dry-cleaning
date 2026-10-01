import {
  calcPrice,
  priceFrom,
  FURNITURE_PRICING,
  EXTRA_SERVICES,
  FABRIC_SERVICE_IDS,
  PRICE_EXTRAS_TABLE,
  type SofaTypeKey,
} from '@/config/pricing';

describe('FURNITURE_PRICING — данные прайс-листа (price-list.pdf, только диваны)', () => {
  test('цены соответствуют прайс-листу', () => {
    expect(FURNITURE_PRICING.SOFA_2.pricePerUnit).toBe(1700);
    expect(FURNITURE_PRICING.SOFA_3.pricePerUnit).toBe(2100);
    expect(FURNITURE_PRICING.CORNER_SOFA.pricePerUnit).toBe(2600);
    expect(FURNITURE_PRICING.CORNER_SOFA_5.pricePerUnit).toBe(3000);
    expect(FURNITURE_PRICING.U_SHAPE_SOFA.pricePerUnit).toBe(4300);
  });

  test('ровно 5 диванных типов, лишних типов нет', () => {
    expect(Object.keys(FURNITURE_PRICING).sort()).toEqual(
      ['SOFA_2', 'SOFA_3', 'CORNER_SOFA', 'CORNER_SOFA_5', 'U_SHAPE_SOFA'].sort()
    );
  });

  test('у каждого типа указан размер из прайса', () => {
    for (const item of Object.values(FURNITURE_PRICING)) {
      expect(item.sizeHint).toMatch(/см$/);
    }
  });

  test('количество диванов ограничено 1–5', () => {
    for (const item of Object.values(FURNITURE_PRICING)) {
      expect(item.minUnits).toBe(1);
      expect(item.maxUnits).toBe(5);
    }
  });
});

describe('EXTRA_SERVICES — допы и наценки из прайса', () => {
  test('состав допов соответствует прайсу', () => {
    const ids = EXTRA_SERVICES.map((s) => s.id).sort();
    expect(ids).toEqual(
      [
        'heavy_soil',
        'odor_removal',
        'fast_drying',
        'sleep_place',
        'seat_place',
        'fabric_velour',
        'fabric_flock',
        'fabric_boucle',
      ].sort()
    );
  });

  test('значения допов соответствуют прайсу', () => {
    const byId = Object.fromEntries(EXTRA_SERVICES.map((s) => [s.id, s]));
    expect(byId.heavy_soil.value).toBe(1.2); // +20%
    expect(byId.fabric_velour.value).toBe(1.3); // +30%
    expect(byId.fabric_flock.value).toBe(1.4); // +40%
    expect(byId.fabric_boucle.value).toBe(1.5); // +50%
    expect(byId.odor_removal.value).toBe(800);
    expect(byId.fast_drying.value).toBe(1500);
    expect(byId.sleep_place.value).toBe(800);
    expect(byId.seat_place.value).toBe(500);
  });

  test('ткани — только наценки и входят в общий список', () => {
    expect(FABRIC_SERVICE_IDS).toEqual(['fabric_velour', 'fabric_flock', 'fabric_boucle']);
    for (const id of FABRIC_SERVICE_IDS) {
      const service = EXTRA_SERVICES.find((s) => s.id === id);
      expect(service?.priceMode).toBe('multiplier');
    }
  });

  test('справочная таблица /ceny содержит ключевые позиции прайса', () => {
    const labels = PRICE_EXTRAS_TABLE.map((row) => row.label).join('; ');
    expect(labels).toContain('Выдвижное спальное место');
    expect(labels).toContain('Подушки');
    expect(labels).toContain('Выведение запахов');
    expect(labels).toContain('Быстрая сушка');
  });
});

describe('calcPrice', () => {
  test('базовые цены за один диван (по прайсу)', () => {
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 1, services: [] })).toBe(1700);
    expect(calcPrice({ furnitureType: 'SOFA_3', units: 1, services: [] })).toBe(2100);
    expect(calcPrice({ furnitureType: 'CORNER_SOFA', units: 1, services: [] })).toBe(2600);
    expect(calcPrice({ furnitureType: 'CORNER_SOFA_5', units: 1, services: [] })).toBe(3000);
    expect(calcPrice({ furnitureType: 'U_SHAPE_SOFA', units: 1, services: [] })).toBe(4300);
  });

  test('несколько диванов умножаются на количество', () => {
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 2, services: [] })).toBe(3400);
    expect(calcPrice({ furnitureType: 'U_SHAPE_SOFA', units: 3, services: [] })).toBe(12900);
  });

  test('ограничение количества снизу и сверху (clamping)', () => {
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 0, services: [] })).toBe(
      calcPrice({ furnitureType: 'SOFA_2', units: FURNITURE_PRICING.SOFA_2.minUnits, services: [] })
    );
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 999, services: [] })).toBe(
      calcPrice({ furnitureType: 'SOFA_2', units: FURNITURE_PRICING.SOFA_2.maxUnits, services: [] })
    );
  });

  test('дробное количество округляется до целого', () => {
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 1.4, services: [] })).toBe(1700);
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 1.6, services: [] })).toBe(3400);
  });

  test('сильные загрязнения: +20% с округлением до 50 ₽ вверх', () => {
    // 1700 × 1.2 = 2040 → 2050
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 1, services: ['heavy_soil'] })).toBe(2050);
  });

  test('наценки за ткань применяются', () => {
    expect(calcPrice({ furnitureType: 'CORNER_SOFA', units: 1, services: ['fabric_boucle'] })).toBe(3900); // 2600×1.5
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 1, services: ['fabric_velour'] })).toBe(2250); // 1700×1.3=2210→2250
    expect(calcPrice({ furnitureType: 'SOFA_2', units: 1, services: ['fabric_flock'] })).toBe(2400); // 1700×1.4=2380→2400
  });

  test('мультипликаторы сочетаются: ткань + сильные загрязнения', () => {
    // 2600 × 1.5 × 1.2 = 4680 → 4700
    expect(
      calcPrice({ furnitureType: 'CORNER_SOFA', units: 1, services: ['fabric_boucle', 'heavy_soil'] })
    ).toBe(4700);
  });

  test('фиксированные допы прибавляются после мультипликаторов', () => {
    // 2600×1.5=3900 + 800 + 1500 = 6200
    expect(
      calcPrice({
        furnitureType: 'CORNER_SOFA',
        units: 1,
        services: ['fabric_boucle', 'odor_removal', 'fast_drying'],
      })
    ).toBe(6200);
  });

  test('элементы дивана: спальное и посадочное место', () => {
    // 2600 + 800 + 500 = 3900
    expect(
      calcPrice({ furnitureType: 'CORNER_SOFA', units: 1, services: ['sleep_place', 'seat_place'] })
    ).toBe(3900);
  });

  test('все опции вместе', () => {
    // 1700×1.2×1.3=2652 + 800+1500+800+500 = 6252 → округление до 50 вверх → 6300
    expect(
      calcPrice({
        furnitureType: 'SOFA_2',
        units: 1,
        services: ['heavy_soil', 'fabric_velour', 'odor_removal', 'fast_drying', 'sleep_place', 'seat_place'],
      })
    ).toBe(6300);
  });

  test('неизвестный тип → 0', () => {
    expect(calcPrice({ furnitureType: 'NOPE' as SofaTypeKey, units: 1, services: [] })).toBe(0);
  });
});

describe('priceFrom', () => {
  test('возвращает минимальную цену типа дивана', () => {
    expect(priceFrom('SOFA_2')).toBe(1700);
    expect(priceFrom('SOFA_3')).toBe(2100);
    expect(priceFrom('CORNER_SOFA')).toBe(2600);
    expect(priceFrom('CORNER_SOFA_5')).toBe(3000);
    expect(priceFrom('U_SHAPE_SOFA')).toBe(4300);
  });
});
