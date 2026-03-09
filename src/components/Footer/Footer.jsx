import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
  FaGithub,
  FaGlobe,
} from "react-icons/fa";
import { listMenus, getTheme } from "../../api/resources.js";

const FOOTER_SOCIAL_MENU_SLUG = "footer-social-links";

const ICON_COMPONENTS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  github: FaGithub,
};

const FALLBACK_SOCIAL_LINKS = [
  { name: "Facebook", icon: "facebook", link: "#" },
  { name: "Twitter", icon: "twitter", link: "#" },
  { name: "Instagram", icon: "instagram", link: "#" },
  { name: "LinkedIn", icon: "linkedin", link: "#" },
];

const getItemName = (item = {}) =>
  item?.title?.en ||
  item?.title?.kn ||
  item?.name?.en ||
  item?.name?.kn ||
  item?.menu_name_en ||
  item?.label ||
  "";

const Footer = () => {
  const [socialLinks, setSocialLinks] = React.useState(FALLBACK_SOCIAL_LINKS);
  const [footerContact, setFooterContact] = React.useState({
    address: "Mangalore, Karnataka 575001",
    phone: "+91 1234567890",
    email: "info@kptmangalore.edu",
    description:
      "Excellence in Education since 1985. Providing quality education and fostering holistic development for students.",
  });
  const [quickLinks, setQuickLinks] = React.useState([
    { name: "About Us", link: "/about" },
    { name: "Academics", link: "/academics" },
    { name: "Admissions", link: "/admissions" },
    { name: "Facilities", link: "/facilities" },
    { name: "Contact", link: "/contact" },
  ]);

  const loadSocialLinks = React.useCallback(async () => {
    try {
      const menus = await listMenus();
      const footerSocialMenu = Array.isArray(menus)
        ? menus.find((menu) => menu.slug === FOOTER_SOCIAL_MENU_SLUG)
        : null;

      if (!footerSocialMenu || !Array.isArray(footerSocialMenu.items)) {
        setSocialLinks(FALLBACK_SOCIAL_LINKS);
      } else {
        const mappedSocialLinks = footerSocialMenu.items
          .filter((item) => !item?.status || item.status === "Approved")
          .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
          .map((item) => ({
            name: getItemName(item),
            icon: String(item?.icon || "").toLowerCase(),
            link: item?.redirect_url || item?.url || "#",
          }))
          .filter((item) => Boolean(item.name));

        setSocialLinks(
          mappedSocialLinks.length > 0
            ? mappedSocialLinks
            : FALLBACK_SOCIAL_LINKS,
        );
      }

      const footerQuickLinksMenu = Array.isArray(menus)
        ? menus.find((m) => m.slug === "footer-quick-links")
        : null;
      if (
        footerQuickLinksMenu &&
        Array.isArray(footerQuickLinksMenu.items) &&
        footerQuickLinksMenu.items.length > 0
      ) {
        setQuickLinks(
          footerQuickLinksMenu.items
            .filter((item) => !item.status || item.status === "Approved")
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
            .map((item) => ({
              name: getItemName(item),
              link: item.redirect_url || item.url || "#",
            })),
        );
      }

      try {
        const themeRes = await getTheme("footer_contact");
        if (themeRes && themeRes.contact) {
          setFooterContact(themeRes.contact);
        }
      } catch (err) {
        console.log("No custom footer_contact theme found, using defaults.");
      }
    } catch (error) {
      console.error("Failed to load footer social links:", error);
      setSocialLinks(FALLBACK_SOCIAL_LINKS);
    }
  }, []);

  React.useEffect(() => {
    loadSocialLinks();

    const handleFooterSocialUpdated = () => loadSocialLinks();
    window.addEventListener("footerSocialUpdated", handleFooterSocialUpdated);
    window.addEventListener("footerSettingsUpdated", handleFooterSocialUpdated);
    window.addEventListener("menusUpdated", handleFooterSocialUpdated);

    return () => {
      window.removeEventListener(
        "footerSocialUpdated",
        handleFooterSocialUpdated,
      );
      window.removeEventListener(
        "footerSettingsUpdated",
        handleFooterSocialUpdated,
      );
      window.removeEventListener("menusUpdated", handleFooterSocialUpdated);
    };
  }, [loadSocialLinks]);

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">KPT MANGALORE</h3>
            <p className="footer-description">{footerContact.description}</p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.link} className="footer-link">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contact Info</h4>
            <div className="footer-contact">
              <p className="contact-item">
                <span className="contact-label">Address:</span>
                <span className="contact-value">{footerContact.address}</span>
              </p>
              <p className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value">{footerContact.phone}</span>
              </p>
              <p className="contact-item">
                <span className="contact-label">Email:</span>
                <span className="contact-value">{footerContact.email}</span>
              </p>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Follow Us</h4>
            <div className="social-links">
              {socialLinks.map((social, index) => {
                const IconComponent = ICON_COMPONENTS[social.icon] || FaGlobe;
                const isExternal = /^https?:\/\//i.test(social.link || "");
                return (
                  <a
                    key={`${social.name}-${index}`}
                    href={social.link || "#"}
                    className="social-link"
                    aria-label={social.name}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                  >
                    <IconComponent size={20} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              (c) 2024 KPT MANGALORE. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="/privacy" className="footer-bottom-link">
                Privacy Policy
              </a>
              <a href="/terms" className="footer-bottom-link">
                Terms of Service
              </a>
              <a href="/sitemap" className="footer-bottom-link">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
