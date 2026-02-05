import './globals.css'

export const metadata = {
  title: 'AgentScore + SkillBond',
  description: 'Autonomous agent marketplace powered by USDC and reputation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white">{children}</body>
    </html>
  )
}
