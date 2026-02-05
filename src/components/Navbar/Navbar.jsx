import {useRef, useState, useEffect} from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from "../../contexts/LanguageContext";
import './Navbar.css'

function Navbar() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Navigation />
      </header>
    </div>
  )
}

function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState({}) // Changed to object to handle multiple dropdowns
  const navRef = useRef(null) // Ref for the navbar to detect outside clicks
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()

  // Translation-based navigation structure with stable IDs
  const getNavigationData = () => {
    return [
      { id: 'home', label: t('nav.home'), href: '/home' },
      {
        id: 'about',
        label: t('nav.about'),
        children: [
          { id: 'about-kpt', label: t('nav.about_kpt'), href: '#about-kpt' },
          { id: 'governing-body', label: t('nav.governing_body'), href: '#about-governing-body' },
          { id: 'administration', label: t('nav.administration'), href: '#about-administration' },
          { id: 'statutory-committee', label: t('nav.statutory_committee'), href: '#about-statutory-committee' },
          { id: 'academic-council', label: t('nav.academic_council'), href: '#about-academic-council' },
          { id: 'iiic', label: t('nav.iiic'), href: '#about-iiic' },
          { id: 'iqac', label: t('nav.iqac'), href: '#about-iqac' },
          { id: 'life-at-kpt', label: t('nav.life_at_kpt'), href: '#about-life-kpt' },
        ],
      },
      {
        id: 'departments',
        label: t('nav.departments'),
        children: [
          {
            id: 'cse',
            label: t('nav.cse'),
            children: [
              { id: 'cse-overview', label: t('nav.overview'), href: '#dept-cse-overview' },
              { id: 'cse-faculty', label: t('nav.faculty'), href: '#dept-cse-faculty' },
              {
                id: 'cse-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'cse-hardware-lab', label: t('nav.hardware_lab'), href: '#dept-cse-facilities-cs-hardware-and-network-lab' },
                  { id: 'cse-it-lab', label: t('nav.it_lab'), href: '#dept-cse-facilities-it-lab' }
                ]
              }
            ]
          },
          {
            id: 'automobile',
            label: t('nav.automobile'),
            children: [
              { id: 'auto-overview', label: t('nav.overview'), href: '#dept-auto-overview' },
              { id: 'auto-faculty', label: t('nav.faculty'), href: '#dept-auto-faculty' },
              {
                id: 'auto-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'auto-thermal-lab', label: t('nav.thermal_lab'), href: '#dept-auto-facilities-thermal-lab' },
                  { id: 'auto-vehicle-lab', label: t('nav.vehicle_lab'), href: '#dept-auto-facilities-vehicle-body-design-lab' },
                  { id: 'auto-transmission-lab', label: t('nav.transmission_lab'), href: '#dept-auto-facilities-transmission-lab' },
                  { id: 'auto-engine-testing', label: t('nav.engine_testing'), href: '#dept-auto-facilities-engine-testing' }
                ]
              }
            ]
          },
          {
            id: 'chemical',
            label: t('nav.chemical'),
            children: [
              { id: 'chemical-overview', label: t('nav.overview'), href: '#dept-chemical-overview' },
              { id: 'chemical-faculty', label: t('nav.faculty'), href: '#dept-chemical-faculty' },
              {
                id: 'chemical-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'chemical-technical-lab', label: t('nav.technical_lab'), href: '#dept-chemical-facilities-technical-analysis-lab' },
                  { id: 'chemical-momentum-lab', label: t('nav.momentum_lab'), href: '#dept-chemical-facilities-momentum-transfer-lab' },
                  { id: 'chemical-particulate-lab', label: t('nav.particulate_lab'), href: '#dept-chemical-facilities-particulate-technology-lab' },
                  { id: 'chemical-heat-lab', label: t('nav.heat_lab'), href: '#dept-chemical-facilities-heat-transfer-lab' }
                ]
              }
            ]
          },
          {
            id: 'civil',
            label: t('nav.civil'),
            children: [
              { id: 'civil-overview', label: t('nav.overview'), href: '#dept-civil-overview' },
              { id: 'civil-faculty', label: t('nav.faculty'), href: '#dept-civil-faculty' },
              {
                id: 'civil-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'civil-surveying-lab', label: t('nav.surveying_lab'), href: '#dept-civil-facilities-surveying-lab' },
                  { id: 'civil-mt-lab', label: t('nav.mt_lab'), href: '#dept-civil-facilities-mt-lab' },
                  { id: 'civil-cad-lab', label: t('nav.cad_lab'), href: '#dept-civil-facilities-cad-lab' }
                ]
              }
            ]
          },
          {
            id: 'ece',
            label: t('nav.ece'),
            children: [
              { id: 'ece-overview', label: t('nav.overview'), href: '#dept-ece-overview' },
              { id: 'ece-faculty', label: t('nav.faculty'), href: '#dept-ece-faculty' },
              {
                id: 'ece-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'ece-electronic-lab', label: t('nav.electronic_lab'), href: '#dept-ece-facilities-electronic-lab' },
                  { id: 'ece-auto-elec-lab', label: t('nav.auto_elec_lab'), href: '#dept-ece-facilities-automatic-electronic-electrical-lab' },
                  { id: 'ece-service-lab', label: t('nav.service_lab'), href: '#dept-ece-facilities-service-lab' },
                  { id: 'ece-computer-lab', label: t('nav.computer_lab'), href: '#dept-ece-facilities-computer-lab' },
                  { id: 'ece-iot-lab', label: t('nav.iot_lab'), href: '#dept-ece-facilities-iot-lab' }
                ]
              }
            ]
          },
          {
            id: 'eee',
            label: t('nav.eee'),
            children: [
              { id: 'eee-overview', label: t('nav.overview'), href: '#dept-eee-overview' },
              { id: 'eee-faculty', label: t('nav.faculty'), href: '#dept-eee-faculty' },
              {
                id: 'eee-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'eee-switchgear-lab', label: t('nav.switchgear_lab'), href: '#dept-eee-facilities-switchgear-lab' },
                  { id: 'eee-wiring-lab', label: t('nav.wiring_lab'), href: '#dept-eee-facilities-wiring-lab' },
                  { id: 'eee-electronics-lab', label: t('nav.electronics_lab'), href: '#dept-eee-facilities-electronics-lab' },
                  { id: 'eee-computer-lab', label: t('nav.computer_lab'), href: '#dept-eee-facilities-computer-lab' },
                  { id: 'eee-motor-lab', label: t('nav.motor_lab'), href: '#dept-eee-facilities-electrical-motor-lab' }
                ]
              }
            ]
          },
          {
            id: 'mechanical',
            label: t('nav.mechanical'),
            children: [
              { id: 'mech-overview', label: t('nav.overview'), href: '#dept-mech-overview' },
              { id: 'mech-faculty', label: t('nav.faculty'), href: '#dept-mech-faculty' },
              {
                id: 'mech-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'mech-thermal-lab', label: t('nav.thermal_lab'), href: '#dept-mech-facilities-thermal-lab' },
                  { id: 'mech-machine-shop', label: t('nav.machine_shop'), href: '#dept-mech-facilities-machine-shop' },
                  { id: 'mech-carpentry', label: t('nav.carpentry'), href: '#dept-mech-facilities-carpentry-fitting' },
                  { id: 'mech-welding-lab', label: t('nav.welding_lab'), href: '#dept-mech-facilities-welding-sheet-lab' },
                  { id: 'mech-forging-lab', label: t('nav.forging_lab'), href: '#dept-mech-facilities-forging-lab' }
                ]
              }
            ]
          },
          {
            id: 'polymer',
            label: t('nav.polymer'),
            children: [
              { id: 'polymer-overview', label: t('nav.overview'), href: '#dept-polymer-overview' },
              { id: 'polymer-faculty', label: t('nav.faculty'), href: '#dept-polymer-faculty' },
              {
                id: 'polymer-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'polymer-engineering-workshop', label: t('nav.engineering_workshop'), href: '#dept-polymer-facilities-engineering-workshop' },
                  { id: 'polymer-computer-lab', label: t('nav.computer_lab'), href: '#dept-polymer-facilities-computer-lab' },
                  { id: 'polymer-science-lab', label: t('nav.science_lab'), href: '#dept-polymer-facilities-science-lab' },
                  { id: 'polymer-industrial-lab', label: t('nav.industrial_lab'), href: '#dept-polymer-facilities-industrial-machinery-lab' }
                ]
              }
            ]
          },
          {
            id: 'science-dept',
            label: t('nav.science_dept'),
            children: [
              { id: 'science-overview', label: t('nav.overview'), href: '#dept-science-overview' },
              { id: 'science-faculty', label: t('nav.faculty'), href: '#dept-science-faculty' },
              {
                id: 'science-facilities',
                label: t('nav.facilities'),
                children: [
                  { id: 'science-language-lab', label: t('nav.language_lab'), href: '#dept-science-facilities-language-lab' },
                  { id: 'science-science-lab', label: t('nav.science_lab'), href: '#dept-science-facilities-science-lab' }
                ]
              }
            ]
          },
        ],
      },
      {
        id: 'academics',
        label: t('nav.academics'),
        children: [
          { id: 'academics-fee-structure', label: t('nav.fee_structure'), href: '#academics-fee-structure' },
          { id: 'academics-timetable', label: t('nav.timetable'), href: '#academics-timetable' },
          { id: 'academics-calendar', label: t('nav.academic_calendar'), href: '#academics-calendar' },
          {
            id: 'academics-curriculum',
            label: t('nav.curriculum'),
            children: [
              { id: 'academics-view-syllabus', label: t('nav.view_syllabus'), href: '#academics-curriculum-view-syllabus' }
            ]
          },
          { id: 'academics-courses-offered', label: t('nav.courses_offered'), href: '#academics-courses' },
        ],
      },
      {
        id: 'admissions',
        label: t('nav.admissions'),
        children: [
          {
            id: 'admissions-procedure',
            label: t('nav.admission_procedure'),
            children: [
              { id: 'admissions-regular', label: t('nav.regular_students'), href: '#admission-procedure-regular' },
              { id: 'admissions-lateral', label: t('nav.lateral_students'), href: '#admission-procedure-lateral' }
            ]
          },
          { id: 'admissions-online-application', label: t('nav.online_application'), href: '#admission-online-application' },
          { id: 'admissions-fee-structure', label: t('nav.fee_structure'), href: '#admission-fee-structure' },
          { id: 'admissions-scholarships', label: t('nav.scholarships'), href: '#admission-scholarships' },
        ],
      },
      {
        id: 'student-life',
        label: t('nav.student_life'),
        children: [
          {
            id: 'student-life-anti-ragging',
            label: t('nav.anti_ragging'),
            children: [
              { id: 'anti-ragging-about', label: t('nav.about_anti_ragging'), href: '#life-anti-ragging-about' },
              { id: 'anti-ragging-committee', label: t('nav.anti_ragging_committee'), href: '#life-anti-ragging-committee' }
            ]
          },
          { id: 'student-life-achievements', label: t('nav.achievements'), href: '#life-achievements' },
          { id: 'student-life-alumni', label: t('nav.alumni'), href: '#life-alumni' },
          {
            id: 'student-life-clubs',
            label: t('nav.clubs'),
            children: [
              { id: 'clubs-eco', label: t('nav.eco_club'), href: '#life-clubs-eco' },
              { id: 'clubs-yrc', label: t('nav.yrc'), href: '#life-clubs-yrc' },
              { id: 'clubs-sports', label: t('nav.sports_club'), href: '#life-clubs-sports' },
              { id: 'clubs-ncc', label: t('nav.ncc'), href: '#life-clubs-ncc' },
              { id: 'clubs-yoga', label: t('nav.yoga_club'), href: '#life-clubs-yoga' },
              { id: 'clubs-art', label: t('nav.art_club'), href: '#life-clubs-art-cultural' },
              { id: 'clubs-technical', label: t('nav.technical_club'), href: '#life-clubs-technical' },
              { id: 'clubs-nss', label: t('nav.nss'), href: '#life-clubs-nss' }
            ]
          },
          { id: 'student-life-union', label: t('nav.student_union'), href: '#life-student-union' },
        ],
      },
      {
        id: 'training-placements',
        label: t('nav.training_placements'),
        children: [
          { id: 'training-events', label: t('nav.events'), href: '#training-events' },
          { id: 'training-circulars', label: t('nav.circulars'), href: '#training-circulars' },
          { id: 'training-contact', label: t('nav.contact'), href: '#training-contact' },
          { id: 'training-dept-circulars', label: t('nav.dept_circulars'), href: '#training-ditek-circulars' },
          { id: 'training-mandatory-files', label: t('nav.mandatory_files'), href: '#training-mandatory-files' },
          { id: 'training-procurement', label: t('nav.procurement'), href: '#training-procurement' },
          { id: 'training-cctek', label: t('nav.cctek'), href: '#training-cctek' },
          { id: 'training-faq', label: t('nav.faq'), href: '#training-faq' },
        ],
      },
      {
        id: 'info-contact',
        label: t('nav.info_contact'),
        children: [
          { id: 'info-events', label: t('nav.events'), href: '#info-events' },
          { id: 'info-circulars', label: t('nav.circulars'), href: '#info-circulars' },
          { id: 'info-contact', label: t('nav.contact'), href: '#info-contact' },
          { id: 'info-dept-circulars', label: t('nav.dept_circulars'), href: '#info-dtek-circulars' },
          { id: 'info-mandatory-files', label: t('nav.mandatory_files'), href: '#info-mandatory-files' },
          { id: 'info-procurement', label: t('nav.procurement'), href: '#info-procurement' },
          { id: 'info-cctek', label: t('nav.cctek'), href: '#info-cctek' },
          { id: 'info-faq', label: t('nav.faq'), href: '#info-faq' },
        ],
      },
    ]
  }

  const navigation = getNavigationData()

  const handleLinkClick = () => {
    setMobileOpen(false)
    setOpenDropdowns({})
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdowns({})
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleDropdown = (key, e) => {
    e?.stopPropagation();
    setOpenDropdowns((prev) => {
      const isOpen = !!prev[key];

      // Find the parent key to identify siblings
      const parts = key.split('-');
      const parentKey = parts.length > 1 ? parts.slice(0, -1).join('-') : null;

      const nextState = {};

      // Keep parent dropdowns open
      if (parentKey) {
        parentKey.split('-').reduce((acc, part) => {
          const ancestorKey = acc ? `${acc}-${part}` : part;
          nextState[ancestorKey] = true;
          return ancestorKey;
        }, '');
      }

      // Toggle the current dropdown if it wasn't already open
      if (!isOpen) {
        nextState[key] = true;
      }

      return nextState;
    });
  };


  const isDropdownOpen = (key) => !!openDropdowns[key]

  const renderDropdown = (items, parentKey = '', depth = 0) => {
    const isNested = depth > 1
    const isMain = depth === 1

    return (
      <ul
        className={`dropdown ${isNested ? 'nested-dropdown' : ''} ${isMain ? 'main-dropdown' : ''} ${isDropdownOpen(parentKey) ? 'is-open' : ''}`}
        aria-label={`${parentKey || ''} submenu`}
      >
        {items.map((item) => {
          const key = parentKey ? `${parentKey}-${item.id}` : item.id
          return (
            <li
              key={key}
              className={item.children ? 'has-nested' : ''}
              aria-expanded={isDropdownOpen(key)}
            >
              {item.children ? (
                <>
                  <button
                    className="nav-link nav-link--nested"
                    onClick={(e) => toggleDropdown(key, e)}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <span className="dropdown-arrow" aria-hidden="true">›</span>
                  </button>
                  {renderDropdown(item.children, key, depth + 1)}
                </>
              ) : (
                <a href={item.href} onClick={handleLinkClick} className="nav-link">
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <nav className="navbar" aria-label="Primary" ref={navRef}>
      <button
        className="navbar__toggle"
        aria-expanded={mobileOpen}
        aria-label="Toggle navigation menu"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      <ul className={`navbar__links ${mobileOpen ? 'is-open' : ''}`}>
        {navigation.map((item) => {
          const key = item.id
          return (
            <li
              key={key}
              className={`nav-item ${item.children ? 'has-dropdown' : ''}`}
              aria-expanded={isDropdownOpen(key)}
            >
              {item.children ? (
                <>
                  <button
                    className="nav-link nav-link--dropdown"
                    onClick={(e) => toggleDropdown(key, e)}
                    aria-controls={`${item.id}-menu`}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <span aria-hidden="true">▾</span>
                  </button>
                  {renderDropdown(item.children, key, 1)}
                </>
              ) : (
                <a className="nav-link" href={item.href} onClick={handleLinkClick}>
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const slugify = (value) => value.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-')
export default Navbar