import { Loader2 } from "lucide-react";
import Card from "./Card";

export default function AnalysisLoading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-fade-in">
      <Card className="p-10 lg:p-16 max-w-md w-full mx-4 text-center">

        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-brand-50 animate-pulse-soft" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI가 대지를 분석하고 있습니다
        </h3>

        <p className="text-sm text-gray-400">
          잠시만 기다려주세요.
          주소를 기반으로 대지 정보를 분석하고 있습니다.
        </p>

        <div className="mt-6 flex justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft" />
          <span
            className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

      </Card>
    </div>
  );
}