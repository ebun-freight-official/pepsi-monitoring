import { calcWithTruckByProduct, calcSoldByProduct } from '../utils/inventory'

export default function StockTable ({
  stocks,
  deployments = [],
  truckLoadouts = {}
}) {
  const withTruckMap = calcWithTruckByProduct(deployments, truckLoadouts)
  const soldMap = calcSoldByProduct(deployments)

  return (
    <table className='w-full text-sm border-collapse'>
      <thead className='sticky top-0 bg-slate-900 z-10'>
        <tr className='text-left text-[11px] uppercase tracking-wide text-slate-500'>
          <th className='px-3 py-2 font-medium'>Product Name</th>
          <th className='px-3 py-2 font-medium'>Unit (btls/case)</th>
          <th className='px-3 py-2 font-medium'>In-House</th>
          <th className='px-3 py-2 font-medium'>Free Cases</th>
          <th className='px-3 py-2 font-medium'>With Truck</th>
          <th className='px-3 py-2 font-medium'>Sold Cases</th>
          <th className='px-3 py-2 font-medium'>Total Cases</th>
          <th className='px-3 py-2 font-medium'>Total Bottles</th>
          <th className='px-3 py-2 font-medium'>Price / Case</th>
          <th className='px-3 py-2 font-medium text-right'>Value</th>
        </tr>
      </thead>

      <tbody>
        {stocks.length === 0 && (
          <tr>
            <td colSpan={10} className='px-3 py-8 text-center text-slate-600'>
              No stocks yet. Click “New Entry” to add products.
            </td>
          </tr>
        )}

        {stocks.map(stock => {
          const inHouse = Number(stock.quantity) || 0
          const free = Number(stock.promo) || 0
          const withTruck = withTruckMap[stock.product_name] || 0
          const sold = soldMap[stock.product_name] || 0

          const totalCases = inHouse + free + withTruck
          const totalBottles = totalCases * (Number(stock.unit) || 0)
          const value =
            (inHouse + withTruck) * (Number(stock.price_per_case) || 0)

          return (
            <tr
              key={stock.id}
              className='border-t border-slate-800 hover:bg-slate-800/40 transition'
            >
              <td className='px-3 py-2 font-medium'>{stock.product_name}</td>
              <td className='px-3 py-2 text-slate-400'>{stock.unit}</td>
              <td className='px-3 py-2 text-indigo-400 font-medium'>
                {inHouse}
              </td>
              <td className='px-3 py-2'>
                {free > 0 ? (
                  <span className='text-[11px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-medium'>
                    {free}
                  </span>
                ) : (
                  <span className='text-slate-700'>—</span>
                )}
              </td>
              <td className='px-3 py-2'>
                {withTruck > 0 ? (
                  <span className='text-violet-400 font-medium'>
                    {withTruck}
                  </span>
                ) : (
                  <span className='text-slate-700'>—</span>
                )}
              </td>
              <td className='px-3 py-2'>
                {sold > 0 ? (
                  <span className='text-emerald-400 font-medium'>{sold}</span>
                ) : (
                  <span className='text-slate-700'>—</span>
                )}
              </td>
              <td className='px-3 py-2 text-slate-100 font-medium'>
                {totalCases}
              </td>
              <td className='px-3 py-2 text-sky-400 font-medium'>
                {totalBottles}
              </td>
              <td className='px-3 py-2 text-slate-300'>
                ₱{Number(stock.price_per_case).toFixed(2)}
              </td>
              <td className='px-3 py-2 text-right text-slate-300'>
                ₱{value.toFixed(2)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
