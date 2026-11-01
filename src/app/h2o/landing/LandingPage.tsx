import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Users,
  ClipboardCheck,
  Smartphone,
  Share,
  MoreVertical,
  ImagePlus,
} from "lucide-react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TdsQualityCard } from "@/app/h2o/StatusBadge";
import { en } from "@/i18n/en";
import { th } from "@/i18n/th";
import mapAsset from "@/assets/landing/map.webp.asset.json";
import listAsset from "@/assets/landing/dispensers.webp.asset.json";
import { content, type LandingLanguage } from "./content";

// Isolated translations for the existing empty TDS component; never change app preferences.
const translations = { th: createInstance(), en: createInstance() };
for (const language of ["th", "en"] as const) {
  void translations[language].init({
    lng: language,
    resources: { en: { translation: en }, th: { translation: th } },
    interpolation: { escapeValue: false },
    initImmediate: false,
  });
}

const ids = ["what", "why", "how", "install"] as const;
const audienceIcons = [MapPin, Users, ClipboardCheck];

export function LandingPage({ language }: { language: LandingLanguage }) {
  const c = content[language];
  return (
    <div className="h2o-landing" lang={language}>
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link to={language === "th" ? "/" : "/en"} aria-label="H2O Map" className="landing-brand">
            <img src="/icons/icon-192.png" alt="" width="46" height="46" />
            <span>H2O Map</span>
          </Link>
          <nav
            aria-label={language === "th" ? "เมนูหลัก" : "Main navigation"}
            className="landing-nav"
          >
            {ids.map((id, i) => (
              <a key={id} href={`#${id}`}>
                {c.nav[i]}
              </a>
            ))}
          </nav>
          <div className="landing-language" aria-label={language === "th" ? "ภาษา" : "Language"}>
            <Link to="/" lang="th" aria-current={language === "th" ? "page" : undefined}>
              TH
            </Link>
            <span aria-hidden="true">|</span>
            <Link to="/en" lang="en" aria-current={language === "en" ? "page" : undefined}>
              EN
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-inner">
            <div className="landing-hero-copy">
              <p className="landing-kicker">
                <span />
                {c.kicker}
              </p>
              <h1>
                <span className="landing-product">H2O Map</span>
                {c.title}
              </h1>
              <p className="landing-lead">{c.body}</p>
              <div className="landing-actions">
                <Button asChild size="lg">
                  <Link to="/map">
                    {c.open}
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#install">
                    {c.installLink}
                    <Smartphone />
                  </a>
                </Button>
              </div>
              <p className="landing-note">{c.note}</p>
            </div>
            <figure className="landing-hero-visual">
              <img
                src={mapAsset.url}
                alt={c.mapAlt}
                width="390"
                height="780"
                fetchPriority="high"
              />
              <figcaption>{c.screenshot}</figcaption>
            </figure>
          </div>
        </section>

        <section id="what" className="landing-section">
          <div className="landing-container landing-what">
            <figure className="landing-list-visual">
              <img src={listAsset.url} alt={c.listAlt} width="390" height="780" loading="lazy" />
              <figcaption>{c.screenshot}</figcaption>
            </figure>
            <div>
              <p className="landing-eyebrow">01 / {c.nav[0]}</p>
              <h2>{c.what}</h2>
              <p className="landing-lead">{c.whatBody}</p>
              <div className="landing-facts">
                <span>
                  <MapPin />
                  RO
                </span>
                <span>
                  <ClipboardCheck />
                  TDS &amp; pH
                </span>
                <span>
                  <Users />
                  {language === "th" ? "ชุมชน" : "Community"}
                </span>
              </div>
              <Button asChild variant="link" className="landing-text-link">
                <Link to="/map">
                  {c.open}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="why" className="landing-section landing-icy">
          <div className="landing-container">
            <p className="landing-eyebrow">02 / {c.nav[1]}</p>
            <h2>{c.why}</h2>
            <div className="landing-audiences">
              {c.cards.map(([title, body], i) => {
                const Icon = audienceIcons[i];
                return (
                  <article key={title} className="landing-audience">
                    {Icon && <Icon className="landing-feature-icon" />}
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how" className="landing-section">
          <div className="landing-container">
            <p className="landing-eyebrow">03 / {c.nav[2]}</p>
            <h2>{c.how}</h2>
            <div className="landing-steps">
              {c.steps.map(([title, body], i) => (
                <article className="landing-step" key={title}>
                  <div className="landing-step-title">
                    <span>{i + 1}</span>
                    <h3>{title}</h3>
                  </div>
                  <p>{body}</p>
                  {i === 0 ? (
                    <div className="landing-step-map">
                      <img
                        src={mapAsset.url}
                        alt={c.mapAlt}
                        width="390"
                        height="780"
                        loading="lazy"
                      />
                    </div>
                  ) : i === 1 ? (
                    <div className="landing-static-preview">
                      <I18nextProvider i18n={translations[language]}>
                        <TdsQualityCard tds_ppm={null} />
                      </I18nextProvider>
                      <div className="landing-empty-reading">
                        <span>pH</span>
                        <strong>—</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="landing-static-preview landing-report-preview">
                      <h4>{c.report}</h4>
                      <div className="landing-preview-fields">
                        <div>
                          <span>pH</span>
                          <div>—</div>
                        </div>
                        <div>
                          <span>TDS (ppm)</span>
                          <div>—</div>
                        </div>
                      </div>
                      <span>{c.notes}</span>
                      <div className="landing-preview-notes" />
                      <div className="landing-preview-photo">
                        <ImagePlus />
                        {c.photo}
                      </div>
                    </div>
                  )}
                  <small className="landing-preview-caption">
                    {i === 0 ? c.screenshot : c.illustration}
                  </small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="landing-section landing-icy">
          <div className="landing-container">
            <p className="landing-eyebrow">04 / {c.nav[3]}</p>
            <h2>{c.install}</h2>
            <p className="landing-lead landing-install-body">{c.installBody}</p>
            <div className="landing-install-grid">
              {[
                { title: "iPhone · Safari", Icon: Share, steps: c.iphone },
                { title: "Android · Chrome", Icon: MoreVertical, steps: c.android },
              ].map(({ title, Icon, steps }) => (
                <div key={title} className="landing-install-platform">
                  <h3>
                    <Icon />
                    {title}
                  </h3>
                  <ol>
                    {steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <Button asChild size="lg">
              <Link to="/map">
                {c.open}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-brand">
            <img src="/icons/icon-192.png" width="38" height="38" alt="" />
            <strong>H2O Map</strong>
            <span>
              {language === "th"
                ? "ข้อมูลจากชุมชน เพื่อชุมชน"
                : "By the community. For the community."}
            </span>
          </div>
          <p>{c.safety}</p>
        </div>
      </footer>
    </div>
  );
}
