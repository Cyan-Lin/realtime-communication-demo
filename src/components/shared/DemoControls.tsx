import { ReactNode } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface DemoControlsProps {
  title: string;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  additionalControls?: ReactNode;
}

export default function DemoControls({
  title,
  isActive,
  onToggle,
  onReset,
  additionalControls,
}: DemoControlsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center space-x-3">
        {additionalControls}
        <button
          onClick={onToggle}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-white font-medium ${
            isActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
          <span>{isActive ? "停止" : "開始"}</span>
        </button>
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
        >
          <RotateCcw size={16} />
          <span>重置</span>
        </button>
      </div>
    </div>
  );
}
