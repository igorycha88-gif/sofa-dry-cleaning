import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { BentoAdvantages } from '@/components/home/BentoAdvantages';
import { StepsTimeline } from '@/components/home/StepsTimeline';
import { Calculator } from '@/components/home/Calculator';
import { BeforeAfterSlider } from '@/components/home/BeforeAfterSlider';
import { Reviews } from '@/components/home/Reviews';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { CtaSection } from '@/components/home/CtaSection';
import { FAQ_HOME } from '@/config/site';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Химчистка диванов на дому — цена от 1 700 ₽ | ${siteConfig.name}`,
  description: siteConfig.description,
  alternates: { canonical: '/' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_HOME.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero />
      <BentoAdvantages />
      <StepsTimeline />
      <Calculator />
      <BeforeAfterSlider />
      <Reviews />
      <section className="container-x py-24" id="faq">
        <FaqAccordion items={FAQ_HOME} />
      </section>
      <CtaSection />
    </>
  );
}
