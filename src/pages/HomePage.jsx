import React from 'react';
import { listActiveHomeSections } from '../api/resources.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';

function getLocalizedValue(value, language) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || value.kn || '';
}

function HeroCarousel({ slides = [], language = 'en' }) {
  const safeSlides = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (safeSlides.length < 2) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [safeSlides.length]);

  if (safeSlides.length === 0) return null;

  const widthPercent = 100 / safeSlides.length;

  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          minHeight: 320,
          background: '#0f172a',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div
          style={{
            display: 'flex',
            width: `${safeSlides.length * 100}%`,
            transform: `translateX(-${index * widthPercent}%)`,
            transition: 'transform 600ms ease'
          }}
        >
          {safeSlides.map((slide, slideIndex) => {
            const title = getLocalizedValue(slide.title, language);
            const description = getLocalizedValue(slide.description, language);
            return (
              <div
                key={slide._id || slideIndex}
                style={{
                  width: `${widthPercent}%`,
                  position: 'relative',
                  minHeight: 320,
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
                      objectFit: 'cover'
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.25) 60%)'
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
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev - 1 + safeSlides.length) % safeSlides.length)}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: 'white',
                border: 'none',
                borderRadius: 999,
                width: 36,
                height: 36,
                cursor: 'pointer'
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % safeSlides.length)}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: 'white',
                border: 'none',
                borderRadius: 999,
                width: 36,
                height: 36,
                cursor: 'pointer'
              }}
            >
              Next
            </button>
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
                  onClick={() => setIndex(dotIndex)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: 'none',
                    background: dotIndex === index ? '#f97316' : 'rgba(255,255,255,0.4)',
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

const HomePage = () => {
  const { currentLanguage } = useLanguage();
  const [sections, setSections] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    listActiveHomeSections()
      .then((data) => {
        if (!alive) return;
        setSections(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Failed to load homepage sections:', error);
        if (alive) setSections([]);
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
    if (section.type === 'slider') {
      return <HeroCarousel slides={section.slides || []} language={currentLanguage} />;
    }

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

  if (loading && sections.length === 0) {
    return (
      <div className="container">
        <p>Loading homepage...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {sections.length > 0 ? (
        sections.map((section) => (
          <React.Fragment key={section._id || section.id}>{renderSection(section)}</React.Fragment>
        ))
      ) : (
        <>
          <h1>Welcome to KPT Mangalore</h1>
          <p>Excellence in Education since 1985</p>

          <section style={{ margin: '2rem 0' }}>
            <h2>About Our Institution</h2>
            <p>
              KPT Mangalore has been a beacon of educational excellence for over three decades. We provide quality
              education and foster holistic development for students.
            </p>
          </section>

          <section style={{ margin: '2rem 0' }}>
            <h2>Our Programs</h2>
            <p>
              We offer a wide range of undergraduate and postgraduate programs designed to meet the evolving needs of
              students and industry.
            </p>
          </section>

          <section style={{ margin: '2rem 0' }}>
            <h2>Campus Life</h2>
            <p>
              Experience vibrant campus life with numerous extracurricular activities, sports facilities, and cultural
              events throughout the year.
            </p>
          </section>

          <section style={{ margin: '2rem 0', minHeight: '400px' }}>
            <h2>Admissions</h2>
            <p>Join our community of learners. Admissions are now open for the upcoming academic year.</p>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;
