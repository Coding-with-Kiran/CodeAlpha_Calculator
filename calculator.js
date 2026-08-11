const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' }
const OPS = ['+', '-', '*', '/']

export function renderCalculator() {
  document.querySelector('#app').innerHTML = `
    <section class="calculator" aria-label="Calculator">
      <header class="calc-header">
        <div class="calc-brand">
          <span class="brand-dot"></span>
          <span class="brand-name">Calculator</span>
        </div>
        <span class="brand-sub">CodeAlpha</span>
      </header>

      <div class="display" id="display">
        <div class="display-expr" id="expr" aria-live="polite"></div>
        <div class="display-result" id="result" aria-live="polite">0</div>
      </div>

      <div class="keypad" id="keypad">
        <button class="key fn" data-action="clear" aria-label="Clear">C</button>
        <button class="key fn" data-action="delete" aria-label="Delete">⌫</button>
        <button class="key op" data-op="%" data-action="op" aria-label="Percent">%</button>
        <button class="key op" data-op="/" data-action="op" aria-label="Divide">÷</button>

        <button class="key" data-num="7">7</button>
        <button class="key" data-num="8">8</button>
        <button class="key" data-num="9">9</button>
        <button class="key op" data-op="*" data-action="op" aria-label="Multiply">×</button>

        <button class="key" data-num="4">4</button>
        <button class="key" data-num="5">5</button>
        <button class="key" data-num="6">6</button>
        <button class="key op" data-op="-" data-action="op" aria-label="Subtract">−</button>

        <button class="key" data-num="1">1</button>
        <button class="key" data-num="2">2</button>
        <button class="key" data-num="3">3</button>
        <button class="key op" data-op="+" data-action="op" aria-label="Add">+</button>

        <button class="key zero" data-num="0">0</button>
        <button class="key" data-num="." aria-label="Decimal point">.</button>
        <button class="key equals" data-action="equals" aria-label="Equals">=</button>
      </div>

      <footer class="calc-footer">
        Built for <span>CodeAlpha Frontend Development</span> Internship
      </footer>
    </section>
  `
}

const state = {
  expr: '',
  result: '0',
  justEvaluated: false,
}

let exprEl, resultEl, displayEl

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return 'Error'
  if (!Number.isFinite(n)) return 'Error'
  const rounded = Math.round((n + Number.EPSILON) * 1e12) / 1e12
  let str = String(rounded)
  if (str.length > 14) str = rounded.toPrecision(12).replace(/\.?0+$/, '')
  return str
}

function compute(expr) {
  const tokens = expr.match(/(\d+\.?\d*|\.\d+|[+\-*/])/g)
  if (!tokens) return null
  try {
    const vals = []
    const ops = []
    const prec = { '*': 3, '/': 3, '+': 2, '-': 2 }
    const apply = (b, o, a) =>
      o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : b === 0 ? null : a / b

    for (const t of tokens) {
      if (OPS.includes(t)) {
        while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) {
          const b = vals.pop(), a = vals.pop(), o = ops.pop()
          const r = apply(b, o, a)
          if (r === null) return null
          vals.push(r)
        }
        ops.push(t)
      } else {
        vals.push(parseFloat(t))
      }
    }
    while (ops.length) {
      const b = vals.pop(), a = vals.pop(), o = ops.pop()
      const r = apply(b, o, a)
      if (r === null) return null
      vals.push(r)
    }
    return vals[0]
  } catch {
    return null
  }
}

function endsWithOp(s) {
  return OPS.includes(s.trim().slice(-1))
}

function prettyExpr(s) {
  return s.replace(/[+\-*/]/g, (m) => SYMBOLS[m])
}

function update(pulse = false) {
  exprEl.textContent = prettyExpr(state.expr)
  resultEl.textContent = state.result
  displayEl.classList.toggle('error', state.result === 'Error')
  if (pulse) {
    resultEl.classList.remove('pulse')
    void resultEl.offsetWidth
    resultEl.classList.add('pulse')
  }
  highlightOp()
}

function liveResult() {
  if (!state.expr) {
    state.result = '0'
    return
  }
  const expr = state.expr.replace(/(\d+\.?\d*|\.\d+)%/, (_, n) => String(parseFloat(n) / 100))
  const clean = endsWithOp(expr) ? expr.slice(0, -1).trim() : expr
  const val = compute(clean)
  state.result = val === null ? 'Error' : fmt(val)
}

function highlightOp() {
  document.querySelectorAll('.key.op.active-op').forEach((k) => k.classList.remove('active-op'))
  if (endsWithOp(state.expr)) {
    const last = state.expr.trim().slice(-1)
    const btn = document.querySelector(`.key[data-op="${last}"]`)
    if (btn) btn.classList.add('active-op')
  }
}

function inputNumber(n) {
  if (state.justEvaluated) {
    if (n === '.') {
      state.expr = ''
      state.result = '0'
    } else {
      state.expr = ''
    }
    state.justEvaluated = false
  }

  if (n === '.') {
    const lastNum = state.expr.split(/[+\-*/]/).pop()
    if (lastNum.includes('.')) return
    if (lastNum === '') {
      state.expr += '0.'
      liveResult()
      update()
      return
    }
  }

  if (state.expr === '' && n === '0' && state.result !== 'Error') {
    state.expr = '0'
    liveResult()
    update()
    return
  }

  const lastNum = state.expr.split(/[+\-*/]/).pop()
  if (lastNum === '0' && n !== '.' && state.expr !== '') {
    state.expr = state.expr.slice(0, -1) + n
    liveResult()
    update()
    return
  }

  state.expr += n
  liveResult()
  update()
}

function inputOp(op) {
  if (state.result === 'Error') {
    state.expr = ''
    state.result = '0'
  }

  if (state.expr === '') {
    if (op === '-') {
      state.expr = '-'
      update()
    }
    return
  }

  if (endsWithOp(state.expr)) {
    if (op === '-' && !state.expr.trim().endsWith('-')) {
      state.expr += op
    } else {
      state.expr = state.expr.trim().slice(0, -1) + op
    }
  } else {
    state.expr += op
  }
  state.justEvaluated = false
  liveResult()
  update()
}

function inputPercent() {
  if (state.result === 'Error' || state.expr === '') return
  const lastNum = state.expr.split(/[+\-*/]/).pop()
  if (!lastNum || OPS.includes(lastNum)) return
  const pct = parseFloat(lastNum) / 100
  state.expr = state.expr.slice(0, state.expr.length - lastNum.length) + fmt(pct)
  liveResult()
  update()
}

function evaluate() {
  if (!state.expr || state.result === 'Error') return
  const expr = state.expr.replace(/(\d+\.?\d*|\.\d+)%/, (_, n) => String(parseFloat(n) / 100))
  const clean = endsWithOp(expr) ? expr.slice(0, -1).trim() : expr
  const val = compute(clean)
  state.result = val === null ? 'Error' : fmt(val)
  state.expr = val === null ? state.expr : String(val)
  state.justEvaluated = true
  update(true)
}

function clearAll() {
  state.expr = ''
  state.result = '0'
  state.justEvaluated = false
  update()
}

function deleteLast() {
  if (state.justEvaluated || state.result === 'Error') {
    clearAll()
    return
  }
  state.expr = state.expr.slice(0, -1)
  liveResult()
  update()
}

function flashKey(selector) {
  const btn = document.querySelector(selector)
  if (!btn) return
  btn.classList.add('pressed')
  setTimeout(() => btn.classList.remove('pressed'), 110)
}

export function initCalculator() {
  exprEl = document.getElementById('expr')
  resultEl = document.getElementById('result')
  displayEl = document.getElementById('display')

  document.getElementById('keypad').addEventListener('click', (e) => {
    const btn = e.target.closest('.key')
    if (!btn) return
    if (btn.dataset.num !== undefined) inputNumber(btn.dataset.num)
    else if (btn.dataset.action === 'op') inputOp(btn.dataset.op)
    else if (btn.dataset.action === 'clear') clearAll()
    else if (btn.dataset.action === 'delete') deleteLast()
    else if (btn.dataset.action === 'equals') evaluate()
  })

  document.addEventListener('keydown', (e) => {
    const k = e.key
    if (k >= '0' && k <= '9') {
      flashKey(`.key[data-num="${k}"]`)
      inputNumber(k)
    } else if (k === '.') {
      flashKey('.key[data-num="."]')
      inputNumber('.')
    } else if (OPS.includes(k)) {
      e.preventDefault()
      flashKey(`.key[data-op="${k}"]`)
      inputOp(k)
    } else if (k === '%') {
      flashKey('.key[data-op="%"]')
      inputPercent()
    } else if (k === 'Enter' || k === '=') {
      e.preventDefault()
      flashKey('.key.equals')
      evaluate()
    } else if (k === 'Backspace') {
      flashKey('.key[data-action="delete"]')
      deleteLast()
    } else if (k === 'Escape' || k.toLowerCase() === 'c') {
      flashKey('.key[data-action="clear"]')
      clearAll()
    }
  })

  update()
}
