/**
 * Évaluateur d'expressions mathématiques (descente récursive, sans eval).
 * L'expression est compilée une seule fois en fonction JavaScript, puis évaluée autant de fois
 * que nécessaire (le traceur de courbes l'appelle pour des milliers de valeurs de x).
 *
 * Grammaire :
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/' | multiplication implicite) unary)*
 *   unary   := ('+' | '-') unary | power
 *   power   := postfix ('^' unary)?          (associatif à droite : 2^3^2 = 2^9)
 *   postfix := primary ('!' | '%' | '²' | '³')*
 *   primary := nombre | variable | constante | fonction '(' expr ')' | '(' expr ')' | '√' unary
 */

const toRad = (x, deg) => (deg ? (x * Math.PI) / 180 : x)
const toAngle = (rad, deg) => (deg ? (rad * 180) / Math.PI : rad)

const FUNCTIONS = {
  sin: (x, deg) => Math.sin(toRad(x, deg)),
  cos: (x, deg) => Math.cos(toRad(x, deg)),
  tan: (x, deg) => {
    if (deg && Math.abs((((x % 180) + 180) % 180) - 90) < 1e-12) throw new Error('tan non définie pour cet angle')
    return Math.tan(toRad(x, deg))
  },
  asin: (x, deg) => toAngle(Math.asin(x), deg),
  acos: (x, deg) => toAngle(Math.acos(x), deg),
  atan: (x, deg) => toAngle(Math.atan(x), deg),
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
}

const CONSTANTS = {
  pi: Math.PI,
  'π': Math.PI,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  'φ': (1 + Math.sqrt(5)) / 2,
}

export const FUNCTION_NAMES = Object.keys(FUNCTIONS)

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error('La factorielle demande un entier positif')
  if (n > 170) return Infinity
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

/** Découpe l'expression en jetons. */
export function tokenize(input) {
  const src = input
    .replace(/×|·/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/,/g, '.')
  const tokens = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i))
    if (num) {
      tokens.push({ type: 'num', value: parseFloat(num[0]) })
      i += num[0].length
      continue
    }
    const id = /^([a-z][a-z0-9]*|π|φ)/i.exec(src.slice(i))
    if (id) {
      tokens.push({ type: 'id', value: id[0].toLowerCase() })
      i += id[0].length
      continue
    }
    if ('+-*/^()!%²³√'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    throw new Error(`Caractère inattendu « ${ch} »`)
  }
  return tokens
}

/**
 * Compile une expression. `variables` liste les noms autorisés (ex. ['x']).
 * Retourne une fonction (scope) => nombre, où scope = { angle, ans, x, … }.
 * Lève une Error (message en français) si l'expression est invalide.
 */
export function compile(input, variables = []) {
  const tokens = tokenize(input)
  let pos = 0

  const peek = () => tokens[pos]
  const isOp = (v) => peek()?.type === 'op' && peek().value === v
  const next = () => tokens[pos++]
  const expect = (v) => {
    if (!isOp(v)) throw new Error(v === ')' ? 'Parenthèse fermante manquante' : `« ${v} » attendu`)
    pos++
  }
  // Un jeton qui peut commencer un facteur : sert à détecter la multiplication implicite (2π, 3(4+1), 2x…).
  const startsPrimary = () => {
    const t = peek()
    return t && (t.type === 'num' || t.type === 'id' || (t.type === 'op' && (t.value === '(' || t.value === '√')))
  }

  function expr() {
    let left = term()
    while (isOp('+') || isOp('-')) {
      const op = next().value
      const a = left
      const b = term()
      left = op === '+' ? (s) => a(s) + b(s) : (s) => a(s) - b(s)
    }
    return left
  }

  function term() {
    let left = unary()
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = next().value
        const a = left
        const b = unary()
        left =
          op === '*'
            ? (s) => a(s) * b(s)
            : (s) => {
                const d = b(s)
                if (d === 0 && !s.allowInfinity) throw new Error('Division par zéro')
                return a(s) / d
              }
      } else if (startsPrimary()) {
        const a = left
        const b = power()
        left = (s) => a(s) * b(s)
      } else {
        return left
      }
    }
  }

  function unary() {
    if (isOp('-')) {
      next()
      const a = unary()
      return (s) => -a(s)
    }
    if (isOp('+')) {
      next()
      return unary()
    }
    return power()
  }

  function power() {
    const base = postfix()
    if (isOp('^')) {
      next()
      const exp = unary()
      return (s) => base(s) ** exp(s)
    }
    return base
  }

  function postfix() {
    let value = primary()
    for (;;) {
      const a = value
      if (isOp('!')) value = (s) => factorial(a(s))
      else if (isOp('%')) value = (s) => a(s) / 100
      else if (isOp('²')) value = (s) => a(s) ** 2
      else if (isOp('³')) value = (s) => a(s) ** 3
      else return value
      next()
    }
  }

  function primary() {
    const t = next()
    if (!t) throw new Error('Expression incomplète')
    if (t.type === 'num') {
      const n = t.value
      return () => n
    }
    if (t.type === 'op' && t.value === '(') {
      const v = expr()
      expect(')')
      return v
    }
    if (t.type === 'op' && t.value === '√') {
      const a = unary()
      return (s) => Math.sqrt(a(s))
    }
    if (t.type === 'id') {
      const name = t.value
      if (variables.includes(name)) return (s) => s[name]
      if (name === 'ans') return (s) => s.ans ?? 0
      if (name in CONSTANTS) {
        const c = CONSTANTS[name]
        return () => c
      }
      if (name in FUNCTIONS) {
        if (!isOp('(')) throw new Error(`« ${name} » doit être suivi de parenthèses`)
        next()
        const arg = expr()
        expect(')')
        const fn = FUNCTIONS[name]
        return (s) => fn(arg(s), s.angle === 'deg')
      }
      throw new Error(`Nom inconnu « ${name} »`)
    }
    throw new Error(`Symbole inattendu « ${t.value} »`)
  }

  if (!tokens.length) throw new Error('Expression vide')
  const fn = expr()
  if (pos < tokens.length) throw new Error(`Symbole inattendu « ${tokens[pos].value} »`)
  return fn
}

/**
 * Évalue une expression. options.angle : 'deg' | 'rad' ; options.ans : résultat précédent.
 * Lève une Error (message en français) si l'expression est invalide.
 */
export function evaluate(input, { angle = 'deg', ans = 0 } = {}) {
  const result = compile(input)({ angle, ans })
  if (Number.isNaN(result)) throw new Error('Résultat indéfini')
  // Nettoie les erreurs d'arrondi flottant (sin(180°) → 1e-16).
  return Math.abs(result) < 1e-14 ? 0 : parseFloat(result.toPrecision(15))
}
