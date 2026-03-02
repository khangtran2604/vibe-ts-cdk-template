import logoUrl from "../../assets/logo.svg";

/**
 * Home page — the default landing page for the application.
 *
 * Replace or extend this component as you build out the application.
 * Feature-specific components live in ./components/.
 */
export function HomePage() {
  return (
    <main style={styles.main}>
      <img src={logoUrl} alt="App logo" style={styles.logo} />
      <h1 style={styles.heading}>Welcome</h1>
      <p style={styles.subtitle}>
        Your AWS serverless app is ready. Start building in{" "}
        <code>frontend/src/features/</code>.
      </p>
    </main>
  );
}

const styles = {
  main: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#1a1a2e",
    backgroundColor: "#f8f9fa",
    gap: "1rem",
    padding: "2rem",
  },
  logo: {
    width: "80px",
    height: "80px",
  },
  heading: {
    margin: 0,
    fontSize: "2.5rem",
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#6c757d",
    textAlign: "center" as const,
    maxWidth: "480px",
    lineHeight: 1.6,
  },
} as const;
