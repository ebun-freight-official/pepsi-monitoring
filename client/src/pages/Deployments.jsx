import { useOutletContext } from 'react-router'
import TruckCard from '../components/TruckCard'
import DeploymentHistoryCard from '../components/DeploymentHistoryCard'
import { TRUCKS, calcDeploymentStats } from '../utils/inventory'

function HeaderStat ({ label, value, color }) {
  return (
    <div className='text-right hidden sm:block'>
      <div className='text-[10px] uppercase text-slate-500'>{label}</div>
      <div className={`text-sm font-medium ${color}`}>{value}</div>
    </div>
  )
}

export default function Deployments () {
  const {
    stocks,
    deployments,
    truckLoadouts,
    deployTruck,
    returnTruck,
    updateTruckLoadout
  } = useOutletContext()

  const stats = calcDeploymentStats(deployments)
  const history = deployments.filter(d => d.status === 'returned')

  const activeByTruck = {}
  deployments
    .filter(d => d.status === 'out')
    .forEach(d => {
      activeByTruck[d.truck] = d
    })

  return (
    <div className='bg-slate-900 flex-1 outline outline-slate-800 rounded-lg p-2 flex flex-col overflow-hidden'>
      <div className='flex justify-between items-center pb-2 border-b border-slate-800'>
        <div className='uppercase font-medium text-lg'>Deployments</div>

        <div className='flex items-center gap-5'>
          <HeaderStat
            label='Trucks Out'
            value={stats.trucksOut}
            color='text-indigo-400'
          />
          <HeaderStat
            label='Cases Out'
            value={stats.casesOut.toLocaleString()}
            color='text-amber-400'
          />
          <HeaderStat
            label='Cases Sold'
            value={stats.casesSold.toLocaleString()}
            color='text-emerald-400'
          />
        </div>
      </div>

      <div className='flex-1 flex gap-3 mt-2 overflow-hidden'>
        <div className='flex-[3] min-w-0 overflow-auto pr-1'>
          <div className='text-[11px] uppercase tracking-wide text-slate-500 sticky top-0 bg-slate-900 z-10 pb-2'>
            Trucks
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
            {TRUCKS.map(truck => (
              <TruckCard
                key={truck}
                truck={truck}
                activeDeployment={activeByTruck[truck] || null}
                loadout={truckLoadouts[truck] || []}
                stocks={stocks}
                onDeploy={deployTruck}
                onReturn={returnTruck}
                onUpdateLoadout={updateTruckLoadout}
              />
            ))}
          </div>
        </div>

        <div className='w-72 shrink-0 overflow-auto border-l border-slate-800 pl-3'>
          <div className='flex items-center justify-between mb-2 sticky top-0 bg-slate-900 z-10 pb-2'>
            <div className='text-[11px] uppercase tracking-wide text-slate-500'>
              History
            </div>
            {history.length > 0 && (
              <span className='text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded'>
                {history.length}
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className='px-3 py-12 text-center text-slate-600 text-sm'>
              No completed deployments yet.
            </div>
          ) : (
            <div className='space-y-2'>
              {history.map(d => (
                <DeploymentHistoryCard key={d.id} deployment={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
