import { siteConfig, SERVICE_PAGES, FAQ_HOME } from '@/config/site';

describe('siteConfig — контакты из da-dryclean.ru', () => {
  test('телефоны совпадают с сайтом da-dryclean.ru', () => {
    expect(siteConfig.phone).toBe('+7 (495) 226-15-73');
    expect(siteConfig.phoneHref).toBe('tel:+74952261573');
    expect(siteConfig.phone2).toBe('+7 (985) 226-15-73');
    expect(siteConfig.phone2Href).toBe('tel:+79852261573');
  });

  test('email совпадает', () => {
    expect(siteConfig.email).toBe('da-drycleaning@mail.ru');
  });

  test('режим работы: ежедневно 09:00–21:00', () => {
    expect(siteConfig.workingHours).toContain('09:00');
    expect(siteConfig.workingHours).toContain('21:00');
  });

  test('адрес совпадает', () => {
    expect(siteConfig.address).toBe('г. Москва, Ферганский проезд, 7, корп. 4, стр. 1');
  });

  test('ссылки на мессенджеры заполнены', () => {
    expect(siteConfig.messengerLinks.telegram).toBe('https://t.me/DADryCleaning');
    expect(siteConfig.messengerLinks.whatsapp).toBe('https://wa.me/79852261573');
    expect(siteConfig.messengerLinks.max).toContain('https://max.ru/');
    expect(siteConfig.messengerLinks.yandexMaps).toContain('yandex.com/maps');
  });

  test('бренд «ЧистоДиван» не менялся (решение заказчика)', () => {
    expect(siteConfig.name).toBe('ЧистоДиван');
  });
});

describe('SERVICE_PAGES — только диваны', () => {
  test('ровно 2 услуги: прямой и угловой диван', () => {
    expect(SERVICE_PAGES.map((s) => s.slug)).toEqual(['divan', 'uglovoy-divan']);
  });

  test('цены в заголовках соответствуют прайсу', () => {
    expect(SERVICE_PAGES[0].title).toContain('от 1 700 ₽');
    expect(SERVICE_PAGES[1].title).toContain('от 2 600 ₽');
  });

  test('нет упоминаний не-диванных услуг', () => {
    const allText = JSON.stringify(SERVICE_PAGES) + JSON.stringify(FAQ_HOME);
    for (const banned of ['матрас', 'ковр', 'кресл', 'стул', 'пуф']) {
      expect(allText.toLowerCase()).not.toContain(banned);
    }
  });
});
