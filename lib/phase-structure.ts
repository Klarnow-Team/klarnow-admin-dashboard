// Hardcoded phase structure - this never changes
// Only status and checklist completion are stored in database

export interface PhaseStructure {
  phase_id: string
  phase_number: number
  title: string
  subtitle: string | null
  day_range: string
  checklist_labels: string[]
}

export interface PhasesState {
  [phase_id: string]: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
    started_at?: string | null
    completed_at?: string | null
    checklist: {
      [label: string]: boolean
    }
  }
}

// LAUNCH Kit Phase Structure
export const LAUNCH_KIT_STRUCTURE: PhaseStructure[] = [
  {
    phase_id: 'PHASE_1',
    phase_number: 1,
    title: 'Inputs & clarity',
    subtitle: 'Lock the message and plan.',
    day_range: 'Days 0-2',
    checklist_labels: [
      'Onboarding steps completed',
      'Brand / strategy call completed',
      'Simple 14 day plan agreed',
    ],
  },
  {
    phase_id: 'PHASE_2',
    phase_number: 2,
    title: 'Words that sell',
    subtitle: 'We write your 3 pages.',
    day_range: 'Days 3-5',
    checklist_labels: [
      'Draft homepage copy ready',
      'Draft offer / services page ready',
      'Draft contact / about copy ready',
      'You reviewed and approved copy',
    ],
  },
  {
    phase_id: 'PHASE_3',
    phase_number: 3,
    title: 'Design & build',
    subtitle: 'We turn copy into a 3 page site.',
    day_range: 'Days 6-10',
    checklist_labels: [
      'Site layout built for all 3 pages',
      'Mobile checks done',
      'Testimonials and proof added',
      'Staging link shared with you',
    ],
  },
  {
    phase_id: 'PHASE_4',
    phase_number: 4,
    title: 'Test & launch',
    subtitle: 'We connect domain, test and go live.',
    day_range: 'Days 11-14',
    checklist_labels: [
      'Forms tested',
      'Domain connected',
      'Final tweaks applied',
      'Loom walkthrough recorded and shared',
    ],
  },
]

// GROWTH Kit Phase Structure
export const GROWTH_KIT_STRUCTURE: PhaseStructure[] = [
  {
    phase_id: 'PHASE_1',
    phase_number: 1,
    title: 'Strategy locked in',
    subtitle: 'Offer, goal and funnel map agreed.',
    day_range: 'Days 0-2',
    checklist_labels: [
      'Onboarding complete',
      'Strategy / funnel call done',
      'Main offer + 90 day goal confirmed',
      'Simple funnel map agreed',
    ],
  },
  {
    phase_id: 'PHASE_2',
    phase_number: 2,
    title: 'Copy & email engine',
    subtitle: 'We write your site copy and 5 emails.',
    day_range: 'Days 3-5',
    checklist_labels: [
      'Draft website copy ready',
      'Draft 5-email nurture sequence ready',
      'You reviewed and approved copy',
      'Any changes locked in',
    ],
  },
  {
    phase_id: 'PHASE_3',
    phase_number: 3,
    title: 'Build the funnel',
    subtitle: 'Pages, lead magnet and blog hub built.',
    day_range: 'Days 6-10',
    checklist_labels: [
      'All pages built',
      'Lead magnet created',
      'Blog hub set up',
      'Email sequences integrated',
      'Staging link shared',
    ],
  },
  {
    phase_id: 'PHASE_4',
    phase_number: 4,
    title: 'Test & handover',
    subtitle: 'We test the full journey and go live.',
    day_range: 'Days 11-14',
    checklist_labels: [
      'Funnel tested from first visit to booked call',
      'Domain connected',
      'Tracking checked (Analytics / pixels)',
      '5-email sequence switched on',
      'Loom walkthrough recorded and shared',
    ],
  },
]

export function getPhaseStructureForKitType(kitType: 'LAUNCH' | 'GROWTH'): PhaseStructure[] {
  return kitType === 'LAUNCH' ? LAUNCH_KIT_STRUCTURE : GROWTH_KIT_STRUCTURE
}

// Helper to merge structure with state
export function mergePhaseStructureWithState(
  structure: PhaseStructure[],
  state: PhasesState | null
): Array<PhaseStructure & {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
  started_at: string | null
  completed_at: string | null
  checklist: Array<{ label: string; is_done: boolean }>
}> {
  return structure.map(phase => {
    const phaseState = state?.[phase.phase_id] || {
      status: 'NOT_STARTED' as const,
      checklist: {},
    }

    // Merge checklist: Template labels are always the source of truth
    // Database only stores completion status for template labels
    // Any database items that don't match template labels are ignored
    const checklist: Array<{ label: string; is_done: boolean }> = []
    const databaseChecklist = phaseState.checklist || {}
    
    // Always use template labels, but check database for completion status
    phase.checklist_labels.forEach(templateLabel => {
      // Check if this template label exists in database with completion status
      const isDone = databaseChecklist[templateLabel] === true
      checklist.push({
        label: templateLabel,
        is_done: Boolean(isDone),
      })
    })
    
    // Log if database has extra items that don't match template
    const templateLabelsSet = new Set(phase.checklist_labels)
    const databaseLabels = Object.keys(databaseChecklist)
    const extraItems = databaseLabels.filter(label => !templateLabelsSet.has(label))
    
    if (extraItems.length > 0) {
      console.warn(`⚠️ Phase ${phase.phase_id} has ${extraItems.length} database items not in template (ignored):`, extraItems)
    }
    
    console.log(`✅ Merged checklist for ${phase.phase_id} (${phase.title}): ${checklist.length} items from template, ${databaseLabels.length} items in database`, {
      templateLabels: phase.checklist_labels,
      checklistItems: checklist.map(item => ({ label: item.label, is_done: item.is_done })),
      extraItemsIgnored: extraItems,
    })

    return {
      ...phase,
      status: phaseState.status,
      started_at: phaseState.started_at || null,
      completed_at: phaseState.completed_at || null,
      checklist,
    }
  })
}

// Helper to initialize empty state for a kit type
export function initializePhasesState(kitType: 'LAUNCH' | 'GROWTH'): PhasesState {
  const structure = getPhaseStructureForKitType(kitType)
  const state: PhasesState = {}

  structure.forEach(phase => {
    const checklist: { [label: string]: boolean } = {}
    phase.checklist_labels.forEach(label => {
      checklist[label] = false
    })

    state[phase.phase_id] = {
      status: 'NOT_STARTED',
      checklist,
    }
  })

  return state
}

