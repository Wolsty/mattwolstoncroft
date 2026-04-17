export function About() {
  return (
    <section
      aria-labelledby="home-about"
      className="rule-top mt-[var(--section-gap)] pt-[var(--block-gap)]"
    >
      <h2 id="home-about" className="meta mb-6">About</h2>
      <div className="max-w-prose space-y-5 font-body" style={{ lineHeight: 1.55 }}>
        <p>
          I&apos;m a strategic product leader who ships across design and code.
          I architect AI-native products from 0-to-1, writing the prompts,
          drawing the flows, and standing next to engineering while it ships.
          Right now that means LabNotes, where I co-founded an AI tutoring
          platform for higher-ed STEM, and Cengage, where I lead Content
          Studio, a generative-AI layer inside the Explore learning
          platform.
        </p>
        <p>
          Before that: principal design work at SeekWell / HelloEyes on a
          mobile-first vision platform, and end-to-end product design across
          Progrexion&apos;s consumer finance brands. Based in New York.
          Mountain biking and long days in the mountains are how I keep the
          product instincts sharp.
        </p>
      </div>
    </section>
  );
}
