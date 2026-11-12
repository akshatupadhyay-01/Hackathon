import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  CheckCircle2,
  Leaf,
  Calendar,
  Users,
  MapPin,
  ShieldCheck,
  Award,
  Sparkles,
  QrCode as QrIcon
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Destination, LocalGuide } from '../../../types/database';

export interface DigitalEcoPassProps {
  bookingId: string;
  destination: Destination;
  visitorName: string;
  numberOfGuests: number;
  visitDate: string;
  guide?: LocalGuide | null;
  totalAmountInr?: number;
  status?: string;
  onClose?: () => void;
}

export function DigitalEcoPass({
  bookingId,
  destination,
  visitorName,
  numberOfGuests,
  visitDate,
  guide,
  totalAmountInr = 0,
  status = 'CONFIRMED',
  onClose,
}: DigitalEcoPassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const passContainerRef = useRef<HTMLDivElement>(null);

  // Verification Payload for the QR code
  const qrPayload = [
    `EcoPass Verification`,
    `Booking ID: ${bookingId}`,
    `Destination: ${destination.name}`,
    `Visitor: ${visitorName}`,
    `Guests: ${numberOfGuests}`,
    `Date: ${visitDate}`,
    `Status: ${status}`,
    `Authority: Jharkhand Tourism Eco-Board`,
  ].join('\n');

  // Generate real QR code image
  useEffect(() => {
    let isCancelled = false;

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#064e3b', // Deep forest emerald
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!isCancelled) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [qrPayload]);

  // Format date nicely
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(visitDate);
      if (isNaN(d.getTime())) return visitDate;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return visitDate;
    }
  }, [visitDate]);

  // Download pass as high quality PNG
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 640;
      const height = 900;
      canvas.width = width;
      canvas.height = height;

      // Draw Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw Header Background
      const headerGrad = ctx.createLinearGradient(0, 0, width, 140);
      headerGrad.addColorStop(0, '#064e3b');
      headerGrad.addColorStop(1, '#047857');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, 130);

      // Header Text
      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('JHARKHAND TOURISM • DIGITAL ECO-PASS', 40, 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.letterSpacing = '0px';
      ctx.fillText(destination.name, 40, 78);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${destination.district?.name || 'Jharkhand'} District • Sustainable Travel Permit`, 40, 102);

      // Booking ID & Status Bar
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(40, 150, width - 80, 54);
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 150, width - 80, 54);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('BOOKING ID', 55, 172);

      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(bookingId, 55, 194);

      // Status Pill
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(width - 170, 162, 115, 30, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('✓ CONFIRMED', width - 160, 182);

      // Pass Details Grid
      let curY = 240;
      const drawDetailRow = (label: string, value: string, y: number) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillText(label, 40, y);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(value, 40, y + 20);

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, y + 30);
        ctx.lineTo(width - 40, y + 30);
        ctx.stroke();
      };

      drawDetailRow('PRIMARY VISITOR', visitorName, curY);
      curY += 48;
      drawDetailRow('DATE OF VISIT', `${formattedDate} (${visitDate})`, curY);
      curY += 48;
      drawDetailRow('GUEST CAPACITY', `${numberOfGuests} ${numberOfGuests === 1 ? 'Guest' : 'Guests'} (Permitted)`, curY);
      curY += 48;

      if (guide) {
        drawDetailRow('CERTIFIED LOCAL GUIDE', `${guide.name} (${guide.badge})`, curY);
        curY += 48;
      }

      drawDetailRow(
        'ENTRY PASS CHARGES',
        totalAmountInr === 0 ? 'Free Eco Sanctuary Entry' : `₹${totalAmountInr} INR (Paid & Verified)`,
        curY
      );
      curY += 60;

      // Draw QR Code
      if (qrDataUrl) {
        const qrImage = new Image();
        qrImage.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          qrImage.onload = resolve;
          qrImage.src = qrDataUrl;
        });

        const qrSize = 170;
        const qrX = (width - qrSize) / 2;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(qrX - 10, curY - 10, qrSize + 20, qrSize + 20);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(qrX - 10, curY - 10, qrSize + 20, qrSize + 20);

        ctx.drawImage(qrImage, qrX, curY, qrSize, qrSize);
        curY += qrSize + 25;
      }

      // Responsible Tourism Notice
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RESPONSIBLE TOURISM PLEDGE', width / 2, curY);
      curY += 16;

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        '"Please follow local eco-tourism guidelines and help protect Jharkhand\'s',
        width / 2,
        curY
      );
      curY += 15;
      ctx.fillText(
        'natural and cultural heritage."',
        width / 2,
        curY
      );
      curY += 28;

      // Footer note
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `Digital Reservation Eco-Pass • Issued: ${new Date().toLocaleDateString('en-IN')}`,
        width / 2,
        curY
      );

      // Trigger Download
      const link = document.createElement('a');
      link.download = `EcoPass-${bookingId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating pass download:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Print Pass
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Printable / Viewable Pass Card */}
      <div
        ref={passContainerRef}
        id="digital-eco-pass-printable"
        className="relative overflow-hidden rounded-3xl border-2 border-emerald-600/60 dark:border-emerald-500/40 bg-white dark:bg-stone-900 shadow-2xl transition-all"
      >
        {/* Pass Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-5 sm:p-6 text-white relative">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Leaf className="h-4 w-4 text-emerald-200" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200 block">
                  Jharkhand Tourism
                </span>
                <span className="text-xs font-semibold text-emerald-100">
                  Digital Eco-Pass Permit
                </span>
              </div>
            </div>

            {/* CONFIRMED STATUS BADGE */}
            <div className="flex items-center gap-1.5 bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md animate-in fade-in zoom-in-95">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{status}</span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-3">
            {destination.name}
          </h3>
          <p className="text-xs text-emerald-200 font-medium">
            {destination.district?.name || 'Jharkhand'} District • Eco-Sanctuary Pass
          </p>
        </div>

        {/* Booking ID Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-y border-emerald-200 dark:border-emerald-800/80 px-5 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 dark:text-stone-400 block">
              Booking ID
            </span>
            <span className="font-mono text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300">
              {bookingId}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 dark:text-stone-400 block">
              Issued On
            </span>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Main Pass Body Details */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-semibold uppercase">
                Visitor Name
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate block mt-0.5">
                {visitorName}
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-semibold uppercase">
                Visit Date
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate block mt-0.5">
                {formattedDate}
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-semibold uppercase">
                Guests
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block mt-0.5">
                {numberOfGuests} {numberOfGuests === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-semibold uppercase">
                Pass Fee
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm block mt-0.5">
                {totalAmountInr === 0 ? 'Free Entry' : `₹${totalAmountInr} INR`}
              </span>
            </div>
          </div>

          {guide && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Certified Local Guide: {guide.name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {guide.badge} • Daily Rate: ₹{guide.daily_rate_inr}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Scannable Area */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="p-2 bg-white rounded-xl shadow-md border border-stone-200 dark:border-stone-700 shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${bookingId}`}
                  className="h-32 w-32 object-contain"
                />
              ) : (
                <div className="h-32 w-32 flex items-center justify-center bg-stone-100 text-stone-400">
                  <QrIcon className="h-8 w-8 animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Verified Scannable QR</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                Scan this QR code at the entry check-post to verify your Booking ID ({bookingId}) and tourist permit.
              </p>
              <span className="inline-block text-[10px] text-stone-400 font-medium">
                Digital Reservation Eco-Pass / Verified Demo Pass
              </span>
            </div>
          </div>

          {/* Responsible Tourism Quote */}
          <div className="p-3.5 bg-emerald-950/5 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/20 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1">
              <Leaf className="h-3 w-3" />
              Responsible Tourism Pledge
            </span>
            <p className="text-xs italic text-stone-600 dark:text-stone-400 leading-relaxed">
              "Please follow local eco-tourism guidelines and help protect Jharkhand's natural and cultural heritage."
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Download, Print, Close */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          onClick={handleDownload}
          disabled={isDownloading || !qrDataUrl}
          className="w-full sm:flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 text-xs gap-2 rounded-xl shadow-lg"
        >
          <Download className="h-4 w-4" />
          <span>{isDownloading ? 'Generating Image...' : 'Download Eco-Pass'}</span>
        </Button>

        <Button
          onClick={handlePrint}
          variant="outline"
          className="w-full sm:w-auto border-stone-300 dark:border-stone-700 font-bold py-3 text-xs gap-2 rounded-xl"
        >
          <Printer className="h-4 w-4" />
          <span>Print Eco-Pass</span>
        </Button>

        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full sm:w-auto text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
          >
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
