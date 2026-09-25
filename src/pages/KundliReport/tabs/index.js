import ChartTab from './ChartTab.jsx'
import MatchingTab from './MatchingTab.jsx'
import MangalDoshaTab from './MangalDoshaTab.jsx'
import SadeSatiTab from './SadeSatiTab.jsx'
import MahadashaTab from './MahadashaTab.jsx'
import CareerTab from './CareerTab.jsx'
import FinanceTab from './FinanceTab.jsx'
import HealthTab from './HealthTab.jsx'
import MarriageTab from './MarriageTab.jsx'
import LuckyTab from './LuckyTab.jsx'

export const TABS = [
  { key: 'chart', label: 'Kundli Chart', Component: ChartTab },
  { key: 'matching', label: 'Kundli Matching', Component: MatchingTab },
  { key: 'mangal-dosha', label: 'Mangal Dosha', Component: MangalDoshaTab },
  { key: 'sade-sati', label: 'Sade Sati', Component: SadeSatiTab },
  { key: 'mahadasha', label: 'Mahadasha', Component: MahadashaTab },
  { key: 'career', label: 'Career Analysis', Component: CareerTab },
  { key: 'finance', label: 'Finance Analysis', Component: FinanceTab },
  { key: 'health', label: 'Health Analysis', Component: HealthTab },
  { key: 'marriage', label: 'Marriage', Component: MarriageTab },
  { key: 'lucky', label: 'Lucky Gemstones', Component: LuckyTab },
]
