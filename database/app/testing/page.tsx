import { ThemeScope } from '@/lib/fadhilweblib';

export default function TestingPage() {
  return (
    <ThemeScope as="main" theme="game" style={{ minHeight: '100vh' }}>
      <iframe
        title="My-Web-Portfolio testing clone"
        src="/portfolio-clone/testing/index.html"
        style={{ border: '0', width: '100%', minHeight: '100vh', display: 'block' }}
      />
    </ThemeScope>
  );
}
