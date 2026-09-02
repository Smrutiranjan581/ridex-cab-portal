import React, { useRef } from 'react';
import { X, Download, Car, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceModal({ booking, onClose }) {
  const invoiceRef = useRef(null);

  if (!booking) return null;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FleetCorp-Invoice-${booking.bookingId || 'FLT-9042'}.pdf`);
    } catch (err) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Tax Invoice & Trip Summary</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900" ref={invoiceRef}>
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm">
                  🚖
                </div>
                <span className="text-xl font-extrabold tracking-tight">FleetCorp Mobility</span>
              </div>
              <p className="text-xs text-slate-500">Corporate Travel & Logistics Pvt Ltd</p>
              <p className="text-xs text-slate-500">GSTIN: 21AAACF1234K1Z8</p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-extrabold text-amber-600 tracking-wider">Original Tax Invoice</span>
              <h4 className="text-lg font-black font-mono mt-0.5">#{booking.bookingId || "FLT-9042"}</h4>
              <p className="text-xs text-slate-500">Date: {booking.scheduledDate || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To (Passenger)</p>
              <p className="font-bold text-sm text-slate-900">{booking.rider?.name || "Rahul Sharma"}</p>
              <p className="text-slate-600">{booking.rider?.company || "TCS Innovation Hub"}</p>
              <p className="text-slate-600">{booking.rider?.phone || "+91 9123456780"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Captain & Vehicle</p>
              <p className="font-bold text-sm text-slate-900">{booking.captain?.name || "Rajesh Mohapatra"}</p>
              <p className="text-slate-600">Maruti Swift Dzire ({booking.vehicleType?.toUpperCase() || "SEDAN"})</p>
              <p className="text-slate-600 font-mono font-bold">OD-02-BA-9876</p>
            </div>
          </div>

          <div className="py-4 border-b border-slate-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">📍 Pickup:</span>
              <span className="text-slate-700">{booking.pickup?.address || "Infocity IT Hub, Silicon Hills"}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">🏁 Drop:</span>
              <span className="text-slate-700">{booking.drop?.address || "Biju Patnaik Airport Terminal 1"}</span>
            </div>
          </div>

          <div className="py-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold text-left uppercase">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-center">Distance / Qty</th>
                  <th className="pb-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr>
                  <td className="py-2.5">Base Fare ({booking.vehicleType || 'Sedan'})</td>
                  <td className="py-2.5 text-center">1 Trip</td>
                  <td className="py-2.5 text-right">₹{booking.fare?.base || 90}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Distance Charge (₹18/km)</td>
                  <td className="py-2.5 text-center">{booking.distanceKm || 16.4} KM</td>
                  <td className="py-2.5 text-right">₹{booking.fare?.distanceRate || 295}</td>
                </tr>
                <tr>
                  <td className="py-2.5">GST / Taxes (5%)</td>
                  <td className="py-2.5 text-center">Standard</td>
                  <td className="py-2.5 text-right">₹{booking.fare?.taxes || 25}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
                  <td className="pt-3">Total Amount Paid</td>
                  <td className="pt-3 text-center">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">PAID</span>
                  </td>
                  <td className="pt-3 text-right text-base text-amber-600">₹{booking.fare?.total || 410}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            This is a computer-generated official tax invoice for corporate commute reimbursements.
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Paid via Corporate Wallet
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Invoice
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
