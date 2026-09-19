export const metadata = { title: "Learn — NSE Compass" };

const TOPICS = [
  {
    title: "Trend",
    body: "Trend asks: is the stock's price generally rising, falling, or moving sideways? We look at whether the current price sits above or below its 20-day and 50-day moving averages — smoothed lines that filter out day-to-day noise. Price above both averages, with the shorter one on top, is the classic sign of an uptrend.",
  },
  {
    title: "Momentum",
    body: "Momentum measures how fast and how consistently a price has been moving in one direction. We use the Relative Strength Index (RSI), a 0–100 gauge of recent gains versus recent losses, plus the plain percentage change over the last 10 sessions. High momentum can mean strength — or it can mean a stock is overextended and due for a pause.",
  },
  {
    title: "Volume",
    body: "Volume is how many shares changed hands. A price move on unusually high volume (compared to its own 20-day average) tends to carry more conviction than the same move on quiet, low volume.",
  },
  {
    title: "52-week range",
    body: "This compares the current price to its highest and lowest points over the trailing year. Stocks trading near their 52-week high often carry positive momentum (sometimes called a 'breakout'), though they can also be overextended. Stocks near their 52-week low may be out of favor — or a value opportunity, or simply still falling. On its own, this tells you where a stock sits in its yearly range, not which direction it goes next.",
  },
  {
    title: "Market conditions",
    body: "Individual stocks don't move in isolation. We check whether the NIFTY 50 index itself is trending up, down, or sideways, and treat a down-trending market as a headwind when scoring every stock.",
  },
  {
    title: "Risk",
    body: "We estimate risk using the Average True Range (ATR) as a percentage of price — a measure of how much a stock typically moves day to day. A higher ATR% means bigger swings in both directions, which we surface as a Low / Medium / High risk tier.",
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl sm:text-4xl">Learn</h1>
      <p className="mt-2 text-muted">
        Plain-language explanations of the signals behind every score on this
        dashboard.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {TOPICS.map((topic) => (
          <section key={topic.title}>
            <h2 className="text-xl font-semibold">{topic.title}</h2>
            <p className="mt-2 text-muted">{topic.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-warning-border bg-warning-bg p-4 text-sm text-warning">
        None of this is investment advice. Technical signals describe the
        past; they don&apos;t guarantee what happens next. Always size positions
        with risk you can afford to lose in mind.
      </div>
    </div>
  );
}
