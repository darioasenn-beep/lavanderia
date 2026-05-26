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
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#050816] text-white">
      {/* BG — gradiente + grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_40%)]" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* HERO CONTENT */}
      <motion.div
        animate={{
          opacity: scannerOpen ? 0.2 : 1,
          scale: scannerOpen ? 0.98 : 1,
          filter: scannerOpen ? "blur(8px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-20 lg:flex-row"
      >
        {/* LEFT COLUMN */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* LOGO */}
            <h1 className="mb-8 text-6xl font-light tracking-tight md:text-8xl">
              <span
                className="font-serif text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                lavader
              </span>
              <span
                className="ml-1 font-mono text-cyan-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                IA
              </span>
            </h1>

            {/* HEADLINE */}
            <h2 className="max-w-xl text-3xl font-medium leading-tight text-white md:text-5xl">
              Tu ropa,<br />
              conectada.
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
              Seguimiento en tiempo real, historial de prendas y acceso instantáneo mediante QR inteligente.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => setScannerOpen(true)}
                className="group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400 px-8 py-5 font-medium text-[#050816] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.35)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  Escanear Bolsa
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </button>

              <Link
                href="/q/"
                className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-white backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10"
              >
                Acceso Clientes
              </Link>
            </div>

            {/* FEATURES */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-zinc-500">
              <div>• Tracking en tiempo real</div>
              <div>• Historial de prendas</div>
              <div>• Wallet ECO</div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN — BAG MOCKUP */}
        <div className="relative mt-20 flex flex-1 items-center justify-center lg:mt-0">
          <div className="absolute h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative h-[520px] w-[380px] overflow-hidden rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent" />

              <div className="relative flex h-full flex-col items-center justify-center">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
                  <div className="rounded-2xl bg-white p-5">
                    <QrCode className="h-36 w-36 text-black" />
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <div
                    className="font-mono text-cyan-400"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    BOLSA-84722
                  </div>
                  <div className="mt-3 text-sm text-zinc-400">Lavado Inteligente</div>
                </div>

                <div className="mt-10 w-full space-y-3">
                  <StatusItem label="Recepción" active />
                  <StatusItem label="Lavado" active />
                  <StatusItem label="Secado" />
                  <StatusItem label="Listo para retirar" />
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -right-10 top-10 rounded-2xl border border-cyan-400/20 bg-[#0a1024]/80 px-5 py-4 backdrop-blur-xl"
            >
              <div className="text-xs text-zinc-500">Estado actual</div>
              <div className="mt-1 text-cyan-400">En lavado</div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* QR MODAL */}
      <AnimatePresence>
        {scannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md px-6"
            >
              {/* CLOSE */}
              <button
                onClick={async () => {
                  await scannerRef.current?.stop()
                  setScannerOpen(false)
                  setScanState("idle")
                }}
                className="absolute right-8 top-4 z-50 rounded-full border border-white/10 bg-white/10 p-2 text-white backdrop-blur-xl"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0a1024] p-5 shadow-2xl">
                <div className="mb-5 text-center">
                  <h3 className="text-xl font-medium">Escaneá tu bolsa</h3>
                  <p className="mt-2 text-sm text-zinc-500">Apuntá la cámara al QR inteligente.</p>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10">
                  <div id="qr-reader" className="overflow-hidden" />

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[260px] w-[260px] rounded-[32px] border-2 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)]" />
                  </div>
                </div>

                <div className="mt-5 text-center">
                  {scanState === "idle" && <p className="text-zinc-500">Escaneando bolsa...</p>}
                  {scanState === "searching" && (
                    <p className="text-cyan-400">Retirando información de tu pedido...</p>
                  )}
                  {scanState === "success" && <p className="text-green-400">Bolsa encontrada ✓</p>}
                  {scanState === "error" && (
                    <p className="text-red-400">No se pudo acceder a la cámara</p>
                  )}
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
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          active
            ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
            : "bg-zinc-700"
        }`}
      />
      <span className={`text-sm ${active ? "text-white" : "text-zinc-500"}`}>{label}</span>
    </div>
  )
}
