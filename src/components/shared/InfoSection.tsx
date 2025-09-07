import { ReactNode } from "react";

interface InfoSectionProps {
  title: string;
  children: ReactNode;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

export default function InfoSection({
  title,
  children,
  bgColor = "bg-blue-50",
  borderColor = "border-blue-200",
  textColor = "text-blue-800",
}: InfoSectionProps) {
  return (
    <div className={`mt-6 ${bgColor} border ${borderColor} rounded-lg p-4`}>
      <h4 className={`font-medium ${textColor.replace('800', '900')} mb-2`}>
        {title}
      </h4>
      <div className={`${textColor} text-sm`}>{children}</div>
    </div>
  );
}
