import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 40"
      width="200"
      height="40"
      aria-labelledby="logo-title"
      {...props}
    >
      <title id="logo-title">TempoAI Logo</title>
      <text
        x="0"
        y="30"
        fontFamily="'Space Grotesk', sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="currentColor"
      >
        Tempo
        <tspan fill="hsl(var(--primary))">AI</tspan>
      </text>
    </svg>
  );
}
