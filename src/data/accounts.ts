export interface Activity {
  type: 'call' | 'email' | 'visit'
  date: string
  summary: string
}

export interface Account {
  id: string
  name: string
  industry: 'Manufacturing' | 'Healthcare' | 'Logistics' | 'Technology'
  tier: 'Enterprise' | 'Mid-Market' | 'SMB'
  contact: { name: string; title: string; phone: string }
  address: string
  lat: number
  lng: number
  revenue: number
  lastVisit: string
  lastVisitDaysAgo: number
  activities: Activity[]
  notes: string
  routeOrder: number
  done: boolean
}

export const accounts: Account[] = [
  {
    id: 'meridian',
    name: 'Meridian Medical Devices',
    industry: 'Healthcare',
    tier: 'Enterprise',
    contact: { name: 'Sandra Kowalski', title: 'VP of Operations', phone: '+1 (310) 555-0182' },
    address: '9100 Wilshire Blvd, Beverly Hills, CA 90210',
    lat: 34.0683,
    lng: -118.3987,
    revenue: 14200000,
    lastVisit: '2026-09-15',
    lastVisitDaysAgo: 18,
    activities: [
      { type: 'visit', date: 'Sep 15', summary: 'Q4 contract review — VP requested revised pricing deck' },
      { type: 'call', date: 'Sep 8', summary: 'Follow-up on sterilization unit demo feedback' },
      { type: 'email', date: 'Aug 29', summary: 'Sent updated product catalog and compliance docs' },
    ],
    notes: 'Sandra is the decision maker. CFO approval needed for deals over $200K. Renewal comes up Q1.',
    routeOrder: 1,
    done: true,
  },
  {
    id: 'pacific',
    name: 'Pacific Rim Logistics',
    industry: 'Logistics',
    tier: 'Mid-Market',
    contact: { name: 'David Chen', title: 'Director of Procurement', phone: '+1 (310) 555-0247' },
    address: '433 N Camden Dr, Beverly Hills, CA 90210',
    lat: 34.0727,
    lng: -118.4001,
    revenue: 3800000,
    lastVisit: '2026-09-22',
    lastVisitDaysAgo: 11,
    activities: [
      { type: 'visit', date: 'Sep 22', summary: 'Demo of route optimization module — strong interest' },
      { type: 'call', date: 'Sep 18', summary: 'Discussed fleet telematics integration timeline' },
      { type: 'email', date: 'Sep 10', summary: 'Sent ROI case study for logistics vertical' },
    ],
    notes: 'David moves fast. Has budget authority up to $75K. Competitive with Samsara.',
    routeOrder: 2,
    done: true,
  },
  {
    id: 'apex',
    name: 'Apex Manufacturing Group',
    industry: 'Manufacturing',
    tier: 'Enterprise',
    contact: { name: 'Robert Garza', title: 'Chief Procurement Officer', phone: '+1 (323) 555-0318' },
    address: '8899 Beverly Blvd, West Hollywood, CA 90048',
    lat: 34.0764,
    lng: -118.3742,
    revenue: 22100000,
    lastVisit: '2026-09-29',
    lastVisitDaysAgo: 4,
    activities: [
      { type: 'visit', date: 'Sep 29', summary: 'Plant walkthrough — identified 3 additional SKU opportunities' },
      { type: 'call', date: 'Sep 25', summary: 'Technical call with engineering team on specs' },
      { type: 'email', date: 'Sep 20', summary: 'Sent compliance documentation per legal request' },
    ],
    notes: 'Largest account on territory. Board approval required for enterprise tier. Robert is a champion.',
    routeOrder: 3,
    done: false,
  },
  {
    id: 'solano',
    name: 'Solano Healthcare Partners',
    industry: 'Healthcare',
    tier: 'Mid-Market',
    contact: { name: 'Maria Trevino', title: 'Director of Supply Chain', phone: '+1 (310) 555-0451' },
    address: '345 N Maple Dr, Beverly Hills, CA 90210',
    lat: 34.0753,
    lng: -118.4032,
    revenue: 5600000,
    lastVisit: '2026-09-10',
    lastVisitDaysAgo: 23,
    activities: [
      { type: 'call', date: 'Sep 10', summary: 'DM unavailable — spoke with office manager' },
      { type: 'email', date: 'Sep 5', summary: 'Sent Q4 pricing proposal and comparison sheet' },
      { type: 'visit', date: 'Aug 28', summary: 'Initial discovery — identified PPE sourcing pain points' },
    ],
    notes: 'Maria has been hard to reach. Best window is Tuesday/Thursday mornings. Budget refreshes Oct 1.',
    routeOrder: 4,
    done: false,
  },
  {
    id: 'westside',
    name: 'Westside Distribution Co',
    industry: 'Logistics',
    tier: 'SMB',
    contact: { name: 'Tommy Park', title: 'Owner / CEO', phone: '+1 (310) 555-0563' },
    address: '1100 Glendon Ave, Los Angeles, CA 90024',
    lat: 34.0611,
    lng: -118.4423,
    revenue: 1200000,
    lastVisit: '2026-09-18',
    lastVisitDaysAgo: 15,
    activities: [
      { type: 'visit', date: 'Sep 18', summary: 'Closed SMB starter package — onboarding scheduled Nov 1' },
      { type: 'call', date: 'Sep 12', summary: 'Negotiated pricing — agreed on 12-month term' },
      { type: 'email', date: 'Sep 8', summary: 'Sent contract redline with payment terms' },
    ],
    notes: 'Tommy is a close. Referral potential — knows 4-5 similar operators in the area.',
    routeOrder: 5,
    done: false,
  },
  {
    id: 'bravo',
    name: 'Bravo Industrial Supply',
    industry: 'Manufacturing',
    tier: 'Mid-Market',
    contact: { name: 'Lisa Okonkwo', title: 'Purchasing Manager', phone: '+1 (323) 555-0674' },
    address: '8383 Wilshire Blvd, Beverly Hills, CA 90211',
    lat: 34.0621,
    lng: -118.3851,
    revenue: 4100000,
    lastVisit: '2026-08-15',
    lastVisitDaysAgo: 49,
    activities: [
      { type: 'call', date: 'Aug 15', summary: 'Left voicemail — no callback received' },
      { type: 'email', date: 'Aug 10', summary: 'Re-engagement email with new product line info' },
      { type: 'visit', date: 'Jul 22', summary: 'Met with Lisa — showed interest in bulk pricing tier' },
    ],
    notes: 'Long dormant. Lisa mentioned evaluating competitor in August. Worth a re-engagement pitch.',
    routeOrder: 6,
    done: false,
  },
]
