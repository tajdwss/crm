import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Logo Image */}
      <div className={cn(
        "bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden",
        sizeClasses[size]
      )}>
        <img 
          src="/src/assets/logo.png" 
          alt="New Taj Electronics Logo"
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback to icon if image not found
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <Wrench className="w-5 h-5 text-white hidden" />
      </div>
      
      {/* Company Name */}
      {showText && (
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Taj Electronics</h1>
          <p className="text-sm text-gray-500">Professional Repair Service</p>
        </div>
      )}
    </div>
  );
}
