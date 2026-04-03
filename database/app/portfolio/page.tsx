import { ThemeScope } from '@/lib/fadhilweblib';

export default function PortfolioPage() {
  return (
    <ThemeScope as="main" theme="portfolio" style={{ minHeight: '100vh' }}>
      <iframe
        title="My-Web-Portfolio clone"
        src="/portfolio-clone/index.html"
        style={{ border: '0', width: '100%', minHeight: '100vh', display: 'block' }}
      />
    </ThemeScope>
  );
}
