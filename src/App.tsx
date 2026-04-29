import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Pause,
  Play,
  Plus,
  Search,
  Twitter,
  Youtube,
} from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-stretch h-[96px] bg-gradient-to-b from-black/80 via-black/40 to-transparent">
      {/* Logo Area */}
      <div className="bg-kiewit-yellow md:w-[280px] w-48 flex items-center justify-center shrink-0">
        <div className="text-black font-bold md:text-3xl text-2xl tracking-tighter flex items-center">
          <div className="w-9 h-9 border-2 border-black rounded-full flex flex-col items-center justify-center mr-2 text-[9px] leading-none font-bold">
            <span>VC</span>
            <span className="text-[5px]">GTA</span>
          </div>
          Vitalite
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 hidden lg:flex items-center px-8 justify-between">
        <div className="flex items-center space-x-8 text-[13px] font-semibold tracking-[0.1em] uppercase text-white/90">
          <a href="#" className="flex items-center hover:text-kiewit-yellow transition-colors group">WHO WE ARE <ChevronRight className="w-4 h-4 ml-1 rotate-90 text-white/50 group-hover:text-kiewit-yellow transition-colors" /></a>
          <a href="#" className="flex items-center hover:text-kiewit-yellow transition-colors group">WHAT WE DO <ChevronRight className="w-4 h-4 ml-1 rotate-90 text-white/50 group-hover:text-kiewit-yellow transition-colors" /></a>
          <a href="#" className="flex items-center hover:text-kiewit-yellow transition-colors group">SERVICES <ChevronRight className="w-4 h-4 ml-1 rotate-90 text-white/50 group-hover:text-kiewit-yellow transition-colors" /></a>
          <a href="#" className="hover:text-kiewit-yellow transition-colors group">PROJECTS</a>
          <a href="#" className="flex items-center hover:text-kiewit-yellow transition-colors group">PROCESS <ChevronRight className="w-4 h-4 ml-1 rotate-90 text-white/50 group-hover:text-kiewit-yellow transition-colors" /></a>
          <a href="#" className="flex items-center hover:text-kiewit-yellow transition-colors group">CONNECT <ChevronRight className="w-4 h-4 ml-1 rotate-90 text-white/50 group-hover:text-kiewit-yellow transition-colors" /></a>
        </div>

        <div className="flex items-center space-x-6 text-white/90">
          <div className="flex items-center text-[13px] font-semibold tracking-[0.1em] border-r border-white/30 pr-6 uppercase cursor-pointer hover:text-kiewit-yellow transition-colors group">
            EN <ChevronRight className="w-4 h-4 ml-1 rotate-90 text-kiewit-yellow group-hover:text-kiewit-yellow transition-colors" />
          </div>
          <button className="hover:text-kiewit-yellow transition-colors">
            <Search className="w-5 h-5 text-kiewit-yellow" />
          </button>
        </div>
      </div>
    </nav>
  );
};

const heroSlides = [
  {
    category: 'DESIGN-BUILD',
    title: 'GTA Design-Build Contractor',
    desc: 'Vitalite Construction Corp. delivers one-stop design-build, permitting, construction management and warranty support for homeowners, investors and commercial clients.',
    link: 'Explore Vitalite services',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop',
  },
  {
    category: 'CUSTOM HOMES',
    title: 'Luxury Custom Homes, Built Around Your Vision',
    desc: 'From concept and drawings to budget planning, construction and final delivery, we build bespoke residences with disciplined project control and craftsmanship.',
    link: 'Custom home design & build',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
  },
  {
    category: 'MULTI-UNIT HOUSING',
    title: 'Multiplex, Garden Suite and Laneway House Delivery',
    desc: 'We help property owners increase land use, rental potential and long-term value through compliant multi-unit residential and secondary dwelling projects.',
    link: 'Residential investment projects',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop',
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="relative h-screen min-h-[600px] w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={heroSlides[currentSlide].image} alt="Vitalite project" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none"></div>

      <div className="relative h-full flex items-center px-8 md:px-24">
        <div className="max-w-4xl text-white">
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="inline-block border-b border-white pb-1 mb-6 text-[11px] font-bold tracking-[0.2em] uppercase">
              {heroSlides[currentSlide].category}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-white drop-shadow-md">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">
              {heroSlides[currentSlide].desc}
            </p>
            <a href="#" className="group inline-flex items-center text-xl font-medium hover:text-gray-300 transition-colors">
              {heroSlides[currentSlide].link}
              <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows for Hero */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Hero Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-2">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-kiewit-yellow' : 'w-1.5 bg-white/50 hover:bg-white'}`}
          />
        ))}
      </div>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="absolute bottom-10 right-10 w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        {isPaused ? <Play className="w-4 h-4 text-white" fill="white" /> : <Pause className="w-4 h-4 text-white" fill="white" />}
      </button>
    </div>
  );
};

const SectionHeading = ({ title, className = '' }: { title: string; className?: string }) => (
  <div className={`mb-10 ${className}`}>
    <div className="w-16 h-1 bg-kiewit-yellow mb-6"></div>
    <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white">
      {title}
    </h2>
  </div>
);

const fadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const IntegratedSolutions = () => {
  return (
    <section className="bg-kiewit-dark py-24 md:py-32 px-8 md:px-24">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        variants={fadeInVariants}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        <div>
          <SectionHeading title="One-Stop Design-Build & Construction Management in the GTA" />
          <p className="text-lg text-gray-300 leading-relaxed max-w-xl mb-12">
            Vitalite Construction Corp. is a GTA-based design-build, construction management and general contracting company specializing in custom homes, multi-unit residential projects, major additions, garden suites, laneway houses, ICI construction, permits, drawings and engineering coordination.
          </p>
          <a href="#" className="group inline-flex items-center text-xl font-medium text-white hover:text-gray-300 transition-colors">
            Explore solutions <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <div className="relative h-[600px] hidden lg:block">
          <img src="https://images.unsplash.com/photo-1503387837-b154d5074bd2?q=80&w=800&auto=format&fit=crop" alt="Construction planning" className="absolute top-4 right-0 w-[45%] h-[200px] object-cover rounded-2xl z-0 shadow-xl" />
          <img src="https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=1200&auto=format&fit=crop" alt="Custom home exterior" className="absolute left-0 top-1/2 -translate-y-1/2 w-[75%] h-[420px] object-cover rounded-2xl z-10 shadow-2xl" />
          <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop" alt="Project management meeting" className="absolute bottom-4 right-8 w-[40%] h-[220px] object-cover rounded-2xl z-20 shadow-xl" />
        </div>
      </motion.div>
    </section>
  );
};

const Stats = () => {
  const stats = [
    { value: 'GTA', label: 'Local zoning, permit and building code experience' },
    { value: '7', label: 'Core residential, management and ICI service lines' },
    { value: 'A-Z', label: 'Consultation, drawings, permits, construction and warranty' },
    { value: 'PM', label: 'Schedule, budget, trade, inspection and quality control' },
  ];

  return (
    <section className="bg-kiewit-blue py-32 px-8">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-medium text-center text-white mb-20 tracking-tight">
          Integrated Delivery. Clear Accountability.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
            >
              <div className="text-6xl md:text-7xl font-bold text-transparent mb-6 tracking-tighter" style={{ WebkitTextStroke: '2px var(--color-kiewit-yellow)' }}>
                {stat.value}
              </div>
              <div className="text-lg md:text-xl text-white font-medium max-w-[220px] mx-auto leading-tight">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const expertiseItems = [
  {
    tab: 'Custom Homes',
    title: 'Custom Home Design & Build',
    desc: 'We design and build luxury custom homes tailored to each client\'s lifestyle, vision and long-term property value, with attention to planning, materials, craftsmanship and delivery control.',
    link: 'Custom home approach',
    image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?q=80&w=2070&auto=format&fit=crop',
  },
  {
    tab: 'Multiplex Housing',
    title: 'Multi-Unit & Multiplex Residential Construction',
    desc: 'We help property owners and investors maximize land use and rental potential through compliant, efficient and well-managed multi-unit residential projects.',
    link: 'Multiplex construction',
    image: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?q=80&w=2070&auto=format&fit=crop',
  },
  {
    tab: 'Garden Suites',
    title: 'Garden Suites, Laneway Houses & Coach Houses',
    desc: 'We design, permit and build secondary dwelling units that add flexible living space, rental income potential and long-term property value.',
    link: 'Secondary dwelling units',
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=2070&auto=format&fit=crop',
  },
  {
    tab: 'Additions',
    title: 'Home Additions & Major Renovations',
    desc: 'We provide home additions, structural alterations and large-scale renovations that expand living space while maintaining design continuity and structural integrity.',
    link: 'Addition and renovation work',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop',
  },
  {
    tab: 'Permits & Engineering',
    title: 'Drawings, Permits & Engineering Coordination',
    desc: 'We prepare architectural and structural drawings, coordinate engineering documentation and manage permit applications to keep projects compliant and moving forward.',
    link: 'Permit-ready documentation',
    image: 'https://images.unsplash.com/photo-1503387837-b154d5074bd2?q=80&w=2070&auto=format&fit=crop',
  },
  {
    tab: 'Project Management',
    title: 'Project Management & Construction Management',
    desc: 'We manage schedules, budgets, trades, quality control, inspections and communication so complex projects are delivered efficiently and professionally.',
    link: 'Construction management',
    image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=2070&auto=format&fit=crop',
  },
  {
    tab: 'ICI Construction',
    title: 'Industrial, Commercial & Institutional Construction',
    desc: 'We provide design and construction services for warehouses, offices, retail spaces and institutional facilities with a focus on durability, compliance and cost efficiency.',
    link: 'ICI construction services',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
  },
];

const Expertise = () => {
  const [activeTab, setActiveTab] = useState(expertiseItems[0].tab);
  const activeExpertise = expertiseItems.find((item) => item.tab === activeTab) ?? expertiseItems[0];

  return (
    <section className="bg-kiewit-dark py-24 md:py-32 px-8 md:px-24">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-7xl mx-auto"
      >
        <SectionHeading title="End-to-End Expertise. One Accountable Team." />
        <p className="text-lg text-gray-300 leading-relaxed max-w-4xl mb-12">
          Vitalite is not only a builder and not only a design office. We coordinate design, zoning review, engineering, permit applications, construction, inspections and closeout under one managed delivery process.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-16">
          {expertiseItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`px-6 py-2.5 rounded-full text-[15px] font-medium transition-colors border ${
                activeTab === item.tab
                  ? 'bg-kiewit-yellow border-kiewit-yellow text-black'
                  : 'bg-transparent border-gray-600 text-white hover:border-white'
              }`}
            >
              {item.tab}
            </button>
          ))}
          <button className="p-2 ml-4 hover:bg-white/10 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeExpertise.tab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl overflow-hidden h-[500px]"
            >
              <img src={activeExpertise.image} alt={activeExpertise.title} className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>
          <div>
            <h3 className="text-3xl font-medium mb-6">{activeExpertise.title}</h3>
            <p className="text-lg text-gray-300 leading-relaxed mb-10">
              {activeExpertise.desc}
            </p>
            <a href="#" className="group inline-flex items-center text-xl font-medium text-white hover:text-gray-300 transition-colors">
              {activeExpertise.link} <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Markets = () => {
  const markets = [
    {
      name: 'Custom Homes',
      summary: 'Luxury custom homes, bespoke residences, rebuilds and owner-focused design-build delivery.',
      img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2070&auto=format&fit=crop',
    },
    {
      name: 'Multi-Unit / Multiplex',
      summary: 'Multiplex housing, separate suites and investment residential planning for stronger land use.',
      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop',
    },
    {
      name: 'Garden Suite / Laneway House',
      summary: 'Secondary dwelling units that support family flexibility, rental income and property value.',
      img: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=2070&auto=format&fit=crop',
    },
    {
      name: 'Home Additions & Alterations',
      summary: 'Additions, extensions, structural changes, major renovations and whole-house transformations.',
      img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1931&auto=format&fit=crop',
    },
    {
      name: 'Drawings, Permits & Engineering',
      summary: 'Architectural drawings, structural coordination, HVAC, zoning review and permit applications.',
      img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop',
    },
    {
      name: 'Project / Construction Management',
      summary: 'Budget, schedule, trades, quality control, site meetings, inspections and client communication.',
      img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2074&auto=format&fit=crop',
    },
    {
      name: 'ICI Construction',
      summary: 'Warehouse, office, retail, industrial and institutional projects built for compliance and durability.',
      img: 'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=2070&auto=format&fit=crop',
    },
  ];

  return (
    <section className="bg-white text-black py-24 md:py-32 px-8 md:px-24">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-[1400px] mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-3xl">
            <div className="w-16 h-1 bg-kiewit-yellow mb-6"></div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-8">
              Our Services
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed font-light">
              Vitalite serves GTA homeowners, investors, developers and commercial clients with design-build general contracting and construction management across custom homes, multiplex housing, additions, secondary dwelling units, permit-ready drawings and ICI projects.
            </p>
          </div>
          <div className="flex space-x-4 shrink-0">
            <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-6 h-6 text-black" />
            </button>
            <button className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {markets.map((market, i) => (
            <div key={i} className="min-w-[300px] md:min-w-[340px] h-[480px] rounded-2xl overflow-hidden relative group cursor-pointer snap-start shrink-0">
              <img src={market.img} alt={market.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <h3 className="text-2xl font-bold text-white mb-3">{market.name}</h3>
                <p className="text-sm text-gray-200 leading-relaxed mb-5">{market.summary}</p>
                <div className="flex items-center text-[15px] font-medium text-white group-hover:text-gray-300 transition-colors">
                  Read more <ChevronRight className="w-5 h-5 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const ProjectProcess = () => {
  const cards = [
    {
      title: 'Consult & Evaluate',
      detail: 'Initial consultation, project goals, budget direction, site measurement and existing-condition review.',
      img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop',
    },
    {
      title: 'Design, Price & Contract',
      detail: 'Concept design, 2D or 3D planning, budgetary quotation and the right contracting model for the project.',
      img: 'https://images.unsplash.com/photo-1503387837-b154d5074bd2?q=80&w=2070&auto=format&fit=crop',
    },
    {
      title: 'Review, Engineer & Permit',
      detail: 'Zoning review, building code review, structural, HVAC and mechanical coordination, then permit submission.',
      img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop',
    },
    {
      title: 'Build, Inspect & Support',
      detail: 'Pre-construction preparation, site management, quality control, PDI, move-in support and aftercare warranty.',
      img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop',
    },
  ];

  return (
    <section className="relative py-24 md:py-32 px-8 overflow-hidden bg-[#111]">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop" alt="Construction site" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent"></div>
      </div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-[1400px] mx-auto relative z-10"
      >
        <SectionHeading title="From Consultation to Warranty" />
        <p className="text-lg text-gray-300 leading-relaxed max-w-4xl mb-12">
          Our process moves projects from early feasibility through design, zoning, building permits, pre-construction, construction, pre-delivery inspection and aftercare. The result is a managed path from idea to occupancy.
        </p>
        <a href="#" className="group inline-flex items-center text-xl font-medium text-white hover:text-gray-300 mb-16 transition-colors">
          How Vitalite works <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div key={i} className="h-[360px] rounded-2xl overflow-hidden relative group cursor-pointer">
              <img src={card.img} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end gap-4">
                <div className="max-w-[82%]">
                  <h3 className="text-[22px] font-bold text-white leading-tight mb-3">{card.title}</h3>
                  <p className="text-sm text-gray-200 leading-relaxed">{card.detail}</p>
                </div>
                <Plus className="w-6 h-6 text-white shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="w-full">
      <div className="bg-black py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="border-2 border-white px-4 py-2 text-white font-bold text-xl tracking-widest whitespace-nowrap">
            GTA DESIGN-BUILD
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-10 gap-y-4 text-white text-[15px]">
            <a href="#" className="hover:text-kiewit-yellow transition-colors">Services</a>
            <a href="#" className="hover:text-kiewit-yellow transition-colors">Custom Homes</a>
            <a href="#" className="hover:text-kiewit-yellow transition-colors">Multiplex</a>
            <a href="#" className="hover:text-kiewit-yellow transition-colors">Permits</a>
            <a href="#" className="hover:text-kiewit-yellow transition-colors">Process</a>
            <a href="#" className="hover:text-kiewit-yellow transition-colors">Contact</a>
          </div>
        </div>
      </div>
      <div className="bg-kiewit-yellow py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-start gap-12">
          <div className="flex space-x-4">
            {[{ Icon: Facebook, id: 'fb' }, { Icon: Twitter, id: 'x' }, { Icon: Instagram, id: 'ig' }, { Icon: Youtube, id: 'yt' }, { Icon: Linkedin, id: 'li' }].map(({ Icon, id }) => (
              <div key={id} className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-kiewit-yellow hover:scale-110 transition-transform cursor-pointer">
                <Icon className="w-5 h-5" fill="currentColor" strokeWidth={0} />
              </div>
            ))}
          </div>
          <div className="text-black text-sm">
            <p className="font-bold mb-2">(c) 2026 Vitalite Construction Corp. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 text-black underline underline-offset-2">
              <a href="#">Privacy Statement</a>
              <span className="no-underline">|</span>
              <a href="#">Terms and Conditions</a>
              <span className="no-underline">|</span>
              <a href="#">Accessibility</a>
              <span className="no-underline">|</span>
              <a href="#">Cookies Settings</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="font-sans antialiased text-white bg-kiewit-dark">
      <Navbar />
      <Hero />
      <IntegratedSolutions />
      <Stats />
      <Expertise />
      <Markets />
      <ProjectProcess />
      <Footer />
    </div>
  );
}
