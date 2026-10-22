export function DecorativeSpark({ diamond = false }: { diamond?: boolean }) {
  return <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" style={{ display: "inline-block", verticalAlign: "middle" }}>
    {diamond ? <path d="M16 1C18 10 22 14 31 16C22 18 18 22 16 31C14 22 10 18 1 16C10 14 14 10 16 1Z" fill="currentColor"/> : <path d="M16 2V30M2 16H30M6.1 6.1L25.9 25.9M6.1 25.9L25.9 6.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>}
  </svg>;
}
