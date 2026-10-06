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
    defaultUnit: 24,
    bottleDeposit: 6,
    caseDeposit: 52,
    isPlastic: false
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
