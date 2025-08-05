import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Copy, Download, Notebook as Robot } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
}

export function AIAnalysisModal({ isOpen, onClose, analysis }: AIAnalysisModalProps) {
  const [loading, setLoading] = useState(false);

  const handleCopyReport =  () => {
    navigator.clipboard.writeText(analysis);
    toast.success('تم نسخ التقرير بنجاح');
  };

  const handleDownloadPDF = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();
      
      // Add title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("تحليل الذكاء الاصطناعي", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
      
      // Add content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      // Split text into lines to fit the page width
      const textLines = doc.splitTextToSize(analysis, 180);
      doc.text(textLines, 15, 40);
      
      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("تم التحليل بواسطة الذكاء الاصطناعي – Powered by GPT-4", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      
      // Save the PDF
      doc.save("ai-analysis-report.pdf");
      toast.success('تم تحميل التقرير بنجاح');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('فشل في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
                    <Robot className="w-6 h-6 text-blue-600" />
                    تحليل الذكاء الاصطناعي
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-[60vh] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {analysis}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    تم التحليل بواسطة الذكاء الاصطناعي – Powered by GPT-4
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ التقرير 📋
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      تنزيل كـ PDF 🧾
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}