import React from "react";
import {
  getPageBySlug,
  listActiveHomeSections,
  listPublicAnnouncements,
  getTheme,
} from "../api/resources.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function joinApiUrl(base, path) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = String(path || "").trim();
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const baseForUploads = /^\/?api\/uploads\//i.test(normalizedPath)
    ? b.replace(/\/api$/i, "")
    : b;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseForUploads}${p}`;
}

function resolveMediaUrl(rawUrl) {
  let url = String(rawUrl || "")
    .trim()
    .replace(/\\/g, "/");
  if (!url) return "";
  url = url
    .replace(/^\/?api\/uploads\//i, "/uploads/")
    .replace(/^(https?:\/\/[^/]+)\/api\/uploads\//i, "$1/uploads/")
    .replace(/^(\/\/[^/]+)\/api\/uploads\//i, "$1/uploads/");

  const normalizedApiBase = String(API_BASE || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  if (/^(?:https?:)?\/\//i.test(url)) {
    const absolute = url.startsWith("//")
      ? `${window.location.protocol}${url}`
      : url;
    try {
      const parsed = new URL(absolute);
      const path = `${parsed.pathname || ""}${parsed.search || ""}${parsed.hash || ""}`;
      if (
        normalizedApiBase &&
        /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)
      ) {
        return `${normalizedApiBase}${path}`.replace(/([^:]\/)\/+/g, "$1");
      }
      if (/^\/api\/uploads\//i.test(parsed.pathname || "")) {
        return `${parsed.origin}${path.replace(/^\/api\/uploads\//i, "/uploads/")}`;
      }
    } catch (_error) {
      // keep absolute value
    }
    return absolute;
  }

  if (/^(?:data|blob):/i.test(url)) return url;
  return joinApiUrl(API_BASE, url);
}

function getLocalizedValue(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.kn || "";
}

function stripHtml(html = "") {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveNoticeLink(rawLink = "") {
  const link = String(rawLink || "").trim();
  if (!link) return "";
  if (/^(?:data|blob):/i.test(link)) return link;
  if (/^(?:https?:)?\/\//i.test(link)) {
    return link.startsWith("//") ? `${window.location.protocol}${link}` : link;
  }
  if (/^\/?api\/uploads\//i.test(link) || /^\/uploads\//i.test(link)) {
    return resolveMediaUrl(link);
  }
  if (link.startsWith("/")) return link;
  return `/${link}`;
}

function isExternalLink(url = "") {
  return /^https?:\/\//i.test(String(url || "").trim());
}

function isVideoUrl(url = "") {
  if (!url) return false;
  return (
    /\/video\/upload\//i.test(url) ||
    /\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?|#|$)/i.test(url)
  );
}

function getAnnouncementText(page, language) {
  const explicitText = getLocalizedValue(page?.announcement?.text, language);
  if (explicitText) return explicitText;
  const html = getLocalizedValue(page?.content, language)?.html || "";
  return stripHtml(html);
}

const defaultHeroSlides = [
  {
    image: "https://picsum.photos/1200/500?random=81",
    title: { en: "Welcome to Our College", kn: "" },
    description: { en: "Excellence in education and innovation.", kn: "" },
    link: "/home",
  },
  {
    image: "https://picsum.photos/1200/500?random=82",
    title: { en: "Admissions Open", kn: "" },
    description: { en: "Apply now for the upcoming academic year.", kn: "" },
    link: "/home",
  },
];

const HERO_BANNER_HEIGHT = "clamp(500px, 36vw, 700px)";
const HERO_MEDIA_FIT_MODE = "cover";

function HeroCarousel({ slides = [], language = "en", heroText = null }) {
  const safeSlides = Array.isArray(slides)
    ? slides.filter((slide) => {
        if (!slide) return false;
        const hasImage = Boolean(slide.image);
        const hasTitle = Boolean(getLocalizedValue(slide.title, language));
        const hasDescription = Boolean(
          getLocalizedValue(slide.description, language),
        );
        const hasLink = Boolean(slide.link);
        return hasImage || hasTitle || hasDescription || hasLink;
      })
    : [];
  const loopSlides =
    safeSlides.length > 1 ? [...safeSlides, safeSlides[0]] : safeSlides;
  const [index, setIndex] = React.useState(0);
  const [animate, setAnimate] = React.useState(true);

  React.useEffect(() => {
    if (safeSlides.length < 2) return undefined;
    const timer = setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, safeSlides.length]);

  React.useEffect(() => {
    setIndex(0);
    setAnimate(true);
  }, [safeSlides.length]);

  React.useEffect(() => {
    if (safeSlides.length === 0) return;
    if (index <= safeSlides.length) return;
    setIndex(0);
  }, [index, safeSlides.length]);

  React.useEffect(() => {
    if (safeSlides.length < 2) return undefined;
    if (index !== safeSlides.length) return undefined;

    const resetTimer = setTimeout(() => {
      setAnimate(false);
      setIndex(0);
      requestAnimationFrame(() => setAnimate(true));
    }, 650);

    return () => clearTimeout(resetTimer);
  }, [index, safeSlides.length]);

  if (safeSlides.length === 0) return null;

  const widthPercent = 100 / loopSlides.length;
  const activeDot = safeSlides.length > 0 ? index % safeSlides.length : 0;
  const heroHeading =
    getLocalizedValue(heroText?.heroHeading, language) ||
    getLocalizedValue(heroText?.title, language);
  const heroDescription = getLocalizedValue(
    heroText?.heroDescription,
    language,
  );
  const heroTextAlign = ["left", "center", "right"].includes(
    heroText?.heroTextAlign,
  )
    ? heroText.heroTextAlign
    : "center";
  const heroHeadingSize = Math.min(
    130,
    Math.max(28, Number(heroText?.heroHeadingSize) || 56),
  );
  const hasHeroOverlay = Boolean(heroHeading || heroDescription);

  return (
    <section style={{ marginBottom: 18 }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 0,
          width: "100%",
          height: HERO_BANNER_HEIGHT,
          background: "#000000",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: `${loopSlides.length * 100}%`,
            height: "100%",
            transform: `translateX(-${index * widthPercent}%)`,
            transition: animate ? "transform 650ms ease" : "none",
          }}
        >
          {loopSlides.map((slide, slideIndex) => {
            const title = getLocalizedValue(slide.title, language);
            const description = getLocalizedValue(slide.description, language);
            const hasCaption =
              hasHeroOverlay || Boolean(title || description || slide.link);
            const mediaUrl = resolveMediaUrl(slide.image || "");
            const videoSlide = isVideoUrl(mediaUrl);
            return (
              <div
                key={slide._id || slideIndex}
                style={{
                  flex: `0 0 ${widthPercent}%`,
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  background: mediaUrl
                    ? "#0f172a"
                    : "linear-gradient(120deg, #1d4ed8, #0f172a)",
                }}
              >
                {mediaUrl ? (
                  videoSlide ? (
                    <video
                      src={mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: HERO_MEDIA_FIT_MODE,
                        objectPosition: "center center",
                        background: "#000000",
                      }}
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={title || `Slide ${slideIndex + 1}`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: HERO_MEDIA_FIT_MODE,
                        objectPosition: "center center",
                      }}
                    />
                  )
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: hasCaption
                      ? "linear-gradient(90deg, rgba(15, 23, 42, 0.62) 0%, rgba(15, 23, 42, 0.12) 60%)"
                      : "transparent",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "48px",
                    maxWidth: hasHeroOverlay ? 920 : 640,
                    color: "white",
                  }}
                >
                  {hasHeroOverlay ? (
                    <div style={{ textAlign: heroTextAlign }}>
                      {heroHeading ? (
                        <h1
                          style={{
                            fontSize: `clamp(34px, 5vw, ${heroHeadingSize}px)`,
                            margin: 0,
                            lineHeight: 1.1,
                            textShadow: "0 4px 18px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                          {heroHeading}
                        </h1>
                      ) : null}
                      {heroDescription ? (
                        <p
                          style={{
                            margin: "14px 0 0",
                            fontSize: 18,
                            lineHeight: 1.6,
                            maxWidth: heroTextAlign === "center" ? 860 : 620,
                            marginLeft:
                              heroTextAlign === "right" ||
                              heroTextAlign === "center"
                                ? "auto"
                                : 0,
                            marginRight:
                              heroTextAlign === "left" ||
                              heroTextAlign === "center"
                                ? "auto"
                                : 0,
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                          }}
                        >
                          {heroDescription}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      {title ? (
                        <h1 style={{ fontSize: 36, marginBottom: 12 }}>
                          {title}
                        </h1>
                      ) : null}
                      {description ? (
                        <p
                          style={{
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 24,
                          }}
                        >
                          {description}
                        </p>
                      ) : null}
                      {slide.link ? (
                        <a
                          href={slide.link}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 18px",
                            borderRadius: 999,
                            background: "#f97316",
                            color: "white",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          Learn More
                        </a>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {safeSlides.length > 1 ? (
          <>
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
              }}
            >
              {safeSlides.map((_, dotIndex) => (
                <button
                  key={`dot-${dotIndex}`}
                  type="button"
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  onClick={() => {
                    setAnimate(true);
                    setIndex(dotIndex);
                  }}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "none",
                    background:
                      dotIndex === activeDot
                        ? "#f97316"
                        : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function NoticesSection({
  announcements = [],
  language = "en",
  navbarColors = { color1: "#1d4ed8", color2: "#0ea5e9" },
}) {
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const now = new Date();
  const noticeItems = safeAnnouncements
    .map((page) => {
      const startDate = page?.announcement?.startDate
        ? new Date(page.announcement.startDate)
        : null;
      const endDate = page?.announcement?.endDate
        ? new Date(page.announcement.endDate)
        : null;

      if (startDate && !Number.isNaN(startDate.getTime())) {
        startDate.setHours(0, 0, 0, 0);
        if (startDate > now) return null;
      }
      if (endDate && !Number.isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999);
        if (endDate < now) return null;
      }

      const title = getLocalizedValue(page?.title, language);
      const text = getAnnouncementText(page, language);
      if (!title && !text) return null;

      const linkRaw =
        page?.announcement?.linkUrl ||
        page?.announcement?.attachmentUrl ||
        page?.redirect_url ||
        "";
      const linkLabel =
        page?.announcement?.linkLabel ||
        page?.announcement?.attachmentLabel ||
        "Open";

      return {
        id: page?._id || page?.slug || text,
        title: title || text,
        summary: title ? text : "",
        link: resolveNoticeLink(linkRaw),
        linkLabel,
      };
    })
    .filter(Boolean);

  const importantLinks = noticeItems.filter((item) => item.link);
  const cardHeaderStyle = {
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 24,
    textAlign: "center",
    padding: "16px 18px",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background: `linear-gradient(135deg, ${navbarColors.color1} 0%, ${navbarColors.color2} 100%)`,
  };

  return (
    <section style={{ marginBottom: 26 }}>
      <div
        style={{
          background: "#CBD5E1",
          borderRadius: 18,
          padding: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden", background: "#FFFFFF" }}>
          <div style={cardHeaderStyle}>Notice Board</div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {noticeItems.length === 0 ? (
              <div style={{ padding: 16, color: "#6B7280", fontSize: 14 }}>
                No active notices at the moment.
              </div>
            ) : (
              noticeItems.map((item, index) => (
                <div
                key={`${item.id || "notice"}-${index}`}
                style={{
                  borderBottom: index < noticeItems.length - 1 ? "1px solid #D1D5DB" : "none",
                  padding: "12px 16px",
                  background: "#FFFFFF",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    {item.link ? (
                      <a
                        href={item.link}
                        target={isExternalLink(item.link) ? "_blank" : undefined}
                        rel={isExternalLink(item.link) ? "noreferrer" : undefined}
                        style={{
                          fontWeight: 600,
                          color: "#0F172A",
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        {item.title}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 600, color: "#0F172A" }}>
                        {item.title}
                      </span>
                    )}
                    {item.summary ? (
                      <div style={{ marginTop: 4, color: "#4B5563", fontSize: 13 }}>
                        {item.summary}
                      </div>
                    ) : null}
                  </div>
                  {item.link ? (
                    <a
                      href={item.link}
                      target={isExternalLink(item.link) ? "_blank" : undefined}
                      rel={isExternalLink(item.link) ? "noreferrer" : undefined}
                      style={{
                        color: "#2563EB",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        alignSelf: "center",
                      }}
                    >
                      {item.linkLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            )))}
          </div>
        </div>

        <div style={{ borderRadius: 16, overflow: "hidden", background: "#FFFFFF" }}>
          <div style={cardHeaderStyle}>Important Links</div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {importantLinks.length === 0 ? (
              <div style={{ padding: 16, color: "#6B7280", fontSize: 14 }}>
                No important links added yet.
              </div>
            ) : (
              importantLinks.map((item, index) => (
                <a
                  key={`${item.id || "link"}-${index}`}
                  href={item.link}
                  target={isExternalLink(item.link) ? "_blank" : undefined}
                  rel={isExternalLink(item.link) ? "noreferrer" : undefined}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    borderBottom:
                      index < importantLinks.length - 1
                        ? "1px solid #D1D5DB"
                        : "none",
                    color: "#0F172A",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  {item.title}
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PageContentSection({ section, language }) {
  const slug = String(section?.pageSlug || "").trim();
  const [pageData, setPageData] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    if (!slug) {
      setPageData(null);
      return () => {
        alive = false;
      };
    }

    getPageBySlug(slug)
      .then((page) => {
        if (!alive) return;
        setPageData(page || null);
      })
      .catch((error) => {
        if (!alive) return;
        console.error(`Failed to load page content for slug "${slug}":`, error);
        setPageData(null);
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  const htmlFromPage = getLocalizedValue(pageData?.content, language)?.html || "";
  const htmlFallback = getLocalizedValue(section?.blockContent, language) || "";
  const htmlContent = htmlFromPage || htmlFallback;

  if (!htmlContent) return null;

  return (
    <section
      key={section._id || section.id || slug}
      style={{ marginBottom: 32 }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

const HomePage = () => {
  const { currentLanguage } = useLanguage();
  const [sections, setSections] = React.useState([]);
  const [announcements, setAnnouncements] = React.useState([]);
  const [navbarColors, setNavbarColors] = React.useState({
    color1: "#1d4ed8",
    color2: "#0ea5e9",
  });
  const [loading, setLoading] = React.useState(true);
  const fullWidthStyle = {
    width: "calc(100% + 32px)",
    marginLeft: "-16px",
    marginRight: "-16px",
    marginTop: 8,
    padding: 0,
  };

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([
      listActiveHomeSections(),
      listPublicAnnouncements({ limit: 20 }),
      getTheme("navbar"),
    ])
      .then(([sectionsResult, announcementsResult, navbarThemeResult]) => {
        if (!alive) return;

        if (sectionsResult.status === "fulfilled") {
          setSections(
            Array.isArray(sectionsResult.value) ? sectionsResult.value : [],
          );
        } else {
          console.error(
            "Failed to load homepage sections:",
            sectionsResult.reason,
          );
          setSections([]);
        }

        if (announcementsResult.status === "fulfilled") {
          setAnnouncements(
            Array.isArray(announcementsResult.value)
              ? announcementsResult.value
              : [],
          );
        } else {
          console.error(
            "Failed to load announcements:",
            announcementsResult.reason,
          );
          setAnnouncements([]);
        }

        if (navbarThemeResult.status === "fulfilled") {
          const nextColor1 = navbarThemeResult.value?.colors?.color1;
          const nextColor2 = navbarThemeResult.value?.colors?.color2;
          if (nextColor1 && nextColor2) {
            setNavbarColors({ color1: nextColor1, color2: nextColor2 });
          }
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const refreshNavbarColors = async () => {
      try {
        const theme = await getTheme("navbar");
        if (!mounted) return;
        const nextColor1 = theme?.colors?.color1;
        const nextColor2 = theme?.colors?.color2;
        if (nextColor1 && nextColor2) {
          setNavbarColors({ color1: nextColor1, color2: nextColor2 });
        }
      } catch (error) {
        console.error("Failed to refresh navbar colors:", error);
      }
    };

    window.addEventListener("navbarColorsUpdated", refreshNavbarColors);
    return () => {
      mounted = false;
      window.removeEventListener("navbarColorsUpdated", refreshNavbarColors);
    };
  }, []);

  const renderSection = (section) => {
    if (!section) return null;

    if (section.type === "banner") {
      const title = getLocalizedValue(section.title, currentLanguage);
      const description = getLocalizedValue(
        section.bannerDescription,
        currentLanguage,
      );
      const bannerImage = resolveMediaUrl(section.bannerImage || "");
      return (
        <section key={section._id} style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: bannerImage
                ? "minmax(0, 1fr) minmax(0, 1fr)"
                : "1fr",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              {title ? (
                <h1 style={{ fontSize: 34, marginBottom: 12 }}>{title}</h1>
              ) : null}
              {description ? (
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>{description}</p>
              ) : null}
              {section.bannerLink ? (
                <a
                  href={section.bannerLink}
                  style={{
                    display: "inline-flex",
                    marginTop: 16,
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: "#2563eb",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Learn More
                </a>
              ) : null}
            </div>
            {bannerImage ? (
              <img
                src={bannerImage}
                alt={title || "Hero banner"}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 16,
                  objectFit: "cover",
                }}
              />
            ) : null}
          </div>
        </section>
      );
    }

    if (section.type === "block") {
      const htmlContent = getLocalizedValue(
        section.blockContent,
        currentLanguage,
      );
      if (!htmlContent) return null;
      return (
        <section
          key={section._id}
          style={{ marginBottom: 32 }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    if (section.type === "page_content") {
      return (
        <PageContentSection
          key={section._id || section.id || section.pageSlug}
          section={section}
          language={currentLanguage}
        />
      );
    }

    return null;
  };

  const sortedSections = Array.isArray(sections)
    ? sections.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const sliderSections = sortedSections.filter(
    (section) => section.type === "slider",
  );
  const heroSlidesFromSections = sliderSections
    .flatMap((section) => (Array.isArray(section.slides) ? section.slides : []))
    .sort((a, b) => (a?.order || 0) - (b?.order || 0));
  const heroTextSections = sortedSections.filter(
    (section) => section.type === "hero_text",
  );
  const heroTextSection = heroTextSections[0] || null;
  const contentSections = sortedSections.filter(
    (section) => section.type !== "slider" && section.type !== "hero_text",
  );
  const heroSlides =
    heroSlidesFromSections.length > 0
      ? heroSlidesFromSections
      : defaultHeroSlides;

  if (loading && sections.length === 0) {
    return (
      <div style={{ ...fullWidthStyle, padding: "24px 16px" }}>
        <p>Loading homepage...</p>
      </div>
    );
  }

  return (
    <div style={fullWidthStyle}>
      <HeroCarousel
        slides={heroSlides}
        language={currentLanguage}
        heroText={heroTextSection}
      />
      <NoticesSection
        announcements={announcements}
        language={currentLanguage}
        navbarColors={navbarColors}
      />

      {contentSections.length > 0 ? (
        contentSections.map((section) => (
          <React.Fragment key={section._id || section.id}>
            {renderSection(section)}
          </React.Fragment>
        ))
      ) : (
        <section
          style={{
            marginBottom: 32,
            border: "1px dashed #D1D5DB",
            borderRadius: 12,
            padding: 16,
            background: "#F9FAFB",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111827" }}>
            Home Content Is Empty
          </h3>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
            Add banner/block sections in Homepage Management to show content
            below announcements.
          </p>
        </section>
      )}
    </div>
  );
};

export default HomePage;
