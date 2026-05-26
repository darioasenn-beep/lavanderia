"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Html5Qrcode } from "html5-qrcode"
import { QrCode, ArrowRight, X } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanState, setScanState] = useState<"idle" | "searching" | "success" | "error">("idle")
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!scannerOpen) return

    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("qr-reader")

        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
          async (decodedText) => {
            setScanState("searching")

            if (navigator.vibrate) navigator.vibrate(40)

            setTimeout(async () => {
              setScanState("success")
              await scannerRef.current?.stop()

              const match = decodedText.trim().match(/\/q\/([A-Za-z0-9_-]+)/i)
              const cleanedId = match ? match[1] : decodedText.replace("BOLSA-", "")

              setTimeout(() => {
                window.location.href = `/bolsa/${cleanedId}`
              }, 900)
            }, 800)
          },
          () => {}
        )
      } catch {
        setScanState("error")
      }
    }

    startScanner()

    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [scannerOpen])

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-off-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(27,42,74,0.04),transparent_50%)]" />

      <motion.div
        animate={{
          opacity: scannerOpen ? 0.15 : 1,
          scale: scannerOpen ? 0.98 : 1,
          filter: scannerOpen ? "blur(6px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-20 lg:flex-row"
      >
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="/logo.svg"
              alt="lavaderIA"
              className="mb-10 h-14 md:h-20 w-auto object-contain"
            />

            <h2 className="max-w-xl text-4xl font-light leading-tight text-slate-900 md:text-6xl">
              Tu ropa,<br />
              conectada.
            </h2>

            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
              Seguimiento en tiempo real, historial de prendas y acceso instantáneo mediante QR inteligente.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setScannerOpen(true)}
                className="group relative overflow-hidden rounded-2xl bg-navy px-8 py-4 font-medium text-white transition-all duration-300 hover:bg-navy-light hover:shadow-xl active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  Escanear Bolsa
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <Link
                href="/q/"
                className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                Acceso Clientes
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gold" />
                Tracking en tiempo real
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gold" />
                Historial de prendas
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gold" />
                Wallet ECO
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative mt-20 flex flex-1 items-center justify-center lg:mt-0">
          <div className="absolute h-[420px] w-[420px] rounded-full bg-gold/5 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative h-[500px] w-[360px] overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center">
                <div className="rounded-2xl border border-slate-100 bg-off-white p-6">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <QrCode className="h-32 w-32 text-slate-800" />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="font-mono text-xs text-slate-400">NÚMERO DE BOLSA</div>
                  <div
                    className="mt-1 font-mono text-lg text-navy"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    BOLSA-84722
                  </div>
                </div>

                <div className="mt-8 w-full space-y-2">
                  <StatusItem label="Recepción" active />
                  <StatusItem label="Lavado" active />
                  <StatusItem label="Secado" />
                  <StatusItem label="Listo para retirar" />
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5 }}
              className="absolute -right-8 top-8 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
            >
              <div className="text-[11px] text-slate-400">Estado actual</div>
              <div className="mt-0.5 text-sm font-medium text-navy">En lavado</div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {scannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm px-4"
            >
              <button
                onClick={async () => {
                  await scannerRef.current?.stop()
                  setScannerOpen(false)
                  setScanState("idle")
                }}
                className="absolute right-6 top-3 z-50 rounded-full bg-white/80 p-1.5 text-slate-500 shadow-sm backdrop-blur-md hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="overflow-hidden rounded-[24px] bg-white p-4 shadow-2xl">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-medium text-slate-900">Escaneá tu bolsa</h3>
                  <p className="mt-1 text-sm text-slate-400">Apuntá la cámara al código QR.</p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
                  <div id="qr-reader" className="overflow-hidden" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[220px] w-[220px] rounded-[24px] border-2 border-gold shadow-[0_0_30px_rgba(201,168,76,0.3)]" />
                  </div>
                </div>

                <div className="mt-4 text-center text-sm">
                  {scanState === "idle" && <span className="text-slate-400">Escaneando bolsa...</span>}
                  {scanState === "searching" && (
                    <span className="text-navy">Retirando información de tu pedido...</span>
                  )}
                  {scanState === "success" && <span className="text-green-600 font-medium">Bolsa encontrada ✓</span>}
                  {scanState === "error" && <span className="text-red-500">No se pudo acceder a la cámara</span>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function StatusItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-off-white/50 px-4 py-2.5">
      <div
        className={`h-2 w-2 rounded-full ${
          active ? "bg-navy shadow-[0_0_8px_rgba(27,42,74,0.35)]" : "bg-slate-200"
        }`}
      />
      <span className={`text-sm ${active ? "font-medium text-navy" : "text-slate-400"}`}>{label}</span>
    </div>
  )
}
