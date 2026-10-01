import {
  calcPrice,
  priceFrom,
  FURNITURE_PRICING,
  type FurnitureTypeKey,
} from '@/config/pricing';

describe('calcPrice', () => {
  test('базовая цена: диван 2 места', () => {
    expect(calcPrice({ furnitureType: 'SOFA', units: 2, services: [] })).toBe(3000);
  });

  test('ограничение объёма снизу и сверху (clamping)', () => {
    expect(calcPrice({ furnitureType: 'SOFA', units: 0, services: [] })).toBe(
      calcPrice({ furnitureType: 'SOFA', units: FURNITURE_PRICING.SOFA.minUnits, services: [] })
    );
    expect(calcPrice({ furnitureType: 'SOFA', units: 999, services: [] })).toBe(
      calcPrice({ furnitureType: 'SOFA', units: FURNITURE_PRICING.SOFA.maxUnits, services: [] })
    );
  });

  test('дробный объём округляется', () => {
    expect(calcPrice({ furnitureType: 'SOFA', units: 2.4, services: [] })).toBe(3000);
  });

  test('мультипликаторы применяются последовательно', () => {
    const price = calcPrice({ furnitureType: 'SOFA', units: 2, services: ['heavy_soil', 'urgent'] });
    // 1500*2 = 3000; *1.25 = 3750; *1.2 = 4500 → округление до 50 → 4500
    expect(price).toBe(4500);
  });

  test('фиксированные допы прибавляются после мультипликаторов', () => {
    const price = calcPrice({
      furnitureType: 'SOFA',
      units: 2,
      services: ['heavy_soil', 'antibacterial', 'odor_removal'],
    });
    // 3000 * 1.25 = 3750 + 900 + 1200 = 5850
    expect(price).toBe(5850);
  });

  test('округление до 50 ₽ в большую сторону', () => {
    const price = calcPrice({ furnitureType: 'CARPET', units: 3, services: ['heavy_soil'] });
    // 350*3=1050 *1.25=1312.5 → 1350
    expect(price).toBe(1350);
  });

  test('неизвестный тип мебели → 0', () => {
    expect(calcPrice({ furnitureType: 'NOPE' as FurnitureTypeKey, units: 1, services: [] })).toBe(0);
  });

  test('ковёр считается за м²', () => {
    expect(calcPrice({ furnitureType: 'CARPET', units: 10, services: [] })).toBe(3500);
  });
});

describe('priceFrom', () => {
  test('возвращает минимальную цену конфигурации', () => {
    expect(priceFrom('SOFA')).toBe(1500);
    expect(priceFrom('CORNER_SOFA')).toBe(
      calcPrice({ furnitureType: 'CORNER_SOFA', units: FURNITURE_PRICING.CORNER_SOFA.minUnits, services: [] })
    );
  });
});
