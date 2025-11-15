const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-12 h-12">
        {/* Dot pattern inspired by HELLO HAVEN with enhanced animations */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-1">
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-dot-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-dot-pulse" style={{ animationDelay: "100ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-pink animate-dot-pulse" style={{ animationDelay: "200ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-dot-pulse" style={{ animationDelay: "300ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-pink animate-dot-pulse" style={{ animationDelay: "400ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-pink animate-dot-pulse" style={{ animationDelay: "500ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-pink animate-dot-pulse" style={{ animationDelay: "600ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-dot-pulse" style={{ animationDelay: "700ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-neon-pink animate-dot-pulse" style={{ animationDelay: "800ms" }}></div>
          </div>
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight">
        <span className="text-neon-blue">PROHAVEN</span>
        <span className="text-neon-pink"> LOGS</span>
      </div>
    </div>
  );
};

export default Logo;
