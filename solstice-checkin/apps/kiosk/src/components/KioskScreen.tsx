import type { ReactNode } from "react";

interface KioskScreenProps {
  children: ReactNode;
}

function KioskScreen({ children }: KioskScreenProps) {
  return (
    <main className="kiosk-container">
      <section
        className="kiosk-card"
        aria-label="Solstice Events conference check-in kiosk"
      >
        <header className="kiosk-header">
          <div className="brand">
            <h1>Solstice Events Co.</h1>

            <p>
              Tech Conference Check-In
            </p>
          </div>
        </header>

        <div className="kiosk-content">
          {children}
        </div>

        <footer className="kiosk-footer">
          <small>
            Solstice Events Co. • Conference Check-In
          </small>
        </footer>
      </section>
    </main>
  );
}

export default KioskScreen;