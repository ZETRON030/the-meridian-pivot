import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface QRScannerProps {
  onScan: (attendeeId: string) => void;
}

const SCANNER_ELEMENT_ID = "solstice-qr-reader";

function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        setIsStarting(true);
        setScannerError(null);
        hasScannedRef.current = false;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);

        scannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: "environment"
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250
            },
            aspectRatio: 1
          },
          async (decodedText) => {
            /*
             * Prevent the same QR code from firing multiple
             * callbacks while the camera is still scanning.
             *
             * This is UI-level protection only.
             *
             * The backend/database remains responsible for
             * authoritative duplicate-scan protection.
             */
            if (hasScannedRef.current) {
              return;
            }

            hasScannedRef.current = true;

            const attendeeId = decodedText.trim();

            if (!attendeeId) {
              hasScannedRef.current = false;
              return;
            }

            onScan(attendeeId);
          },
          () => {
            /*
             * QR decoding failures are normal while the camera
             * is searching for a QR code.
             *
             * Do not display an error for every failed frame.
             */
          }
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch (error) {
        console.error("Unable to start QR scanner:", error);

        if (mounted) {
          setIsStarting(false);
          setScannerError(
            "Unable to access the camera. Please allow camera access and try again."
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;

      const scanner = scannerRef.current;

      if (
        scanner &&
        scanner.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        scanner
          .stop()
          .catch((error) => {
            console.error("Error stopping QR scanner:", error);
          });
      }

      scannerRef.current = null;
    };
  }, [onScan]);

  return (
    <section className="qr-scanner-container">
      <div
        id={SCANNER_ELEMENT_ID}
        className="qr-scanner"
        aria-label="QR code scanner"
      />

      {isStarting && (
        <p className="scanner-message">
          Starting camera...
        </p>
      )}

      {scannerError && (
        <div
          className="scanner-error"
          role="alert"
        >
          <p>{scannerError}</p>

          <p>
            Please check your browser camera permissions
            and try again.
          </p>
        </div>
      )}

      {!isStarting && !scannerError && (
        <p className="scanner-instruction">
          Position your conference QR code inside the box.
        </p>
      )}
    </section>
  );
}

export default QRScanner;