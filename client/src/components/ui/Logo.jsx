import React from 'react';

export default function Logo({ size = 36, className = "", showBackground = true }) {
  const content = (
    <>
      {/* Center Pillar */}
      <rect x="242" y="150" width="28" height="230" rx="8" fill={showBackground ? "#ffffff" : "currentColor"} />
      <circle cx="256" cy="140" r="22" fill={showBackground ? "#ffffff" : "currentColor"} />
      
      {/* Bottom Stand */}
      <rect x="186" y="370" width="140" height="28" rx="14" fill={showBackground ? "#ffffff" : "currentColor"} />
      
      {/* Main Curved Beam */}
      <path 
        d="M130 200 Q256 150 382 200" 
        fill="none" 
        stroke={showBackground ? "#ffffff" : "currentColor"} 
        strokeWidth="28" 
        strokeLinecap="round" 
      />
      
      {/* Left Pan */}
      <path 
        d="M130 200 L90 310 Q130 330 170 310 Z" 
        fill="none" 
        stroke={showBackground ? "#ffffff" : "currentColor"} 
        strokeWidth="20" 
        strokeLinejoin="round" 
        strokeLinecap="round" 
      />
      
      {/* Right Pan */}
      <path 
        d="M382 200 L342 310 Q382 330 422 310 Z" 
        fill="none" 
        stroke={showBackground ? "#ffffff" : "currentColor"} 
        strokeWidth="20" 
        strokeLinejoin="round" 
        strokeLinecap="round" 
      />
    </>
  );

  if (showBackground) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Blue background squircle */}
        <rect width="512" height="512" rx="120" fill="#2563eb" />
        {content}
      </svg>
    );
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {content}
    </svg>
  );
}
