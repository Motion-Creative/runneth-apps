import { brand, colors } from '../theme'

/**
 * Holding page shown while the use-case library is rebuilt into Runneth packages.
 * Rendered instead of the catalog when revamp mode is on (see main.tsx), so the
 * site stays live and never touches catalog.json.
 */
export const Revamp = (): JSX.Element => (
  <main
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '48px 24px',
      background: `radial-gradient(120% 80% at 50% -10%, ${brand.lime}33 0%, ${brand.sky}22 34%, ${brand.white} 68%)`,
      color: colors.textBody,
    }}
  >
    <div style={{ maxWidth: 560 }}>
      <span
        style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginBottom: 20,
        }}
      >
        Runneth Library
      </span>

      <h1
        style={{
          fontSize: 'clamp(34px, 6vw, 52px)',
          lineHeight: 1.05,
          fontWeight: 700,
          margin: '0 0 18px',
          letterSpacing: '-0.02em',
        }}
      >
        Pardon the sawdust.
      </h1>

      <p style={{ fontSize: 'clamp(16px, 2.4vw, 19px)', lineHeight: 1.5, margin: '0 0 14px' }}>
        We&rsquo;re rebuilding the Runneth library into a tighter set of packages. Fewer knobs,
        sharper tools, same superpowers. Back very soon.
      </p>

      <p style={{ fontSize: 14, lineHeight: 1.5, color: colors.textMuted, margin: '0 0 32px' }}>
        Already running Runneth? Your installed use cases keep working. This is just the shop
        window.
      </p>

      <a
        href="https://motionapp.com"
        style={{
          display: 'inline-block',
          padding: '12px 22px',
          borderRadius: 999,
          background: colors.primary,
          color: brand.white,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Back to Motion
      </a>
    </div>

    <footer style={{ marginTop: 56, fontSize: 12, color: colors.textSubtle }}>Made by Motion.</footer>
  </main>
)
