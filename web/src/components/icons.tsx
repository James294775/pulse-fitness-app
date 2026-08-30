type IconProps = { size?: number; className?: string };

export function LogoMark({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2 13h4.2l2.4-6.4L12 19l2.6-8.4L17 13h5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function SearchIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.6 13.6L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}

export function BellIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 8a6 6 0 0112 0v5l1.6 2.4H2.4L4 13V8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function TabFeedIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <rect x="2.5" y="3" width="17" height="5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="2.5" y="11.5" width="17" height="7.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function TabExploreIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <circle cx="11" cy="11" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M7.5 14.5l2.2-5 5-2.2-2.2 5-5 2.2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function TabRecordIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2 13h4.2l2.4-6.4L12 19l2.6-8.4L17 13h5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function TabGroupsIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <circle cx="8" cy="7.5" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15.5" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2 18.5c0-3 2.7-4.6 6-4.6s6 1.6 6 4.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15 13.9c3 .2 5 1.9 5 4.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function TabYouIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <circle cx="11" cy="7" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 19.5c0-3.7 3.4-5.8 7.5-5.8s7.5 2.1 7.5 5.8"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
