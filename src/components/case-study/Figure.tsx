import Image from "next/image";
import clsx from "clsx";

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  /** when true, stretches to the content max width (outside the prose column) */
  wide?: boolean;
  priority?: boolean;
};

export function Figure({
  src,
  alt,
  caption,
  width = 2400,
  height = 1500,
  wide = false,
  priority = false,
}: FigureProps) {
  return (
    <figure
      className={clsx(
        "my-[var(--block-gap)]",
        wide ? "mx-0" : "mx-auto max-w-prose",
      )}
    >
      <div
        className="relative overflow-hidden rounded"
        style={{ border: "1px solid var(--rule)", background: "var(--bg)" }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={wide ? "(max-width: 1120px) 100vw, 1120px" : "(max-width: 640px) 100vw, 640px"}
          className="h-auto w-full"
        />
      </div>
      {caption ? (
        <figcaption className="meta mt-3">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
