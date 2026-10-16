"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Camera barcode scanner for the book's ISBN (an EAN-13 barcode starting with 978/979).
 * Keeps scanning until the parent stops rendering it; the same code is reported at most once
 * every 2.5 seconds so a bad read never locks the scanner.
 */
export function Scanner({ onDetect }: { onDetect: (code: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const last = useRef({ code: "", at: 0 });
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode("varaq-scanner", {
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A],
          useBarCodeDetector: true, // use the browser's native detector when available (much more reliable)
          verbose: false,
        } as never);
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 12,
            // Wide, short frame: barcodes are wide rectangles.
            qrbox: (w: number, h: number) => ({
              width: Math.floor(Math.min(w, h * 1.6) * 0.9),
              height: Math.floor(Math.min(w, h * 1.6) * 0.45),
            }),
            videoConstraints: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          } as never,
          (text) => {
            const now = Date.now();
            if (text === last.current.code && now - last.current.at < 2500) return;
            last.current = { code: text, at: now };
            onDetectRef.current(text);
          },
          () => {},
        );
        setStarting(false);
      } catch {
        setStarting(false);
        setError(
          "دسترسی به دوربین ممکن نیست. در مرورگر اجازه دسترسی بده (روی گوشی باید آدرس https یا localhost باشد) یا شابک را دستی وارد کن.",
        );
      }
    })();

    return () => {
      cancelled = true;
      if (scanner?.isScanning)
        scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {});
    };
  }, []);

  return (
    <div>
      <div className="mb-3 rounded-xl bg-muted p-3 text-sm leading-relaxed">
        <b>چطور کار می‌کند؟</b> پشت جلد هر کتاب یک بارکد هست که زیرش یک عدد ۱۰ یا ۱۳ رقمی (شابک) چاپ شده، معمولاً با ۹۷۸ شروع می‌شود. دوربین
        همان بارکد را می‌خواند و اسم و نویسنده کتاب خودکار پر می‌شود.
      </div>
      <div id="varaq-scanner" className="overflow-hidden rounded-xl bg-black" style={{ minHeight: 240 }} dir="ltr" />
      {starting && <p className="mt-2 text-center text-xs text-muted-foreground">در حال روشن کردن دوربین…</p>}
      {error ? (
        <p className="mt-2 text-sm text-danger">{error}</p>
      ) : (
        <ul className="mt-3 list-disc space-y-1 ps-5 text-xs text-muted-foreground">
          <li>بارکد را کامل و صاف داخل کادر بگیر، حدود ۱۵ تا ۲۰ سانتی‌متر دورتر از دوربین.</li>
          <li>نور کافی باشد و روی بارکد انعکاس نور نیفتد.</li>
          <li>اگر نخواند، تب «شابک» را باز کن و عدد زیر بارکد را تایپ کن.</li>
        </ul>
      )}
    </div>
  );
}
