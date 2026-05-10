import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Printer } from 'lucide-react';
import { getRouteHref } from './seo';
import { trackToolEvent } from './analytics';

// ─── Utilities ───────────────────────────────────────────────────────────────

const publicAsset = (f: string) => `${import.meta.env.BASE_URL}${f.replace(/^\/+/, '')}`;
const v = (f: string) => publicAsset(`seo-placeholders/${f}.webp`);

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fmt = (n: number): string => {
  const r = Math.round(n / 5000) * 5000;
  if (r >= 1_000_000) return `$${(r / 1_000_000).toFixed(1)}M`;
  return `$${(r / 1000).toFixed(0)}k`;
};

// ─── Shared Components ────────────────────────────────────────────────────────

const ToolHero = ({
  eyebrow,
  title,
  subtitle,
  image,
  toolId,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  toolId?: string;
}) => (
  <div className="relative h-[62vh] min-h-[500px] bg-kiewit-dark overflow-hidden">
    <img
      src={image}
      alt={title}
      loading="eager"
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover opacity-50"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
    <div className="relative h-full flex items-center px-5 sm:px-8 md:px-24 pt-20">
      <div className="max-w-4xl text-white">
        <div className="inline-block border-b border-kiewit-yellow pb-1 mb-5 text-[11px] font-bold tracking-[0.2em] uppercase text-kiewit-yellow">
          {eyebrow}
        </div>
        <h1 className="text-[2.35rem] sm:text-5xl md:text-7xl font-bold mb-5 leading-[1.08] tracking-tight drop-shadow-md">
          {title}
        </h1>
        <p className="text-base sm:text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">{subtitle}</p>
        <a
          href={getRouteHref('contact-us')}
          onClick={() => {
            if (toolId) {
              trackToolEvent('tool_cta_clicked', {
                tool_id: toolId,
                destination: getRouteHref('contact-us'),
              });
            }
          }}
          className="group inline-flex items-center text-lg sm:text-xl font-medium hover:text-gray-300 transition-colors"
        >
          Get an accurate quote
          <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  </div>
);

const THeading = ({ title, dark = false }: { title: string; dark?: boolean }) => (
  <div className="mb-10">
    <div className="w-16 h-1 bg-kiewit-yellow mb-6" />
    <h2
      className={`text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight ${dark ? 'text-black' : 'text-white'}`}
    >
      {title}
    </h2>
  </div>
);

const OptionGroup = ({
  label,
  options,
  value,
  onChange,
  toolId,
  control,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
  toolId?: string;
  control?: string;
}) => (
  <div className="mb-7">
    <div className="text-sm font-bold tracking-[0.12em] uppercase text-gray-500 mb-3">{label}</div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            onChange(opt.value);
            if (toolId && control) {
              trackToolEvent('tool_input_changed', {
                tool_id: toolId,
                control,
                value: opt.value,
              });
            }
          }}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
            value === opt.value
              ? 'bg-kiewit-dark text-white border-kiewit-yellow'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const SliderInput = ({
  label,
  value,
  min,
  max,
  step,
  fmtFn,
  onChange,
  toolId,
  control,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmtFn: (v: number) => string;
  onChange: (v: number) => void;
  toolId?: string;
  control?: string;
}) => (
  <div className="mb-7">
    <div className="flex justify-between items-baseline mb-3">
      <div className="text-sm font-bold tracking-[0.12em] uppercase text-gray-500">{label}</div>
      <div className="text-xl font-bold text-kiewit-dark">{fmtFn(value)}</div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={() => {
        if (toolId && control) {
          trackToolEvent('tool_input_changed', { tool_id: toolId, control, value });
        }
      }}
      onBlur={() => {
        if (toolId && control) {
          trackToolEvent('tool_input_changed', { tool_id: toolId, control, value });
        }
      }}
      className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-kiewit-yellow [&::-webkit-slider-thumb]:cursor-pointer"
    />
    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
      <span>{fmtFn(min)}</span>
      <span>{fmtFn(max)}</span>
    </div>
  </div>
);

const CostResult = ({ low, mid, high }: { low: number; mid: number; high: number }) => (
  <div className="border-l-4 border-kiewit-yellow bg-gray-50 p-6 sm:p-8 rounded-r-2xl">
    <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-4">
      Estimated Cost Range
    </div>
    <div className="grid grid-cols-3 gap-4 mb-5">
      {(
        [
          ['Conservative', low],
          ['Mid-Range', mid],
          ['Higher-End', high],
        ] as const
      ).map(([label, val]) => (
        <div key={label}>
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className="text-xl sm:text-2xl font-bold text-kiewit-dark">{fmt(val)}</div>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 leading-relaxed">
      Estimates are based on current GTA market rates. Final costs depend on site conditions, structural
      requirements, material selection and permit scope.
    </p>
  </div>
);

const ToolCta = ({ message, toolId }: { message: string; toolId?: string }) => (
  <section className="bg-kiewit-dark py-16 md:py-20 px-5 sm:px-8 md:px-24 text-center">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="max-w-3xl mx-auto"
    >
      <p className="text-lg sm:text-xl text-gray-300 mb-8">{message}</p>
      <a
        href={getRouteHref('contact-us')}
        onClick={() => {
          if (toolId) {
            trackToolEvent('tool_cta_clicked', {
              tool_id: toolId,
              destination: getRouteHref('contact-us'),
            });
          }
        }}
        className="inline-flex items-center bg-kiewit-yellow text-black font-bold tracking-[0.08em] uppercase px-8 py-4 rounded-lg hover:bg-white transition-colors"
      >
        Start a project review
        <ChevronRight className="w-5 h-5 ml-2" />
      </a>
    </motion.div>
  </section>
);

const ToolFaq = ({ items }: { items: Array<{ q: string; a: string }> }) => (
  <section className="bg-white text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="max-w-5xl mx-auto"
    >
      <THeading title="Frequently Asked Questions" dark />
      <div className="divide-y divide-gray-200 border-y border-gray-200">
        {items.map((item) => (
          <article key={item.q} className="py-7">
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-3">{item.q}</h2>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{item.a}</p>
          </article>
        ))}
      </div>
    </motion.div>
  </section>
);

// ─── Calculator 1: Home Addition Cost Estimator ───────────────────────────────

const ToolGeoEvidence = ({
  answer,
  facts,
  steps,
  caveat,
}: {
  answer: string;
  facts: string[];
  steps: string[];
  caveat: string;
}) => (
  <section className="bg-gray-50 text-black py-16 md:py-24 px-5 sm:px-8 md:px-24">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="max-w-6xl mx-auto"
    >
      <div className="max-w-4xl mb-10">
        <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-4">
          Planning evidence
        </div>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-5">How to use this tool</h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{answer}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <article className="border border-gray-200 bg-white rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Key Facts</h3>
          <ul className="space-y-3 text-base text-gray-700 leading-relaxed">
            {facts.map((fact) => (
              <li key={fact} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-kiewit-yellow" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="border border-gray-200 bg-white rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Planning Steps</h3>
          <ol className="space-y-3 text-base text-gray-700 leading-relaxed">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="font-bold text-kiewit-yellow">{String(index + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </article>
        <article className="border border-gray-200 bg-white rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Boundary</h3>
          <p className="text-base text-gray-700 leading-relaxed">{caveat}</p>
        </article>
      </div>
    </motion.div>
  </section>
);

const ToolCitationAsset = ({
  title,
  assumptions,
  sourceNote,
  relatedLinks,
}: {
  title: string;
  assumptions: string[];
  sourceNote: string;
  relatedLinks: Array<{ label: string; key: string }>;
}) => (
  <section className="bg-gray-50 text-black py-16 md:py-24 px-5 sm:px-8 md:px-24">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="max-w-6xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div className="max-w-3xl">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-4">
            Citation asset
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-4">{title}</h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{sourceNote}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-black hover:border-kiewit-yellow transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print planning brief
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6">
        <article className="border border-gray-200 bg-white rounded-lg p-6 sm:p-8">
          <h3 className="text-xl font-semibold mb-5">Assumptions to cite with the result</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base text-gray-700 leading-relaxed">
            {assumptions.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-kiewit-yellow" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="border border-gray-200 bg-white rounded-lg p-6 sm:p-8">
          <h3 className="text-xl font-semibold mb-5">Next evidence path</h3>
          <div className="space-y-3">
            {relatedLinks.map((link) => (
              <a
                key={link.key}
                href={getRouteHref(link.key)}
                className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 text-sm font-semibold text-gray-800 hover:text-kiewit-blue transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-kiewit-yellow" />
              </a>
            ))}
          </div>
        </article>
      </div>
    </motion.div>
  </section>
);

const additionTypeOptions: Array<{ label: string; value: string }> = [
  { label: 'Main floor extension', value: 'main-floor' },
  { label: 'Second-storey addition', value: 'second-storey' },
  { label: 'Above-garage suite', value: 'garage-above' },
];

const finishOptions: Array<{ label: string; value: string }> = [
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
  { label: 'Luxury', value: 'luxury' },
];

const additionLocationOptions: Array<{ label: string; value: string }> = [
  { label: 'Toronto (City proper)', value: 'toronto' },
  { label: 'North York / Etobicoke / Scarborough', value: 'north-york' },
  { label: 'Markham / York Region', value: 'markham' },
  { label: 'Mississauga', value: 'mississauga' },
  { label: 'Other GTA', value: 'other' },
];

const additionBaseRates: Record<string, number> = {
  'main-floor': 290,
  'second-storey': 330,
  'garage-above': 360,
};
const finishMult: Record<string, number> = { standard: 1.0, premium: 1.28, luxury: 1.65 };
const additionLocationMult: Record<string, number> = {
  toronto: 1.15,
  'north-york': 1.1,
  markham: 1.0,
  mississauga: 1.05,
  other: 1.0,
};

export const AdditionCostCalculator = () => {
  const toolId = 'addition_cost';
  const [addType, setAddType] = useState('main-floor');
  const [sqft, setSqft] = useState(500);
  const [finish, setFinish] = useState('premium');
  const [location, setLocation] = useState('toronto');

  const mid = sqft * additionBaseRates[addType] * finishMult[finish] * additionLocationMult[location];
  const low = mid * 0.83;
  const high = mid * 1.24;

  return (
    <>
      <ToolHero
        eyebrow="FREE TOOL · GTA CONSTRUCTION"
        title="Home Addition Cost Estimator"
        subtitle="Get a planning-level cost range for a GTA home addition before committing to drawings or contractor pricing."
        image={v('home-addition')}
        toolId={toolId}
      />
      <ToolGeoEvidence
        answer="The home addition estimator is a planning tool for early feasibility. It helps owners compare addition type, size, finish level and GTA location before drawings, structural review and permit comments turn the range into project-specific pricing."
        facts={[
          'Addition cost is affected by foundation work, structural tie-ins, roofline matching, mechanical extensions, permit drawings and finish level.',
          'A second-storey addition usually carries more structural risk than a main-floor extension because the existing foundation and walls must be reviewed first.',
          'The estimate is most useful when paired with a survey, photos, current floor plans and a clear description of the rooms being added.',
        ]}
        steps={[
          'Choose the closest addition type',
          'Set the approximate new square footage',
          'Select finish level and GTA location',
          'Use the range for feasibility, not a fixed quote',
          'Confirm zoning, structure, drawings and permit path with Vitalite',
        ]}
        caveat="The calculator cannot see hidden structure, soil conditions, drainage, utility capacity, municipal comments or finish selections. Treat the result as a planning range until the property is reviewed."
      />

      <section className="bg-white text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto"
        >
          <THeading title="Estimate Your Addition Cost" dark />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <OptionGroup
                label="Addition Type"
                options={additionTypeOptions}
                value={addType}
                onChange={setAddType}
                toolId={toolId}
                control="addition_type"
              />
              <SliderInput
                label="Addition Size"
                value={sqft}
                min={100}
                max={1500}
                step={50}
                fmtFn={(n) => `${n.toLocaleString('en-CA')} sqft`}
                onChange={setSqft}
                toolId={toolId}
                control="square_footage"
              />
              <OptionGroup label="Finish Level" options={finishOptions} value={finish} onChange={setFinish} toolId={toolId} control="finish_level" />
              <OptionGroup
                label="Location"
                options={additionLocationOptions}
                value={location}
                onChange={setLocation}
                toolId={toolId}
                control="location"
              />
            </div>

            <div className="sticky top-28 space-y-6">
              <CostResult low={low} mid={mid} high={high} />
              <div className="bg-kiewit-dark rounded-2xl p-6 text-white">
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-kiewit-yellow mb-3">
                  What Drives Addition Costs
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  {[
                    'Foundation type and excavation scope',
                    'Structural connection to the existing building',
                    'Matching exterior cladding and roofline',
                    'Mechanical, electrical and plumbing extensions',
                    'Permit drawings and engineering coordination',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-kiewit-yellow shrink-0 mt-1.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <ToolCitationAsset
        title="Addition Cost Planning Brief"
        sourceNote="Cite this tool only with the selected addition type, square footage, finish level and GTA location. The range is useful for early feasibility and should be paired with zoning, structural and permit evidence before a budget is treated as final."
        assumptions={[
          'The result assumes a permitted residential addition, not cosmetic renovation only.',
          'Existing foundation and framing have not been inspected by the calculator.',
          'Drawings, engineering, municipal comments and finish selections can change the range.',
          'Temporary protection, owner occupancy and site access are not priced automatically.',
        ]}
        relatedLinks={[
          { label: 'Home additions service', key: 'service-home-additions' },
          { label: 'Home addition permit guide', key: 'guide-home-addition-permit-toronto' },
          { label: 'Erindale vertical addition proof', key: 'project-erindale-mississauga-side-split-addition' },
          { label: 'Project review intake', key: 'contact-us' },
        ]}
      />

      <ToolFaq
        items={[
          {
            q: 'How accurate is this estimate?',
            a: 'This calculator gives a planning-level range useful for early budgeting and feasibility conversations. It accounts for addition type, size, finish level and Toronto-area location premiums. Site conditions, structural complications, permit scope and material selection will affect the final number. For a project-specific cost, Vitalite reviews the property, scope and existing conditions before quoting.',
          },
          {
            q: 'What is included in a GTA home addition cost?',
            a: 'A complete addition includes permit drawings and engineering, foundation work, framing, roofing, exterior cladding, windows and doors, insulation, drywall, flooring, trim, mechanical extensions (plumbing, HVAC, electrical), and all applicable permits. The estimate above covers all of this at the finish level you selected.',
          },
          {
            q: 'How long does a home addition take in the GTA?',
            a: 'From design start to occupancy, a GTA home addition typically takes 12–22 months: design and drawings (2–4 months), permit processing (3–6 months) and construction (4–10 months depending on size). Adding a second storey takes longer than a main-floor extension due to structural complexity.',
          },
        ]}
      />
      <ToolCta toolId={toolId} message="This estimate is useful for feasibility planning. Contact Vitalite to discuss your property, confirm zoning and get a project-specific cost review." />
    </>
  );
};

// ─── Calculator 2: Laneway & Garden Suite Cost Calculator ─────────────────────

const suiteTypeOptions: Array<{ label: string; value: string }> = [
  { label: 'Detached laneway house', value: 'laneway' },
  { label: 'Garden suite (rear yard)', value: 'garden' },
];

const storeyOptions: Array<{ label: string; value: string }> = [
  { label: 'One storey', value: 'one' },
  { label: 'Two storeys', value: 'two' },
];

const suiteBaseRates: Record<string, number> = { laneway: 390, garden: 355 };
const storeyPremium: Record<string, number> = { one: 0, two: 22 };

export const LanewayCostCalculator = () => {
  const toolId = 'laneway_garden_suite_cost';
  const [suiteType, setSuiteType] = useState('laneway');
  const [sqft, setSqft] = useState(650);
  const [storeys, setStoreys] = useState('two');
  const [finish, setFinish] = useState('premium');

  const mid = sqft * (suiteBaseRates[suiteType] + storeyPremium[storeys]) * finishMult[finish];
  const low = mid * 0.85;
  const high = mid * 1.22;

  return (
    <>
      <ToolHero
        eyebrow="FREE TOOL · TORONTO HOUSING"
        title="Laneway Suite & Garden Suite Cost Calculator"
        subtitle="Estimate what it costs to build a detached laneway house or garden suite in Toronto and the GTA."
        image={v('garden-suite')}
        toolId={toolId}
      />
      <ToolGeoEvidence
        answer="The laneway and garden suite calculator estimates a detached secondary dwelling cost range, but feasibility starts with the lot. Access, rear-yard depth, servicing, fire route requirements, tree protection and permit review decide whether the suite is buildable before finish choices matter."
        facts={[
          'Laneway houses require public lane access; garden suites rely on rear-yard feasibility and a compliant access route.',
          'Typical cost drivers include structure, utilities, servicing trench length, grading, exterior envelope, finishes and construction access.',
          'Toronto lots should be screened for setbacks, tree protection, TRCA or ravine overlays and servicing capacity before design fees are committed.',
        ]}
        steps={[
          'Confirm lane or rear-yard access',
          'Estimate suite size and storey count',
          'Review servicing, trees, grading and setbacks',
          'Use the calculator range for rental and financing planning',
          'Complete a property-specific feasibility review',
        ]}
        caveat="A low calculator range can still fail if the lot cannot meet access, servicing, tree or setback conditions. The first decision is feasibility, not finishes."
      />

      <section className="bg-white text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto"
        >
          <THeading title="Estimate Your Suite Cost" dark />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <OptionGroup
                label="Suite Type"
                options={suiteTypeOptions}
                value={suiteType}
                onChange={setSuiteType}
                toolId={toolId}
                control="suite_type"
              />
              <SliderInput
                label="Gross Floor Area"
                value={sqft}
                min={300}
                max={1200}
                step={50}
                fmtFn={(n) => `${n} sqft`}
                onChange={setSqft}
                toolId={toolId}
                control="square_footage"
              />
              <OptionGroup
                label="Number of Storeys"
                options={storeyOptions}
                value={storeys}
                onChange={setStoreys}
                toolId={toolId}
                control="storeys"
              />
              <OptionGroup label="Finish Level" options={finishOptions} value={finish} onChange={setFinish} toolId={toolId} control="finish_level" />
            </div>

            <div className="sticky top-28 space-y-6">
              <CostResult low={low} mid={mid} high={high} />
              <div className="bg-kiewit-dark rounded-2xl p-6 text-white">
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-kiewit-yellow mb-3">
                  Toronto Permit Context
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  {[
                    'Laneway houses require rear lane access — confirm before designing',
                    'Garden suites need approx. 30m lot depth to meet setbacks',
                    'Both require building permits, drawings and utility connections',
                    'Zoning approval is as-of-right in most Toronto residential zones',
                    'Construction typically takes 4–7 months after permit issuance',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-kiewit-yellow shrink-0 mt-1.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <ToolCitationAsset
        title="Laneway And Garden Suite Planning Brief"
        sourceNote="Cite this result with lot access, suite type, gross floor area, storey count and finish level. The calculator supports rental and financing planning, but feasibility still depends on the property."
        assumptions={[
          'Laneway suites require lane access; garden suites require rear-yard feasibility and compliant access.',
          'Servicing, grading, tree protection, fire access and utility connections can move the range.',
          'The result does not confirm TRCA, ravine, heritage or municipal overlay constraints.',
          'Permit drawings and engineering are required before construction pricing is reliable.',
        ]}
        relatedLinks={[
          { label: 'Garden suite service', key: 'service-garden-suites' },
          { label: 'Garden suite cost guide', key: 'guide-garden-suite-cost-toronto' },
          { label: 'Toronto laneway project proof', key: 'project-toronto-laneway-suite-over-garage' },
          { label: 'Project review intake', key: 'contact-us' },
        ]}
      />

      <ToolFaq
        items={[
          {
            q: 'What is the difference between a laneway house and a garden suite?',
            a: 'A laneway house is built on a property with rear lane (public alley) access — the suite faces and is accessed from the lane. A garden suite sits in the rear yard of a property without lane access. Both are now permitted as-of-right across most Toronto residential zones. Laneway houses typically benefit from easier construction access and clear visual separation from the main house.',
          },
          {
            q: 'Can I rent out a laneway suite or garden suite?',
            a: 'Yes. Both are legal dwelling units under Toronto zoning and can be rented as separate residential units. The unit requires its own mailing address, utility connections and separate entrance. Rental income of $2,500–$3,800 per month is realistic for well-located 600–800 sqft suites in 2026, depending on neighbourhood and finish level.',
          },
          {
            q: 'What does the permit process involve for a Toronto laneway suite?',
            a: 'Building permits require architectural drawings and structural engineering stamped by a professional engineer. Depending on the property, utility service connections (water, sanitary, gas, electrical) may need upgrades. The City of Toronto currently processes laneway and garden suite permits in 8–16 weeks. A zoning compliance check before committing to design fees is always recommended.',
          },
        ]}
      />
      <ToolCta toolId={toolId} message="Confirm lot feasibility before committing to drawings. Vitalite reviews lane access, lot depth, tree conditions and utility connections at the first site visit." />
    </>
  );
};

// ─── Calculator 3: Teardown vs. Renovation Decision Tool ─────────────────────

type TeardownQuestion = {
  id: string;
  question: string;
  options: Array<{ label: string; value: number }>;
};

const teardownQuestions: TeardownQuestion[] = [
  {
    id: 'age',
    question: 'How old is the home?',
    options: [
      { label: 'Under 30 years', value: 1 },
      { label: '30–60 years', value: 2 },
      { label: '60–80 years', value: 3 },
      { label: '80+ years', value: 4 },
    ],
  },
  {
    id: 'basement',
    question: 'Current basement ceiling height?',
    options: [
      { label: '8 ft or higher', value: 1 },
      { label: '7–8 ft', value: 2 },
      { label: '6.5–7 ft', value: 3 },
      { label: 'Under 6.5 ft', value: 4 },
    ],
  },
  {
    id: 'structure',
    question: 'Current structural condition?',
    options: [
      { label: 'Good — minor cosmetic issues', value: 1 },
      { label: 'Some concerns — aging systems', value: 2 },
      { label: 'Significant issues — past water or settlement', value: 3 },
      { label: 'Major structural problems', value: 4 },
    ],
  },
  {
    id: 'scope',
    question: 'How much of the home do you want to change?',
    options: [
      { label: 'Less than 25%', value: 1 },
      { label: '25–50%', value: 2 },
      { label: '50–75%', value: 3 },
      { label: 'More than 75%', value: 4 },
    ],
  },
  {
    id: 'sqft',
    question: 'Do you need significantly more square footage?',
    options: [
      { label: 'No — current size works', value: 1 },
      { label: 'A little — under 20% more', value: 2 },
      { label: 'Moderate — 20–40% more', value: 3 },
      { label: 'Significant — 40%+ more', value: 4 },
    ],
  },
  {
    id: 'budget',
    question: 'What is your renovation budget range?',
    options: [
      { label: 'Under $300k', value: 1 },
      { label: '$300k–$500k', value: 2 },
      { label: '$500k–$800k', value: 3 },
      { label: '$800k+', value: 4 },
    ],
  },
  {
    id: 'heritage',
    question: 'Is preserving the existing home a priority?',
    options: [
      { label: 'Yes — strong desire to preserve it', value: 1 },
      { label: 'Somewhat', value: 2 },
      { label: 'Not particularly', value: 3 },
      { label: 'Not a factor', value: 4 },
    ],
  },
];

type TeardownResult = {
  label: string;
  tag: 'renovate' | 'assess' | 'teardown';
  summary: string;
  accent: string;
};

function getTeardownResult(answers: Record<string, number>): TeardownResult {
  const total = Object.values(answers).reduce((s, n) => s + n, 0);
  if (answers['structure'] === 4) {
    return {
      label: 'Teardown-Rebuild Likely Required',
      tag: 'teardown',
      summary:
        'Severe structural issues typically make comprehensive renovation uneconomical. A teardown-rebuild eliminates unknown existing conditions and delivers a fully code-compliant structure with full design control.',
      accent: 'border-orange-500',
    };
  }
  if (total <= 12) {
    return {
      label: 'Renovation Is Likely the Right Path',
      tag: 'renovate',
      summary:
        'Your inputs suggest the existing structure can accommodate your goals efficiently. A renovation protects what is already working and can typically be staged if needed.',
      accent: 'border-green-600',
    };
  }
  if (total <= 20) {
    return {
      label: 'Consider Both Paths Before Deciding',
      tag: 'assess',
      summary:
        'Your project scope and budget sit in the middle range where both renovation and teardown-rebuild are viable. The right answer depends on a detailed site assessment and final scope conversation.',
      accent: 'border-kiewit-yellow',
    };
  }
  return {
    label: 'Teardown-Rebuild Is Worth Considering',
    tag: 'teardown',
    summary:
      'Your inputs suggest a teardown-rebuild may deliver better value per dollar than an extensive renovation. You get full design control, a new structure and no inherited hidden conditions.',
    accent: 'border-orange-500',
  };
}

export const TeardownDecisionTool = () => {
  const toolId = 'teardown_decision';
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const current = teardownQuestions[step];
  const totalSteps = teardownQuestions.length;
  const isAnswered = answers[current?.id] !== undefined;
  const allAnswered = teardownQuestions.every((q) => answers[q.id] !== undefined);
  const result = allAnswered ? getTeardownResult(answers) : null;

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    trackToolEvent('tool_input_changed', {
      tool_id: toolId,
      control: current.id,
      value,
    });
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else setSubmitted(true);
  };

  const handleBack = () => {
    if (submitted) setSubmitted(false);
    else setStep((s) => Math.max(0, s - 1));
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <>
      <ToolHero
        eyebrow="FREE TOOL · GTA CONSTRUCTION"
        title="Teardown-Rebuild vs. Renovation Decision Tool"
        subtitle="Answer 7 questions about your property to get a recommendation on which path delivers better value."
        image={v('ai-work-older-toronto-homes')}
        toolId={toolId}
      />
      <ToolGeoEvidence
        answer="The teardown versus renovation tool compares the owner's goal, existing structure, scope size, zoning risk, budget tolerance and long-term value. It is useful before buying a fixer-upper, committing to a deep renovation or assuming a rebuild is automatically better."
        facts={[
          'Renovation can preserve character and reduce demolition scope, but hidden structure, low basements, old wiring and system replacement can erase the savings.',
          'Teardown-rebuild can deliver cleaner design control, but it resets the project under current zoning, tree, grading and permit rules.',
          'The right decision usually depends on land value, existing-condition risk, approval path, target layout and how long the owner plans to hold the property.',
        ]}
        steps={[
          'Answer the seven property questions',
          'Review whether the result points to renovate, rebuild or assess further',
          'Check zoning, heritage, trees and existing structure',
          'Compare design goals against budget and carrying cost',
          'Book a site review before committing to demolition or drawings',
        ]}
        caveat="The tool gives a directional read. A final recommendation needs site review, zoning checks, structural assessment, budget modelling and owner priorities."
      />

      <section className="bg-white text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-4xl mx-auto"
        >
          <THeading title="Property Assessment" dark />

          {!submitted ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10">
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-8">
                <div className="text-sm font-bold text-gray-500">
                  Question {step + 1} of {totalSteps}
                </div>
                <div className="flex gap-1.5">
                  {teardownQuestions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-8 rounded-full transition-colors ${
                        i < step ? 'bg-kiewit-yellow' : i === step ? 'bg-kiewit-dark' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-semibold text-black mb-8">{current.question}</h3>
              <div className="space-y-3 mb-10">
                {current.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(opt.value)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-base font-medium ${
                      answers[current.id] === opt.value
                        ? 'bg-kiewit-dark text-white border-kiewit-yellow'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className="px-7 py-3 bg-kiewit-dark text-white font-bold rounded-lg hover:bg-kiewit-blue disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  {step < totalSteps - 1 ? 'Next' : 'See Result'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className={`border-l-4 ${result.accent} bg-gray-50 p-8 rounded-r-2xl`}>
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-3">
                  Your Result
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-black mb-4">{result.label}</h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{result.summary}</p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={getRouteHref('contact-us')}
                  onClick={() =>
                    trackToolEvent('tool_cta_clicked', {
                      tool_id: toolId,
                      destination: getRouteHref('contact-us'),
                    })
                  }
                  className="inline-flex items-center bg-kiewit-yellow text-black font-bold tracking-[0.08em] uppercase px-7 py-3.5 rounded-lg hover:bg-kiewit-dark hover:text-white transition-colors gap-2"
                >
                  Discuss with Vitalite <ChevronRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-3 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:border-gray-500 transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </section>

      <ToolCitationAsset
        title="Teardown Versus Renovation Planning Brief"
        sourceNote="Cite this result as a directional decision framework. It should be paired with a structural walk-through, zoning review, land value context and carrying-cost model before an owner chooses demolition or renovation."
        assumptions={[
          'The tool cannot inspect foundation, framing, wiring, plumbing, insulation or hazardous materials.',
          'A teardown can lose existing non-conforming rights and must be checked against current zoning.',
          'A renovation can preserve value, but hidden conditions may require full mechanical replacement.',
          'Financing, interim housing and project duration can change the better-value path.',
        ]}
        relatedLinks={[
          { label: 'Full-gut renovation service', key: 'service-gut-renovations' },
          { label: 'Custom home design-build service', key: 'service-custom-homes' },
          { label: 'Fixer-upper guide', key: 'blog-fixer-upper-vs-new' },
          { label: 'Project review intake', key: 'contact-us' },
        ]}
      />

      <ToolFaq
        items={[
          {
            q: 'When does teardown-rebuild make more sense than renovation in Toronto?',
            a: 'Teardown-rebuild typically delivers better value when the existing structure has major hidden conditions (knob-and-tube wiring, low basement, foundation issues), when the desired scope exceeds 70% of the home, when full design control is a priority, or when the project budget crosses the threshold where renovation and rebuild are comparably priced. In established Toronto neighbourhoods, land value is the dominant cost — making the construction method a smaller portion of total investment than owners expect.',
          },
          {
            q: 'What are the zoning rules for teardown-rebuilds in Toronto?',
            a: 'A teardown-rebuild must comply with current zoning for the lot, including setbacks, lot coverage limits and height restrictions. Some older properties are legally non-conforming — meaning they exceed current zoning limits — and a teardown loses those non-conforming rights. Before committing to demolition, a zoning review is essential. Vitalite reviews zoning compliance at the first site visit.',
          },
          {
            q: 'Can Vitalite manage both a gut renovation and a teardown-rebuild?',
            a: 'Yes. Vitalite delivers both under a design-build contract. For gut renovations, the team assesses structural condition before any scope is committed. For teardown-rebuilds, the team handles demolition, foundation work, architectural drawings, permits, structural engineering and full construction under one contract.',
          },
        ]}
      />
      <ToolCta toolId={toolId} message="This tool gives a directional read — the actual answer depends on your lot, existing structure and project goals. Contact Vitalite for a no-obligation site assessment." />
    </>
  );
};

// ─── Calculator 4: Building Permit Timeline Estimator ────────────────────────

const permitProjectTypeOptions: Array<{ label: string; value: string }> = [
  { label: 'Custom home (new build)', value: 'custom-home' },
  { label: 'Home addition', value: 'addition' },
  { label: 'Laneway / garden suite', value: 'garden-suite' },
  { label: 'Multiplex conversion', value: 'multiplex' },
  { label: 'Major renovation', value: 'renovation' },
];

const permitLocationOptions: Array<{ label: string; value: string }> = [
  { label: 'Toronto (City proper)', value: 'toronto' },
  { label: 'North York / Etobicoke / Scarborough', value: 'north-york' },
  { label: 'Mississauga', value: 'mississauga' },
  { label: 'York Region (Markham / Richmond Hill / Vaughan)', value: 'york-region' },
];

type WeekRange = [number, number];

const designWeeks: Record<string, WeekRange> = {
  'custom-home': [16, 24],
  addition: [8, 14],
  'garden-suite': [6, 10],
  multiplex: [12, 20],
  renovation: [4, 8],
};

const permitWeeks: Record<string, Record<string, WeekRange>> = {
  toronto: {
    'custom-home': [14, 22],
    addition: [12, 18],
    'garden-suite': [10, 16],
    multiplex: [16, 24],
    renovation: [8, 14],
  },
  'north-york': {
    'custom-home': [10, 18],
    addition: [8, 14],
    'garden-suite': [8, 12],
    multiplex: [12, 20],
    renovation: [6, 12],
  },
  mississauga: {
    'custom-home': [8, 14],
    addition: [6, 12],
    'garden-suite': [6, 10],
    multiplex: [10, 16],
    renovation: [4, 10],
  },
  'york-region': {
    'custom-home': [8, 14],
    addition: [6, 10],
    'garden-suite': [6, 10],
    multiplex: [10, 16],
    renovation: [4, 8],
  },
};

const constructionWeeks: Record<string, WeekRange> = {
  'custom-home': [52, 72],
  addition: [16, 24],
  'garden-suite': [14, 20],
  multiplex: [28, 40],
  renovation: [10, 20],
};

export const PermitTimelineEstimator = () => {
  const toolId = 'permit_timeline';
  const [projType, setProjType] = useState('custom-home');
  const [permLoc, setPermLoc] = useState('toronto');

  const design = designWeeks[projType];
  const permit = permitWeeks[permLoc][projType];
  const construction = constructionWeeks[projType];
  const totalLow = design[0] + permit[0] + construction[0];
  const totalHigh = design[1] + permit[1] + construction[1];
  const maxWeeks = totalHigh;

  const fmtWeeks = (r: WeekRange) => (r[0] === r[1] ? `${r[0]} weeks` : `${r[0]}–${r[1]} weeks`);
  const fmtMonths = (w: number) => `~${(w / 4.33).toFixed(1)} months`;

  const phases: Array<{ name: string; range: WeekRange; color: string }> = [
    { name: 'Design & Drawings', range: design, color: 'bg-kiewit-blue' },
    { name: 'Permit Application & Approval', range: permit, color: 'bg-kiewit-yellow' },
    { name: 'Construction', range: construction, color: 'bg-kiewit-dark border border-white/10' },
  ];

  return (
    <>
      <ToolHero
        eyebrow="FREE TOOL · GTA PERMITS"
        title="GTA Building Permit Timeline Estimator"
        subtitle="Understand how long design, permit approval and construction will take for your GTA project type."
        image={v('permit-drawings-guide')}
        toolId={toolId}
      />
      <ToolGeoEvidence
        answer="The permit timeline estimator separates design, permit review and construction so owners can see where time is usually spent. It is strongest for planning schedules before drawings are submitted or a move-in date is promised."
        facts={[
          'Permit timing changes by project type, municipality, drawing completeness, zoning compliance, conservation overlays and municipal comment cycles.',
          'Custom homes, additions, garden suites, multiplexes and major renovations have different design and review paths.',
          'A complete submission can reduce revision cycles, but municipal review, Committee of Adjustment, TRCA or heritage steps still add time when they apply.',
        ]}
        steps={[
          'Select project type and municipality',
          'Review the design, permit and construction phases separately',
          'Identify likely approval blockers before submission',
          'Build owner decisions and long-lead procurement into the schedule',
          'Use Vitalite to coordinate drawings, comments, inspections and closeout',
        ]}
        caveat="Timeline estimates are not approval guarantees. Incomplete drawings, municipal comments, variances, conservation review and hidden site issues can extend the schedule."
      />

      <section className="bg-white text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto"
        >
          <THeading title="Estimate Your Project Timeline" dark />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <OptionGroup
                label="Project Type"
                options={permitProjectTypeOptions}
                value={projType}
                onChange={setProjType}
                toolId={toolId}
                control="project_type"
              />
              <OptionGroup
                label="Municipality"
                options={permitLocationOptions}
                value={permLoc}
                onChange={setPermLoc}
                toolId={toolId}
                control="municipality"
              />
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-6">
                  Estimated Timeline
                </div>
                <div className="space-y-5">
                  {phases.map((phase) => (
                    <div key={phase.name}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm font-semibold text-gray-800">{phase.name}</span>
                        <span className="text-sm font-bold text-kiewit-dark">{fmtWeeks(phase.range)}</span>
                      </div>
                      <div className="h-7 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${phase.color} transition-all duration-500`}
                          style={{ width: `${(phase.range[1] / maxWeeks) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{fmtMonths(phase.range[1])}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-gray-800">Total Project Duration</span>
                    <span className="text-2xl font-bold text-kiewit-dark">
                      {fmtWeeks([totalLow, totalHigh])}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {fmtMonths(totalLow)} to {fmtMonths(totalHigh)}
                  </div>
                </div>
              </div>

              {permLoc === 'toronto' && (
                <div className="bg-kiewit-dark rounded-2xl p-5 text-white">
                  <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-kiewit-yellow mb-2">
                    Toronto Permit Note
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    City of Toronto currently processes residential permits slower than surrounding
                    municipalities. Complex projects or incomplete submissions can extend review time. Early
                    pre-application consultation reduces back-and-forth revision cycles.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      <ToolCitationAsset
        title="Permit Timeline Planning Brief"
        sourceNote="Cite this result with the selected project type and municipality. The timeline is a planning range that depends on drawing completeness, zoning compliance, municipal comments and construction sequencing."
        assumptions={[
          'Design, permit review and construction are separate phases and can overlap only when scope is controlled.',
          'Committee of Adjustment, heritage, conservation, tree or grading review can add months.',
          'Incomplete drawings and unresolved engineering comments can reset municipal review cycles.',
          'Procurement, inspections, weather and owner decisions can change the construction phase.',
        ]}
        relatedLinks={[
          { label: 'Drawings and permits service', key: 'service-drawings-permits' },
          { label: 'Permit-ready drawings checklist', key: 'guide-toronto-permit-ready-drawings-checklist' },
          { label: 'Toronto permit drawings guide', key: 'guide-toronto-permit-drawings' },
          { label: 'Project review intake', key: 'contact-us' },
        ]}
      />

      <ToolFaq
        items={[
          {
            q: 'How long does a Toronto building permit take to approve?',
            a: 'Toronto permit timelines vary by project type and submission quality. Custom home permits currently take 14–22 weeks for first review. Home additions take 12–18 weeks. Garden suites take 10–16 weeks. Incomplete or non-compliant submissions reset the clock. Projects that include a pre-application meeting and complete drawing packages tend to move faster.',
          },
          {
            q: 'Can a contractor speed up the permit process?',
            a: 'Yes, in several ways. Submitting a complete, coordinated drawing package on first application reduces revision cycles. Knowing the local permit office requirements in advance prevents resubmissions. Pre-application consultations with city staff clarify non-standard projects before the formal clock starts. Vitalite has permit coordinators familiar with Toronto, North York, Mississauga and York Region requirements.',
          },
          {
            q: 'What causes permit delays in the GTA?',
            a: 'The most common causes of delay are incomplete drawing submissions, zoning non-compliance that requires Committee of Adjustment approval, conservation authority overlay requirements for properties near ravines or flood plains, and heritage designation. Experienced permit coordinators catch these issues before submission. Projects that start with a zoning and feasibility review rarely hit unexpected delays.',
          },
        ]}
      />
      <ToolCta toolId={toolId} message="Timelines are estimates based on current GTA processing rates. Contact Vitalite to discuss your specific permit path, submission requirements and how to avoid common delay triggers." />
    </>
  );
};

// ─── Tools Hub ────────────────────────────────────────────────────────────────

const toolCards = [
  {
    key: 'tool-addition-cost',
    eyebrow: 'Cost Estimator',
    title: 'Home Addition Cost Calculator',
    summary:
      'Get a planning-level cost range for a GTA home addition by type, size, finish level and location.',
    image: v('home-addition'),
  },
  {
    key: 'tool-laneway-cost',
    eyebrow: 'Cost Estimator',
    title: 'Laneway & Garden Suite Cost Calculator',
    summary:
      'Estimate what a detached laneway house or garden suite will cost to build in Toronto and the GTA.',
    image: v('garden-suite'),
  },
  {
    key: 'tool-teardown-decision',
    eyebrow: 'Decision Tool',
    title: 'Teardown vs. Renovation Tool',
    summary:
      'Answer 7 questions about your property to get a recommendation on which approach delivers better value.',
    image: v('ai-work-older-toronto-homes'),
  },
  {
    key: 'tool-permit-timeline',
    eyebrow: 'Timeline Estimator',
    title: 'Permit Timeline Estimator',
    summary:
      'Understand how long design, permit approval and construction will take for your GTA project type.',
    image: v('permit-drawings-guide'),
  },
];

export const ToolsHub = () => (
  <>
    <div className="relative h-[62vh] min-h-[520px] bg-kiewit-dark overflow-hidden">
      <img
        src={v('gta-design-build')}
        alt="GTA Construction Tools"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
      <div className="relative h-full flex items-center px-5 sm:px-8 md:px-24 pt-20">
        <div className="max-w-4xl text-white">
          <div className="inline-block border-b border-kiewit-yellow pb-1 mb-5 text-[11px] font-bold tracking-[0.2em] uppercase text-kiewit-yellow">
            FREE TOOLS · GTA CONSTRUCTION
          </div>
          <h1 className="text-[2.35rem] sm:text-5xl md:text-7xl font-bold mb-5 leading-[1.08] tracking-tight drop-shadow-md">
            GTA Construction Calculators
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">
            Free planning tools for GTA homeowners and investors. Estimate costs, timelines and project
            direction before committing to drawings or contractor pricing.
          </p>
          <a
            href={getRouteHref('contact-us')}
            className="group inline-flex items-center text-lg sm:text-xl font-medium hover:text-gray-300 transition-colors"
          >
            Discuss your project
            <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>

    <ToolGeoEvidence
      answer="The Vitalite tools hub collects construction calculators for early GTA project planning. Each tool gives a directional range or decision framework before owners commit to drawings, permits, financing assumptions or contractor pricing."
      facts={[
        'Tools cover addition cost, laneway and garden suite cost, teardown versus renovation decisions and building permit timelines.',
        'Each result depends on property-specific inputs such as zoning, structure, servicing, access, finishes, municipal comments and trade availability.',
        'The tools are designed to make the first consultation more precise, not to replace a feasibility review or construction quote.',
      ]}
      steps={[
        'Choose the tool that matches the decision',
        'Enter approximate project inputs',
        'Review cost, timeline or recommendation output',
        'Gather property-specific evidence',
        'Book a Vitalite review before treating the result as final',
      ]}
      caveat="Calculator results are planning ranges. Reliable pricing and scheduling require address-specific review, drawings, consultant inputs, permit path and construction sequencing."
    />

    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="max-w-[1400px] mx-auto"
      >
        <THeading title="Planning Tools" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12">
          These tools are built for the research phase — before you commit to an architect, designer or
          contractor. Each gives you a planning-level estimate or directional read that makes your first
          project conversation more productive.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {toolCards.map((card) => (
            <a
              key={card.key}
              href={getRouteHref(card.key)}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-kiewit-yellow transition-colors"
            >
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover"
              />
              <div className="p-6">
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-400 group-hover:text-kiewit-yellow transition-colors mb-3">
                  {card.eyebrow}
                </div>
                <h2 className="text-xl font-semibold text-black mb-3 leading-snug">{card.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{card.summary}</p>
                <div className="inline-flex items-center text-sm font-bold tracking-[0.1em] uppercase text-black group-hover:text-kiewit-yellow transition-colors">
                  Use tool <ChevronRight className="w-4 h-4 ml-1.5" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    </section>

    <section className="bg-kiewit-dark py-16 md:py-20 px-5 sm:px-8 md:px-24 text-center">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="max-w-3xl mx-auto"
      >
        <p className="text-lg sm:text-xl text-gray-300 mb-8">
          These tools give you planning-level context. When you are ready to move from estimate to project,
          Vitalite reviews your property, scope, zoning and budget at the first meeting.
        </p>
        <a
          href={getRouteHref('contact-us')}
          className="inline-flex items-center bg-kiewit-yellow text-black font-bold tracking-[0.08em] uppercase px-8 py-4 rounded-lg hover:bg-white transition-colors"
        >
          Start a project review
          <ChevronRight className="w-5 h-5 ml-2" />
        </a>
      </motion.div>
    </section>
  </>
);
