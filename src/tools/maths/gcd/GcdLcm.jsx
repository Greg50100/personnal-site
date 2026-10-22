import { useState } from 'react'
import { gcdSteps, lcm, parseBigInt, primeFactors } from './arith'

const fmtBig = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')

function Factors({ n }) {
  if (n < 2n) return <span className="text-zinc-500">{n.toString()} (pas de facteur premier)</span>
  const { factors, complete } = primeFactors(n)
  if (factors.length === 1 && factors[0].e === 1 && complete) return <span>{fmtBig(n)} est premier</span>
  return (
    <span>
      {factors.map((f, i) => (
        <span key={i}>
          {i > 0 && ' × '}
          {fmtBig(f.p)}
          {f.e > 1 && <sup>{f.e}</sup>}
          {f.unknown && <span className="text-zinc-500"> (non décomposé)</span>}
        </span>
      ))}
    </span>
  )
}

export default function GcdLcm() {
  const [inputs, setInputs] = useState({ a: '1071', b: '462' })
  const a = parseBigInt(inputs.a)
  const b = parseBigInt(inputs.b)
  const valid = a !== null && b !== null && (a !== 0n || b !== 0n)
  const res = valid ? gcdSteps(a >= b ? a : b, a >= b ? b : a) : null

  return (
    <div className="grid gap-6">
      <div className="card card-pad grid gap-4 sm:grid-cols-2">
        {['a', 'b'].map((k) => (
          <div key={k}>
            <label htmlFor={`g-${k}`} className="label">
              Entier {k}
            </label>
            <input
              id={`g-${k}`}
              className="input font-mono text-lg"
              inputMode="numeric"
              value={inputs[k]}
              onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })}
            />
          </div>
        ))}
        {!valid && <p className="text-sm text-red-500 sm:col-span-2">Saisissez deux entiers (pas tous les deux nuls).</p>}
      </div>

      {res && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card card-pad">
              <p className="label">PGCD</p>
              <p className="break-all font-mono text-3xl font-bold text-orange-600 dark:text-orange-400">{fmtBig(res.gcd)}</p>
              {res.gcd === 1n && <p className="mt-1 text-sm text-zinc-500">Les deux nombres sont premiers entre eux.</p>}
            </div>
            <div className="card card-pad">
              <p className="label">PPCM</p>
              <p className="break-all font-mono text-3xl font-bold text-orange-600 dark:text-orange-400">{fmtBig(lcm(a, b))}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card card-pad">
              <p className="label">Algorithme d'Euclide</p>
              {res.steps.length ? (
                <ol className="space-y-1 font-mono text-sm">
                  {res.steps.map((s, i) => (
                    <li key={i} className={s.r === 0n ? 'text-zinc-500' : ''}>
                      {fmtBig(s.a)} = {fmtBig(s.b)} × {fmtBig(s.q)} + <strong className={s.r === 0n ? '' : 'text-orange-600 dark:text-orange-400'}>{fmtBig(s.r)}</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-zinc-500">PGCD(n, 0) = n.</p>
              )}
              <p className="mt-3 text-xs text-zinc-500">Le PGCD est le dernier reste non nul.</p>
            </div>
            <div className="card card-pad">
              <p className="label">Décomposition en facteurs premiers</p>
              <p className="font-mono text-sm">
                a = <Factors n={a} />
              </p>
              <p className="mt-2 font-mono text-sm">
                b = <Factors n={b} />
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
