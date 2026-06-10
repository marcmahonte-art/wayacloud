import { cn } from "@/lib/utils"

interface IconProps {
  size?: number
  className?: string
}

export function CloudDuotone({ size = 32, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M160,48A80,80,0,0,0,85.9,97.84l0-.1A56,56,0,1,0,72,208h88a80,80,0,0,0,0-160Z" fill="currentColor" opacity="0.2" />
      <path d="M80,128a80,80,0,1,1,80,80H72A56,56,0,1,1,85.92,97.74" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WhatsappDuotone({ size = 32, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M128,32A96,96,0,0,0,44.89,176.07h0L32.42,213.46a8,8,0,0,0,10.12,10.12l37.39-12.47h0A96,96,0,1,0,128,32Zm24,152a80,80,0,0,1-80-80,32,32,0,0,1,32-32l16,32-12.32,18.47a48.19,48.19,0,0,0,25.85,25.85L152,136l32,16A32,32,0,0,1,152,184Z" fill="currentColor" opacity="0.2" />
      <path d="M72,104a32,32,0,0,1,32-32l16,32-12.32,18.47a48.19,48.19,0,0,0,25.85,25.85L152,136l32,16a32,32,0,0,1-32,32A80,80,0,0,1,72,104Z" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M79.93,211.11a96,96,0,1,0-35-35h0L32.42,213.46a8,8,0,0,0,10.12,10.12l37.39-12.47Z" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UsersThreeDuotone({ size = 32, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="128" cy="144" r="40" fill="currentColor" opacity="0.2" />
      <circle cx="64" cy="88" r="32" fill="currentColor" opacity="0.2" />
      <circle cx="192" cy="88" r="32" fill="currentColor" opacity="0.2" />
      <path d="M192,120a59.91,59.91,0,0,1,48,24" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16,144a59.91,59.91,0,0,1,48-24" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="128" cy="144" r="40" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M72,216a65,65,0,0,1,112,0" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M161,80a32,32,0,1,1,31,40" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M64,120A32,32,0,1,1,95,80" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RocketLaunchDuotone({ size = 32, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M184,120v61.65a8,8,0,0,1-2.34,5.65l-34.35,34.35a8,8,0,0,1-13.57-4.53L128,176Z" fill="currentColor" opacity="0.2" />
      <path d="M136,72H74.35a8,8,0,0,0-5.65,2.34L34.35,108.69a8,8,0,0,0,4.53,13.57L80,128Z" fill="currentColor" opacity="0.2" />
      <path d="M94.56,187.82C90.69,196.31,77.65,216,40,216c0-37.65,19.69-50.69,28.18-54.56Z" fill="currentColor" opacity="0.2" />
      <path d="M191.11,112.89c24-24,25.5-52.55,24.75-65.28a8,8,0,0,0-7.47-7.47c-12.73-.75-41.26.73-65.28,24.75L80,128l48,48Z" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M136,72H74.35a8,8,0,0,0-5.65,2.34L34.35,108.69a8,8,0,0,0,4.53,13.57L80,128" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M184,120v61.65a8,8,0,0,1-2.34,5.65l-34.35,34.35a8,8,0,0,1-13.57-4.53L128,176" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M94.56,187.82C90.69,196.31,77.65,216,40,216c0-37.65,19.69-50.69,28.18-54.56" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CrownDuotone({ size = 32, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M207.41,95.53h0L168,144,136,70.35h0a20,20,0,0,1-15.92,0h0L88,144,48.61,95.52h0a19.82,19.82,0,0,1-9.22,4.16l-.08,0,15.6,93.59A8,8,0,0,0,62.78,200H193.22a8,8,0,0,0,7.89-6.68l15.6-93.59-.08,0A19.82,19.82,0,0,1,207.41,95.53Z" fill="currentColor" opacity="0.2" />
      <circle cx="128" cy="52" r="20" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="220" cy="80" r="20" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="80" r="20" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="120.02 70.35 88 144 48.61 95.52" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="207.39 95.52 168 144 135.98 70.35" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M39.29,99.73l15.6,93.59A8,8,0,0,0,62.78,200H193.22a8,8,0,0,0,7.89-6.68l15.6-93.59" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const PLAN_ICONS: Record<string, typeof CloudDuotone> = {
  free: CloudDuotone,
  whatsapp_1500: WhatsappDuotone,
  famille_999: UsersThreeDuotone,
  famille_3999: UsersThreeDuotone,
  pro_6999: RocketLaunchDuotone,
}
