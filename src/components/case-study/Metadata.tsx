type MetadataProps = {
  items: string[];
};

export function Metadata({ items }: MetadataProps) {
  return (
    <p className="meta rule-top pt-3 flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item, i) => (
        <span key={i} className="whitespace-nowrap">
          {item}
          {i < items.length - 1 ? <span aria-hidden className="pl-3">·</span> : null}
        </span>
      ))}
    </p>
  );
}
