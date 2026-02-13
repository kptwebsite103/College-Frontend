import React from 'react';
import { listActiveHomeSections, listPublicAnnouncements } from '../api/resources.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';

function getLocalizedValue(value, language) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || value.kn || '';
}

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateLabel(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getAnnouncementText(page, language) {
  const explicitText = getLocalizedValue(page?.announcement?.text, language);
  if (explicitText) return explicitText;
  const html = getLocalizedValue(page?.content, language)?.html || '';
  return stripHtml(html);
}

const defaultHeroSlides = [
  {
    image: 'https://picsum.photos/1200/500?random=81',
    title: { en: 'Welcome to Our College', kn: '' },
    description: { en: 'Excellence in education and innovation.', kn: '' },
    link: '/home'
  },
  {
    image: 'https://picsum.photos/1200/500?random=82',
    title: { en: 'Admissions Open', kn: '' },
    description: { en: 'Apply now for the upcoming academic year.', kn: '' },
    link: '/home'
  }
];

function HeroCarousel({ slides = [], language = 'en' }) {
  const safeSlides = Array.isArray(slides)
    ? slides.filter((slide) => {
        if (!slide) return false;
        const hasImage = Boolean(slide.image);
        const hasTitle = Boolean(getLocalizedValue(slide.title, language));
        const hasDescription = Boolean(getLocalizedValue(slide.description, language));
        const hasLink = Boolean(slide.link);
        return hasImage || hasTitle || hasDescription || hasLink;
      })
    : [];
  const loopSlides = safeSlides.length > 1 ? [...safeSlides, safeSlides[0]] : safeSlides;
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

  return (
    <section style={{ marginBottom: 18 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 0,
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#000000',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div
          style={{
            display: 'flex',
            width: `${loopSlides.length * 100}%`,
            height: '100%',
            transform: `translateX(-${index * widthPercent}%)`,
            transition: animate ? 'transform 650ms ease' : 'none'
          }}
        >
          {loopSlides.map((slide, slideIndex) => {
            const title = getLocalizedValue(slide.title, language);
            const description = getLocalizedValue(slide.description, language);
            const hasCaption = Boolean(title || description || slide.link);
            return (
              <div
                key={slide._id || slideIndex}
                style={{
                  flex: `0 0 ${widthPercent}%`,
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  background: slide.image ? '#0f172a' : 'linear-gradient(120deg, #1d4ed8, #0f172a)'
                }}
              >
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt={title || `Slide ${slideIndex + 1}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center center'
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: hasCaption
                      ? 'linear-gradient(90deg, rgba(15, 23, 42, 0.62) 0%, rgba(15, 23, 42, 0.12) 60%)'
                      : 'transparent'
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '48px',
                    maxWidth: 640,
                    color: 'white'
                  }}
                >
                  {title ? <h1 style={{ fontSize: 36, marginBottom: 12 }}>{title}</h1> : null}
                  {description ? <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>{description}</p> : null}
                  {slide.link ? (
                    <a
                      href={slide.link}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 18px',
                        borderRadius: 999,
                        background: '#f97316',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      Learn More
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {safeSlides.length > 1 ? (
          <>
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8
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
                    borderRadius: '50%',
                    border: 'none',
                    background: dotIndex === activeDot ? '#f97316' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer'
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

function AnnouncementsSection({ announcements = [], language = 'en' }) {
  if (!Array.isArray(announcements) || announcements.length === 0) return null;

  const announcementItems = announcements
    .map((page) => {
      const text = getAnnouncementText(page, language);
      if (!text) return null;
      const fromDate = formatDateLabel(page?.announcement?.startDate || page?.createdAt);
      const toDate = formatDateLabel(page?.announcement?.endDate);
      const dateLabel = toDate ? `${fromDate} to ${toDate}` : fromDate;
      const attachmentUrl = page?.announcement?.attachmentUrl || '';
      const attachmentLabel = page?.announcement?.attachmentLabel || 'Attachment';

      return {
        id: page?._id || page?.slug || text,
        text,
        dateLabel,
        attachmentUrl,
        attachmentLabel
      };
    })
    .filter(Boolean);

  if (announcementItems.length === 0) return null;

  const tickerItems = announcementItems.concat(announcementItems);

  return (
    <section style={{ marginBottom: 20 }}>
      <style>{`
        @keyframes announcementTicker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 44,
          borderTop: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          background: '#FFFFFF'
        }}
      >
        <div
          style={{
            minWidth: 142,
            padding: '10px 12px',
            fontSize: 13,
            fontWeight: 700,
            color: '#FFFFFF',
            background: '#111827',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          Announcements
        </div>
        <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minWidth: 'max-content',
              animation: `announcementTicker ${Math.max(24, announcementItems.length * 10)}s linear infinite`
            }}
          >
            {tickerItems.map((item, index) => (
              <span
                key={`${item.id}-${index}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 20px',
                  fontSize: 14,
                  color: '#1F2937'
                }}
              >
                <span>{item.text}</span>
                {item.dateLabel ? (
                  <span style={{ color: '#6B7280', fontSize: 12 }}>({item.dateLabel})</span>
                ) : null}
                {item.attachmentUrl ? (
                  <a
                    href={item.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {item.attachmentLabel}
                  </a>
                ) : null}
                <span style={{ color: '#9CA3AF' }}>|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const HomePage = () => {
  const { currentLanguage } = useLanguage();
  const [sections, setSections] = React.useState([]);
  const [announcements, setAnnouncements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const fullWidthStyle = {
    width: 'calc(100% + 32px)',
    marginLeft: '-16px',
    marginRight: '-16px',
    marginTop: 8,
    padding: 0
  };

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([listActiveHomeSections(), listPublicAnnouncements({ limit: 6 })])
      .then(([sectionsResult, announcementsResult]) => {
        if (!alive) return;

        if (sectionsResult.status === 'fulfilled') {
          setSections(Array.isArray(sectionsResult.value) ? sectionsResult.value : []);
        } else {
          console.error('Failed to load homepage sections:', sectionsResult.reason);
          setSections([]);
        }

        if (announcementsResult.status === 'fulfilled') {
          setAnnouncements(Array.isArray(announcementsResult.value) ? announcementsResult.value : []);
        } else {
          console.error('Failed to load announcements:', announcementsResult.reason);
          setAnnouncements([]);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const renderSection = (section) => {
    if (!section) return null;

    if (section.type === 'banner') {
      const title = getLocalizedValue(section.title, currentLanguage);
      const description = getLocalizedValue(section.bannerDescription, currentLanguage);
      return (
        <section key={section._id} style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: section.bannerImage ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
              gap: 24,
              alignItems: 'center'
            }}
          >
            <div>
              {title ? <h1 style={{ fontSize: 34, marginBottom: 12 }}>{title}</h1> : null}
              {description ? <p style={{ fontSize: 16, lineHeight: 1.6 }}>{description}</p> : null}
              {section.bannerLink ? (
                <a
                  href={section.bannerLink}
                  style={{
                    display: 'inline-flex',
                    marginTop: 16,
                    padding: '10px 18px',
                    borderRadius: 999,
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Learn More
                </a>
              ) : null}
            </div>
            {section.bannerImage ? (
              <img
                src={section.bannerImage}
                alt={title || 'Hero banner'}
                style={{ width: '100%', height: 'auto', borderRadius: 16, objectFit: 'cover' }}
              />
            ) : null}
          </div>
        </section>
      );
    }

    if (section.type === 'block') {
      const htmlContent = getLocalizedValue(section.blockContent, currentLanguage);
      if (!htmlContent) return null;
      return (
        <section
          key={section._id}
          style={{ marginBottom: 32 }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    return null;
  };

  const sortedSections = Array.isArray(sections)
    ? sections.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const sliderSections = sortedSections.filter((section) => section.type === 'slider');
  const heroSlidesFromSections = sliderSections
    .flatMap((section) => (Array.isArray(section.slides) ? section.slides : []))
    .sort((a, b) => (a?.order || 0) - (b?.order || 0));
  const contentSections = sortedSections.filter((section) => section.type !== 'slider');
  const heroSlides = heroSlidesFromSections.length > 0 ? heroSlidesFromSections : defaultHeroSlides;

  if (loading && sections.length === 0) {
    return (
      <div style={{ ...fullWidthStyle, padding: '24px 16px' }}>
        <p>Loading homepage...</p>
      </div>
    );
  }

  return (
    <div style={fullWidthStyle}>
      <HeroCarousel slides={heroSlides} language={currentLanguage} />
      <AnnouncementsSection announcements={announcements} language={currentLanguage} />

      {contentSections.length > 0 ? (
        contentSections.map((section) => (
          <React.Fragment key={section._id || section.id}>{renderSection(section)}</React.Fragment>
        ))
      ) : (
        <section
          style={{
            marginBottom: 32,
            border: '1px dashed #D1D5DB',
            borderRadius: 12,
            padding: 16,
            background: '#F9FAFB'
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#111827' }}>Home Content Is Empty</h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
            Add banner/block sections in Homepage Management to show content below announcements.
          </p>
        </section>
      )}
    </div>
  );
};

export default HomePage;
