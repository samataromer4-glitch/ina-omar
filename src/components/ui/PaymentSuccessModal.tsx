import React from 'react';
import { CheckCircle2, Download, Receipt, Send, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { formatMoney, generateReceiptPDF, openWhatsApp } from '../finance/financeUtils';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  paymentDetails: {
    receiptNumber: string;
    studentName: string;
    studentClass?: string;
    guardianPhone?: string;
    amountPaid: number;
    remainingBalance: number;
    paymentMethod: string;
    invoiceNumber: string;
    paymentDate: string;
  };
  currency: string;
  schoolName: string;
  onViewReceipt: () => void;
  onRecordAnother: () => void;
  onClose: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  paymentDetails,
  currency,
  schoolName,
  onViewReceipt,
  onRecordAnother,
  onClose
}) => {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    generateReceiptPDF(
      schoolName,
      currency,
      {
        receiptNumber: paymentDetails.receiptNumber,
        invoiceNumber: paymentDetails.invoiceNumber,
        studentName: paymentDetails.studentName,
        className: paymentDetails.studentClass || 'N/A',
        paymentMethod: paymentDetails.paymentMethod,
        paymentDate: paymentDetails.paymentDate,
        amount: paymentDetails.amountPaid,
        remainingBalance: paymentDetails.remainingBalance,
        receivedBy: 'Accountant'
      }
    );
  };

  const handleSendWhatsApp = () => {
    if (!paymentDetails.guardianPhone) {
      alert('Lama hayo telefoonka waalidka (No guardian phone available)');
      return;
    }
    const msg = `Waad ku mahadsan tahay bixinta lacagta dugsiga.\nArdayga: ${paymentDetails.studentName}\nRasiidka: ${paymentDetails.receiptNumber}\nCadadka: ${formatMoney(paymentDetails.amountPaid, currency)}\nBaaqiga Hadhey: ${formatMoney(paymentDetails.remainingBalance, currency)}`;
    openWhatsApp(paymentDetails.guardianPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0f0f0f] border border-[#ffffff15] rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#737373] hover:text-white p-1 rounded-sm transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Success Icon & Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Payment Confirmed
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] tracking-tight">
            Lacag Bixintu Way Guuleysatay!
          </h2>
          <p className="text-xs text-[#a3a3a3]">
            Rasiid rasmi ah ayaa loo sameeyay ardayga{' '}
            <span className="text-[#f5f5f5] font-semibold">{paymentDetails.studentName}</span>
          </p>
        </div>

        {/* Financial Receipt Summary Box */}
        <div className="p-4 sm:p-5 rounded-sm bg-[#141414] border border-[#ffffff10] space-y-4">
          <div className="flex items-center justify-between border-b border-[#ffffff08] pb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Rasiid Lambar (Receipt #)
              </span>
              <span className="text-xs font-mono font-bold text-[#c4b5fd]">
                {paymentDetails.receiptNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Habka Lacag Bixinta (Method)
              </span>
              <span className="text-xs font-semibold text-[#e5e5e5]">
                {paymentDetails.paymentMethod}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-sm bg-[#0a0a0a] border border-[#ffffff05]">
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Cadadka La Qabtay (Received)
              </span>
              <span className="text-xl font-mono font-bold text-emerald-400">
                {formatMoney(paymentDetails.amountPaid, currency)}
              </span>
            </div>

            <div className="p-3 rounded-sm bg-[#0a0a0a] border border-[#ffffff05]">
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Baaqiga Hadhey (Balance)
              </span>
              <span className={`text-xl font-mono font-bold ${
                paymentDetails.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {formatMoney(paymentDetails.remainingBalance, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={onViewReceipt}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-sm bg-[#ffffff08] hover:bg-[#ffffff12] border border-[#ffffff15] text-[#f5f5f5] text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#c4b5fd]" />
              <span>Arag Rasiidka</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-sm bg-[#ffffff08] hover:bg-[#ffffff12] border border-[#ffffff15] text-[#f5f5f5] text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>PDF Rasiid</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-sm bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={onRecordAnother}
              className="flex items-center gap-1.5 text-xs text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors py-2 px-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Qabo Lacag Kale (Record Another)</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Dhammee (Done)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
