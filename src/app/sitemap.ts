import type { MetadataRoute } from 'next';
import { siteConfig, SERVICE_PAGES } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/uslugi`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/ceny`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/kontakty`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
  ];

  const servicePages: MetadataRoute.Sitemap = SERVICE_PAGES.map((service) => ({
    url: `${base}/uslugi/${service.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...servicePages];
}
