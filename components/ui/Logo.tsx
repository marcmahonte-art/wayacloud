import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  variant?: "light" | "dark"
}

export function Logo({ className, variant }: LogoProps) {
  const textColor = variant === "dark" ? "#111827" : "#FFFFFF"

  return (
    <svg
      viewBox="0 0 1780 841.9"
      className={cn("shrink-0 transition-all duration-200", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M510.8,524.3c-101.9,0-203.8,0-305.8,0c-0.5-0.1-1.1-0.2-1.6-0.2c-7-0.3-13.9-1.6-20.6-3.9c-17.2-6-30.7-16.6-38.5-33.3c-7.9-16.8-10.6-34.5-7.8-52.9c1.7-11.3,6-21.5,13.5-30.3c7.3-8.6,16.6-14.5,26.8-18.9c9.3-4,19.1-6.2,29.1-7.4c3.7-0.5,3.6-0.4,4.2-3.9c2.7-15.3,7.5-29.8,15.4-43.2c9.9-16.9,23.7-29.4,42-36.7c11.2-4.5,23-6.6,35-7.2c19-1,36.7,3.2,53,13.1c12.3,7.5,22,17.5,30.1,29.3c-32.2,27.1-35.7,65.4-30.2,86.9c2.6-0.5,5.2-1.1,7.8-1.6c0.9-0.2,1-0.5,0.8-1.3c-2-10-2.2-20.1-0.1-30c6-28.1,22.2-48,48.6-59.4c2.6-1.1,5.4-2.2,8.2-2.6c6.1-0.8,12.3-0.5,18.4,0.3c15.1,1.9,28.6,7.8,40.4,17.5c15.4,12.7,24.2,29,26.3,48.8c0.5,4.9,0.8,9.9,1.1,14.9c0.1,1.2,0.4,1.7,1.7,2c3.6,0.9,7.3,1.7,10.8,3.1c13.9,5.3,25.3,13.8,31.7,27.5c11,23.3,9.7,46.2-4,68.2c-6.9,11-16.9,18-29.8,20.4C515.3,523.7,513.1,524,510.8,524.3z"
        fill="none"
        stroke="#FF6300"
        strokeWidth="30"
        strokeMiterlimit="10"
      />
      <text
        transform="translate(617.5732, 510.1782)"
        fill={textColor}
        fontFamily="Jost, sans-serif"
        fontWeight="700"
        fontSize="193.078"
      >
        WayaCloud
      </text>
    </svg>
  )
}
