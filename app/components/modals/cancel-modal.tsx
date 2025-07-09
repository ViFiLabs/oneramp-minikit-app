import { Button } from "@/components/ui/button";

interface CancelTransactionModalProps {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelModal({
  title,
  description,
  onClose,
  onConfirm,
}: CancelTransactionModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center !bg-black/80">
      <div className="bg-[#181818] rounded-2xl max-w-md w-[90%] shadow-xl p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-neutral-400">{description}</p>

          <div className="flex gap-4 mt-4">
            <Button
              variant="outline"
              className="flex-1 !bg-[#333] hover:!bg-[#444] border-none text-white p-6 text-lg rounded-xl"
              onClick={onClose}
            >
              Keep editing
            </Button>

            <Button
              className="flex-1 !bg-red-600 hover:!bg-red-700 text-white p-6 text-lg rounded-xl"
              onClick={onConfirm}
            >
              Yes, cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
