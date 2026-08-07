import './globals.css';

export const metadata = {
  title: 'LoanEase — Loan Eligibility & Lead Management',
  description: 'Apply for Home Loans and Loans Against Property. Check your eligibility instantly with our smart Business Rule Engine.',
  keywords: 'loan, home loan, loan against property, credit score, eligibility',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
