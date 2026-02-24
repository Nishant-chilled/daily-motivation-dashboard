// ✅ Import React hooks we use in this project
// useState   -> store data in component (quote, likes, theme, etc.)
// useEffect  -> run code on mount / when something changes (API call, saving to localStorage)
// useMemo    -> optimize derived values (avoid recalculating again & again)
import { useEffect, useMemo, useState } from "react";

// ✅ Import CSS file to apply premium UI styles + animations
import "./App.css";

// ✅ Keys for localStorage (so we can save data even after refresh)
const LS_KEY = "likedQuotes_v2";   // stores liked quotes list
const THEME_KEY = "theme_v1";      // stores theme (light/dark)

// ✅ List of anime characters we will randomly show with each new quote
// img path is from /public/characters folder
const CHARACTERS = [
  { name: "Goku", img: "/characters/goku.jpg", vibe: "Never Give Up" },          // character name + image + small vibe line
  { name: "Jinwoo", img: "/characters/jinwoo.jpg", vibe: "Level Up Mindset" },
  { name: "Saitama", img: "/characters/saitama.jpg", vibe: "Calm Power" },
  { name: "Gojo", img: "/characters/satorugojo.jpg", vibe: "Limitless Focus" },
  { name: "Tanjiro", img: "/characters/tanjiro.png", vibe: "Kind but Unbreakable" },
];

// ✅ Main component (React function component)
export default function App() {

  // ✅ quote state: stores the currently shown quote object
  // initially null because we haven’t fetched anything yet
  const [quote, setQuote] = useState(null); // expected shape: { _id, content, author }

  // ✅ loading state: true while fetching quote from API
  const [loading, setLoading] = useState(false);

  // ✅ error state: store error message if API fails
  const [error, setError] = useState("");

  // ===================== THEME (LIGHT/DARK) =====================

  // ✅ theme state: reads saved theme from localStorage when app starts
  // using function form of useState so it runs only once on first render
  const [theme, setTheme] = useState(() => {
    try {
      // try to read previously saved theme
      return localStorage.getItem(THEME_KEY) || "dark"; // default is dark
    } catch {
      // if localStorage is blocked, fallback to dark
      return "dark";
    }
  });

  // ✅ whenever theme changes, update HTML attribute and save theme to localStorage
  useEffect(() => {
    // set attribute on <html> tag so CSS can switch theme variables
    document.documentElement.setAttribute("data-theme", theme);

    try {
      // save theme so it stays after refresh
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]); // runs again only when theme value changes

  // ===================== LIKED QUOTES (PERSISTENT) =====================

  // ✅ likedQuotes: array of quotes user liked
  // load saved liked quotes from localStorage on first render
  const [likedQuotes, setLikedQuotes] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY); // get string from storage
      return raw ? JSON.parse(raw) : [];        // convert string -> array, else empty array
    } catch {
      return [];
    }
  });

  // ✅ whenever likedQuotes changes, save it back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(likedQuotes)); // array -> string
    } catch {}
  }, [likedQuotes]); // run only when likedQuotes updates

  // ✅ Build a Set of liked IDs for fast lookup (O(1) has check)
  // useMemo prevents creating new Set every render unless likedQuotes changes
  const likedIds = useMemo(
    () => new Set(likedQuotes.map((q) => q._id)),
    [likedQuotes]
  );

  // ✅ Check if the current quote is already liked
  const isCurrentLiked = quote ? likedIds.has(quote._id) : false;

  // ===================== CHARACTER + ANIMATION TRIGGER =====================

  // ✅ current character shown beside quote
  // initial character set to first one
  const [character, setCharacter] = useState(() => CHARACTERS[0]);

  // ✅ sceneKey: used to force remount so CSS animations re-run each time
  const [sceneKey, setSceneKey] = useState(0);

  // ✅ helper function to pick a random character from array
  const pickRandomCharacter = () =>
    CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

  // ===================== API FETCH FUNCTION =====================

  // ✅ function to fetch a new quote from API
  // async because fetch is asynchronous (returns promise)
  async function fetchRandomQuote() {
    setLoading(true);   // start loading UI
    setError("");       // clear any old error

    try {
      // ✅ call stable API to get a random quote
      const res = await fetch("https://dummyjson.com/quotes/random");

      // ✅ if HTTP is not ok (like 404/500), throw error manually
      if (!res.ok) throw new Error("Failed to fetch quote");

      // ✅ convert response JSON -> JS object
      const data = await res.json();

      // ✅ normalize data into our format so UI stays consistent
      setQuote({
        _id: String(data.id),   // keep id as string
        content: data.quote,    // quote text
        author: data.author,    // author name
      });

      // ✅ each time quote changes, also change anime character
      setCharacter(pickRandomCharacter());

      // ✅ increase sceneKey so React remounts the scene div
      // this restarts quote animation + summon animation
      setSceneKey((k) => k + 1);

    } catch (e) {
      // ✅ if any error occurs (network, api down etc), store message
      setError(e?.message || "Something went wrong");
    } finally {
      // ✅ always stop loading (runs for both success and error)
      setLoading(false);
    }
  }

  // ✅ run once when the component mounts (page loads) to fetch first quote
  useEffect(() => {
    fetchRandomQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty array = run only once

  // ===================== LIKE / UNLIKE LOGIC =====================

  // ✅ like button toggles between like/unlike
  function toggleLike() {
    if (!quote) return; // safety: no quote means nothing to like

    // ✅ update likedQuotes based on previous value
    setLikedQuotes((prev) => {
      // check if quote already exists in liked list
      const exists = prev.some((q) => q._id === quote._id);

      // if exists -> unlike (remove it)
      if (exists) return prev.filter((q) => q._id !== quote._id);

      // else -> like (add it at top)
      return [{ _id: quote._id, content: quote.content, author: quote.author }, ...prev];
    });
  }

  // ✅ remove a liked quote by id (used in liked list "Remove" button)
  function removeLiked(id) {
    setLikedQuotes((prev) => prev.filter((q) => q._id !== id));
  }

  // ✅ clear all liked quotes
  function clearLiked() {
    setLikedQuotes([]);
  }

  // ✅ copy current quote to clipboard
  function copyQuote() {
    if (!quote) return; // safety check
    const text = `"${quote.content}" — ${quote.author}`; // format text nicely
    navigator.clipboard?.writeText?.(text); // optional chaining avoids crash if clipboard not available
  }

  // ===================== UI (JSX RETURN) =====================
  return (
    <div className="app">
      {/* Background glow effects for premium look */}
      <div className="bgGlow bgGlow1" />
      <div className="bgGlow bgGlow2" />

      <main className="wrap">
        {/* Top header */}
        <header className="topbar">
          <div className="brand">
            <div className="logo">✨</div>
            <div>
              <h1>Daily Motivation</h1>
              <p className="sub">Fresh quotes • Like & save your favorites</p>
            </div>
          </div>

          {/* Right side: theme button + liked count */}
          <div className="topRight">
            <button
              className="btn btnGhost themeBtn"
              // toggle theme: if dark then light else dark
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title="Toggle light/dark mode"
            >
              {/* show label based on current theme */}
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>

            {/* Liked count pill */}
            <div className="pill">
              <span className="pillLabel">Liked</span>
              <span className="pillValue">{likedQuotes.length}</span>
            </div>
          </div>
        </header>

        {/* Quote section */}
        <section className="card">
          <div className="cardHead">
            <h2>Quote of the moment</h2>

            {/* status changes based on loading */}
            <span className={`status ${loading ? "statusLoading" : "statusReady"}`}>
              {loading ? "Fetching…" : "Ready"}
            </span>
          </div>

          {/* If error exists AND not currently loading, show error box */}
          {error && !loading && (
            <div className="alert">
              <div>
                <p className="alertTitle">Couldn’t load quote</p>
                <p className="alertText">{error}</p>
              </div>

              {/* Try again button */}
              <button className="btn btnPrimary" onClick={fetchRandomQuote}>
                Try Again
              </button>
            </div>
          )}

          {/* If no error, show quote + character scene */}
          {!error && (
            // ✅ key makes React remount this block when sceneKey changes
            // remount = CSS animations replay
            <div className="scene" key={sceneKey}>
              {/* Quote card */}
              <div className="quoteBox">
                {/* quoteAnim gives fade/slide animation */}
                <div className={`quoteAnim ${loading ? "quoteDim" : ""}`}>
                  <p className="quoteText">
                    {/* show quote if available else loading text */}
                    {quote ? `“${quote.content}”` : "“Loading your motivation…”"}
                  </p>
                  <p className="quoteAuthor">
                    {quote ? `— ${quote.author}` : "—"}
                  </p>
                </div>
              </div>

              {/* Character card */}
              <div className="charCard">
                {/* Summon effect layers (pure CSS) */}
                <div className="summonBurst" />
                <div className="summonSmoke" />
                <div className="charGlow" />

                {/* Character image */}
                <img
                     className="charImg"
                     src={`${import.meta.env.BASE_URL}${character.img.replace(/^\//, "")}`}
                     alt={character.name}
                />

                {/* Character name + vibe */}
                <div className="charMeta">
                  <div className="charName">{character.name}</div>
                  <div className="charVibe">{character.vibe}</div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="actions">
            {/* New quote button disabled during loading */}
            <button className="btn btnPrimary" onClick={fetchRandomQuote} disabled={loading}>
              New Quote
            </button>

            {/* Like button toggles like/unlike */}
            <button
              className={`btn ${isCurrentLiked ? "btnSuccess" : "btnGhost"}`}
              onClick={toggleLike}
              disabled={loading || !quote}
            >
              {isCurrentLiked ? "Liked ✅" : "Like ❤️"}
            </button>

            {/* Copy button */}
            <button className="btn btnGhost" onClick={copyQuote} disabled={!quote || loading}>
              Copy
            </button>
          </div>
        </section>

        {/* Liked quotes list section */}
        <section className="card">
          <div className="cardHead">
            <h2>Your Liked Quotes</h2>

            {/* Clear all liked quotes */}
            <div className="rightActions">
              <button
                className="btn btnGhost"
                onClick={clearLiked}
                disabled={likedQuotes.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* If no liked quotes, show empty message */}
          {likedQuotes.length === 0 ? (
            <div className="empty">
              <p className="emptyTitle">No liked quotes yet</p>
              <p className="emptyText">Tap “Like ❤️” to save quotes you want to keep.</p>
            </div>
          ) : (
            // else show liked quotes list
            <ul className="list">
              {likedQuotes.map((q) => (
                // key is required in React lists for efficient updates
                <li key={q._id} className="listItem">
                  <div className="listText">
                    <div className="listQuote">“{q.content}”</div>
                    <div className="listAuthor">— {q.author}</div>
                  </div>

                  {/* Remove button removes that quote from liked list */}
                  <button className="btn btnGhost" onClick={() => removeLiked(q._id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <span>Built with useState + useEffect • Likes saved in localStorage</span>
        </footer>
      </main>
    </div>
  );
}
