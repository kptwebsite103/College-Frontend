import {useRef, useState, useEffect, useMemo} from 'react'
import './Navbar.css'

const navigation = [
  { label: 'Home', href: '#home' },
  {
    label: 'About',
    children: [
      { label: 'About KPT', href: '#about-kpt' },
      { label: 'Governing Body', href: '#about-governing-body' },
      { label: 'Administration', href: '#about-administration' },
      { label: 'Statutory Committee', href: '#about-statutory-committee' },
      { label: 'Academic Council', href: '#about-academic-council' },
      {
        label: 'Institute Industry Interaction Cell (IIIC)',
        href: '#about-iiic',
      },
      {
        label: 'Internal Quality Assurance Cell (IQAC)',
        href: '#about-iqac',
      },
      { label: 'Life at KPT', href: '#about-life-kpt' },
    ],
  },
  {
    label: 'Departments',
    children: [
      {
        label: 'Computer Science and Engineering',
        children: [
          { label: 'Overview', href: '#dept-cse-overview' },
          { label: 'Faculty', href: '#dept-cse-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Hardware and Network lab', href: '#dept-cse-facilities-cs-hardware-and-network-lab' },
              { label: 'IT lab', href: '#dept-cse-facilities-it-lab' }
            ]
          }
        ]
      },
      {
        label: 'Automobile Engineering',
        children: [
          { label: 'Overview', href: '#dept-auto-overview' },
          { label: 'Faculty', href: '#dept-auto-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Thermal lab', href: '#dept-auto-facilities-thermal-lab' },
              { label: 'Vehicle body design lab', href: '#dept-auto-facilities-vehicle-body-design-lab' },
              { label: 'Transmission lab', href: '#dept-auto-facilities-transmission-lab' },
              { label: 'Engine Testing', href: '#dept-auto-facilities-engine-testing' }
            ]
          }
        ]
      },
      {
        label: 'Chemical Engineering',
        children: [
          { label: 'Overview', href: '#dept-chemical-overview' },
          { label: 'Faculty', href: '#dept-chemical-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Technical Analysis Lab', href: '#dept-chemical-facilities-technical-analysis-lab' },
              { label: 'Momentum Transfer Lab', href: '#dept-chemical-facilities-momentum-transfer-lab' },
              { label: 'Particulate Technology Lab', href: '#dept-chemical-facilities-particulate-technology-lab' },
              { label: 'Heat Transfer Lab', href: '#dept-chemical-facilities-heat-transfer-lab' }
            ]
          }
        ]
      },
      {
        label: 'Civil Engineering',
        children: [
          { label: 'Overview', href: '#dept-civil-overview' },
          { label: 'Faculty', href: '#dept-civil-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Surveying Lab', href: '#dept-civil-facilities-surveying-lab' },
              { label: 'MT Lab', href: '#dept-civil-facilities-mt-lab' },
              { label: 'CAD Lab', href: '#dept-civil-facilities-cad-lab' }
            ]
          }
        ]
      },
      {
        label: 'Electronics and Communication Engineering',
        children: [
          { label: 'Overview', href: '#dept-ece-overview' },
          { label: 'Faculty', href: '#dept-ece-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Electronic Lab', href: '#dept-ece-facilities-electronic-lab' },
              { label: 'Automatic Electronic & Electrical Lab', href: '#dept-ece-facilities-automatic-electronic-electrical-lab' },
              { label: 'Service Lab', href: '#dept-ece-facilities-service-lab' },
              { label: 'Computer Lab', href: '#dept-ece-facilities-computer-lab' },
              { label: 'IoT Lab', href: '#dept-ece-facilities-iot-lab' }
            ]
          }
        ]
      },
      {
        label: 'Electrical and Electronics Engineering',
        children: [
          { label: 'Overview', href: '#dept-eee-overview' },
          { label: 'Faculty', href: '#dept-eee-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Switchgear Lab', href: '#dept-eee-facilities-switchgear-lab' },
              { label: 'Wiring Lab', href: '#dept-eee-facilities-wiring-lab' },
              { label: 'Electronics Lab', href: '#dept-eee-facilities-electronics-lab' },
              { label: 'Computer Lab', href: '#dept-eee-facilities-computer-lab' },
              { label: 'Electrical Motor Lab', href: '#dept-eee-facilities-electrical-motor-lab' }
            ]
          }
        ]
      },
      {
        label: 'Mechanical Engineering',
        children: [
          { label: 'Overview', href: '#dept-mech-overview' },
          { label: 'Faculty', href: '#dept-mech-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Thermal Lab', href: '#dept-mech-facilities-thermal-lab' },
              { label: 'Machine Shop', href: '#dept-mech-facilities-machine-shop' },
              { label: 'Carpentry Fitting', href: '#dept-mech-facilities-carpentry-fitting' },
              { label: 'Welding Sheet Lab', href: '#dept-mech-facilities-welding-sheet-lab' },
              { label: 'Forging Lab', href: '#dept-mech-facilities-forging-lab' }
            ]
          }
        ]
      },
      {
        label: 'Polymer Technology',
        children: [
          { label: 'Overview', href: '#dept-polymer-overview' },
          { label: 'Faculty', href: '#dept-polymer-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Engineering Workshop', href: '#dept-polymer-facilities-engineering-workshop' },
              { label: 'Computer Lab', href: '#dept-polymer-facilities-computer-lab' },
              { label: 'Science Lab', href: '#dept-polymer-facilities-science-lab' },
              { label: 'Industrial Machinery Lab', href: '#dept-polymer-facilities-industrial-machinery-lab' }
            ]
          }
        ]
      },
      {
        label: 'Science Department',
        children: [
          { label: 'Overview', href: '#dept-science-overview' },
          { label: 'Faculty', href: '#dept-science-faculty' },
          {
            label: 'Facilities',
            children: [
              { label: 'Language Lab', href: '#dept-science-facilities-language-lab' },
              { label: 'Science Lab', href: '#dept-science-facilities-science-lab' }
            ]
          }
        ]
      },
    ],
  },
  {
    label: 'Academics',
    children: [
      { label: 'Fee Structure', href: '#academics-fee-structure' },
      { label: 'Time Table', href: '#academics-timetable' },
      { label: 'Academic Calendar', href: '#academics-calendar' },
      {
        label: 'Curriculum',
        children: [
          { label: 'View Syllabus', href: '#academics-curriculum-view-syllabus' }
        ]
      },
      { label: 'Courses Offered', href: '#academics-courses' },
    ],
  },
  {
    label: 'Admissions',
    children: [
      {
        label: 'Admission Procedure',
        children: [
          { label: 'Regular Students', href: '#admission-procedure-regular' },
          { label: 'Lateral Entry Students', href: '#admission-procedure-lateral' }
        ]
      },
      { label: 'Online Application', href: '#admission-online-application' },
      { label: 'Fee Structure', href: '#admission-fee-structure' },
      { label: 'Scholarships', href: '#admission-scholarships' },
    ],
  },
  {
    label: 'Student Life',
    children: [
      {
        label: 'Anti Ragging',
        children: [
          { label: 'About Anti Ragging', href: '#life-anti-ragging-about' },
          { label: 'Anti Ragging Committee', href: '#life-anti-ragging-committee' }
        ]
      },
      { label: 'Achievements', href: '#life-achievements' },
      { label: 'Alumni', href: '#life-alumni' },
      {
        label: 'Clubs & Associations',
        children: [
          { label: 'Eco Club', href: '#life-clubs-eco' },
          { label: 'Youth Red Cross', href: '#life-clubs-yrc' },
          { label: 'Sports Club', href: '#life-clubs-sports' },
          { label: 'NCC', href: '#life-clubs-ncc' },
          { label: 'Yoga Club', href: '#life-clubs-yoga' },
          { label: 'Art & Cultural Club', href: '#life-clubs-art-cultural' },
          { label: 'Technical Club', href: '#life-clubs-technical' },
          { label: 'NSS', href: '#life-clubs-nss' }
        ]
      },
      { label: 'Student Union', href: '#life-student-union' },
    ],
  },
  {
    label: 'Training & Placements',
    children: [
      { label: 'Events', href: '#training-events' },
      { label: 'College Circulars', href: '#training-circulars' },
      { label: 'Contact', href: '#training-contact' },
      { label: 'Departmental Circulars DTEK', href: '#training-ditek-circulars' },
      { label: 'Mandatory Files', href: '#training-mandatory-files' },
      { label: 'Procurement', href: '#training-procurement' },
      { label: 'CCTEK', href: '#training-cctek' },
      { label: 'FAQ', href: '#training-faq' },
    ],
  },
  {
    label: 'Information / Contact',
    children: [
      { label: 'Events', href: '#info-events' },
      { label: 'College Circulars', href: '#info-circulars' },
      { label: 'Contact', href: '#info-contact' },
      { label: 'Departmental Circulars DTEK', href: '#info-ditek-circulars' },
      { label: 'Mandatory Files', href: '#info-mandatory-files' },
      { label: 'Procurement', href: '#info-procurement' },
      { label: 'CCTEK', href: '#info-cctek' },
      { label: 'FAQ', href: '#info-faq' },
    ],
  },
]

function Navbar() {
  const navIds = useMemo(
    () =>
      navigation.reduce((map, item) => {
        map[item.label] = slugify(item.label)
        return map
      }, {}),
    [],
  )

  return (
    <div className="site-shell">
      <header className="site-header">
        <Navigation slugLookup={navIds} />
      </header>
    </div>
  )
}

function Navigation({ slugLookup }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState({}) // Changed to object to handle multiple dropdowns
  const navRef = useRef(null) // Ref for the navbar to detect outside clicks

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

  const renderDropdown = (items, parentKey = '') => {
    return (
      <ul
        className={`dropdown ${parentKey ? 'nested-dropdown' : ''} ${!parentKey.includes('-') ? 'main-dropdown' : ''} ${isDropdownOpen(parentKey) ? 'is-open' : ''}`}
        aria-label={`${parentKey || ''} submenu`}
      >
        {items.map((item) => {
          const key = parentKey ? `${parentKey}-${item.label}` : item.label
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
                  {renderDropdown(item.children, key)}
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
          const key = item.label
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
                    aria-controls={`${slugLookup[item.label]}-menu`}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <span aria-hidden="true">▾</span>
                  </button>
                  {renderDropdown(item.children, key)}
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