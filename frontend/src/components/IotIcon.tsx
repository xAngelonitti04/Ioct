interface IotIconProps {
  size?: number
  color?: string
  style?: React.CSSProperties
}

export function IotIcon({ size = 16, color = 'currentColor', style }: IotIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <circle cx="5" cy="13" r="2.5" />
      <path d="M5 13 m4,-4 a5.66 5.66 0 0 1 0 8" />
      <path d="M5 13 m7,-7 a9.9 9.9 0 0 1 0 14" />
      <path d="M5 13 m10,-10 a14.14 14.14 0 0 1 0 20" />
    </svg>
  )
}