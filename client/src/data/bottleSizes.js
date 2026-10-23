export const BOTTLE_SIZES = [
  {
    id: '8oz_12oz',
    label: '8oz / 12oz',
    defaultUnit: 24,
    bottleDeposit: 2,
    caseDeposit: 42,
    isPlastic: false
  },
  {
    id: '750ml',
    label: '750ml',
    defaultUnit: 12,
    bottleDeposit: 4,
    caseDeposit: 52,
    isPlastic: false
  },
  {
    id: '1l',
    label: '1L',
    defaultUnit: 12,
    bottleDeposit: 6,
    caseDeposit: 52,
    isPlastic: false
  },
  {
    id: '195ml',
    label: '195ml',
    defaultUnit: 12,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  },
  {
    id: '290ml',
    label: '290ml',
    defaultUnit: 12,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  },
  {
    id: '237ml',
    label: '237ml',
    defaultUnit: 24,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  },
  {
    id: '350ml',
    label: '350ml',
    defaultUnit: 24,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  },
  {
    id: '500ml',
    label: '500ml',
    defaultUnit: 24,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  },
  {
    id: '1l_plastic',
    label: '1L',
    defaultUnit: 12,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  },
  {
    id: '1_5l_plastic',
    label: '1.5L',
    defaultUnit: 12,
    bottleDeposit: 0,
    caseDeposit: 0,
    isPlastic: true
  }
]

export const findBottleSize = id => BOTTLE_SIZES.find(b => b.id === id)

export const calcEmptiesPerCase = (bottleSizeId, unit) => {
  const bs = findBottleSize(bottleSizeId)
  if (!bs) return 0
  if (bs.isPlastic) return 0
  const u = Number(unit) || 0
  return u * bs.bottleDeposit + bs.caseDeposit
}

// ═══════════════════════════════════════════════════════════════════════
//  Derived empties rates — single source of truth is BOTTLE_SIZES above
// ═══════════════════════════════════════════════════════════════════════

const RETURNABLE_SIZES = BOTTLE_SIZES.filter(bs => !bs.isPlastic)

export const EMPTIES_GROUPS = ['fullCase', 'caseOnly', 'bottlesOnly']

export const EMPTIES_GROUP_LABELS = {
  fullCase: 'Full Case',
  caseOnly: 'Case Only',
  bottlesOnly: 'Bottles Only'
}

export const EMPTIES_RATES = {
  fullCase: RETURNABLE_SIZES.map(bs => ({
    id: bs.id,
    label: bs.label,
    price: bs.defaultUnit * bs.bottleDeposit + bs.caseDeposit
  })),
  caseOnly: RETURNABLE_SIZES.map(bs => ({
    id: bs.id,
    label: bs.label,
    price: bs.caseDeposit
  })),
  bottlesOnly: RETURNABLE_SIZES.map(bs => ({
    id: bs.id,
    label: bs.label,
    price: bs.bottleDeposit
  }))
}

export const EMPTY_EMPTIES = { fullCase: {}, caseOnly: {}, bottlesOnly: {} }

export const calcEmptiesGroupSubtotal = (group, quantities = {}) =>
  (EMPTIES_RATES[group] || []).reduce((sum, r) => {
    const qty = Number(quantities?.[r.id]) || 0
    return sum + qty * r.price
  }, 0)

export const calcEmptiesTotal = (empties = {}) =>
  EMPTIES_GROUPS.reduce(
    (sum, g) => sum + calcEmptiesGroupSubtotal(g, empties[g] || {}),
    0
  )

export const calcEmptiesQuantity = (empties = {}) =>
  EMPTIES_GROUPS.reduce((sum, g) => {
    const group = empties[g] || {}
    return sum + Object.values(group).reduce((s, v) => s + (Number(v) || 0), 0)
  }, 0)
