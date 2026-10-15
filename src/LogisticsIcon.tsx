/** Original line icons: one distinct operation for each supply-chain handover. */
export default function LogisticsIcon({ stage }: { stage: number }) {
  const paths = [
    "M5 25V13h14v12M3 25h20M9 25v-7h6v7M24 3a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4ZM24 6v2",
    "M4 5h8v8H4ZM20 5h8v8h-8ZM12 21h8v8h-8ZM8 16v3h16v-3M16 19v2",
    "M3 9h16v13H3ZM19 14h6l4 5v3H19M5 22a3 3 0 1 0 6 0M21 22a3 3 0 1 0 6 0M2 5h8M1 15h5M23 15v4h5",
    "M7 3h12l6 6v8M19 3v7h6M7 3v26h11M11 14h8M11 19h4M20 23l3 3 6-7",
    "M3 13l13-8 13 8v15H3ZM11 28V16h10v12M6 17h2M6 21h2M23 17h3M23 21h3M13 21l2 2 4-5",
  ];
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-logistics-icon={stage}
    >
      <path d={paths[stage % paths.length]} />
    </svg>
  );
}
