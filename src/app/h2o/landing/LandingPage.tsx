import thaiHtml from "./th.html?raw";
import englishHtml from "./en.html?raw";
import type { LandingLanguage } from "./content";

// Trusted, inspected static uploads: no scripts or event handlers. Styles stay scoped.
export function LandingPage({ language }: { language: LandingLanguage }) {
  return (
    <div
      className="uploaded-landing"
      lang={language}
      dangerouslySetInnerHTML={{ __html: language === "th" ? thaiHtml : englishHtml }}
    />
  );
}
