import { useRef } from "react";

/**
 * 6-digit OTP input with paste support.
 * value: string of digits (e.g. "123456"), onChange: (string) => void
 */
export default function OtpInput({ value = "", onChange, length = 6, disabled = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const focusAt = (i) => {
    const el = refs.current[Math.max(0, Math.min(i, length - 1))];
    if (el) { el.focus(); el.select?.(); }
  };

  // Put a string of digits into the boxes starting at index `start`
  const fill = (start, raw) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    const next = digits.slice();
    let j = start;
    for (const ch of clean) {
      if (j >= length) break;
      next[j++] = ch;
    }
    onChange(next.join(""));
    focusAt(Math.min(j, length - 1));
  };

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, "");
    if (!v) {
      const next = digits.slice(); next[i] = "";
      onChange(next.join(""));
      return;
    }
    // Typing 1 digit, or browser autofill / SMS-email suggestion with many digits
    fill(i, v);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = digits.slice();
      if (next[i]) { next[i] = ""; onChange(next.join("")); }
      else if (i > 0) { next[i - 1] = ""; onChange(next.join("")); focusAt(i - 1); }
    } else if (e.key === "ArrowLeft") { e.preventDefault(); focusAt(i - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); focusAt(i + 1); }
  };

  const handlePaste = (i, e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    // Pasting a full code always starts from the first box
    const clean = text.replace(/\D/g, "");
    fill(clean.length >= length ? 0 : i, text);
  };

  return (
    <div className="otp-inputs" style={{ marginBottom: "1.5rem" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="\d*"
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}