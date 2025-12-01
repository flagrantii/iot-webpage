export default function CameraFeed() {
  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col backdrop-blur-sm relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Live Camera Feed</h2>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 font-mono">FEED-01</div>
      </div>
      
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
        {/* MJPEG Stream */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://iot.tanuson.work/video_feed"
          alt="Live Camera Stream"
          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
          loading="eager"
        />
        
        {/* Overlay Grid (Optional aesthetic) */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Status Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
             <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/80 font-mono border border-white/10">
                1920x1080 @ 30FPS
             </div>
             <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-emerald-400/80 font-mono border border-emerald-500/20">
                SIGNAL: EXCELLENT
             </div>
        </div>
      </div>
    </div>
  );
}

