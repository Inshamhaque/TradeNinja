
````markdown
# 📈 Trading Backtest CLI

A lightweight CLI tool for **backtesting algorithmic trading strategies** using pure Node.js — built under **650 lines**, **no external libraries**, and **3-character variable constraints** for Code Olympics.

## ⚡ Features
- SMA, RSI, and MACD strategies  
- Key metrics: Return %, Sharpe Ratio, Max Drawdown, Win Rate  
- ASCII-based trade visualization  
- JSON/text output formats  

## 🚀 Quick Start
```
# Run directly
node bin/cli.js run demo.csv -s sma
# Or install globally
npm install -g .
backtest run demo.csv -s rsi
```

## 📂 CSV Format

```
Date,Close
2024-01-01,150.00
2024-01-02,152.50
```

## 🧠 Strategies

* **SMA** — Crossover of short/long averages
* **RSI** — Mean reversion between 30/70
* **MACD** — Momentum-based EMA signals

## 📊 Example Output

```
Strategy: SMA (10/30)
Return: +95.3% | Sharpe: 2.14 | Drawdown: -8.2%
Trades: 8 (5W / 3L)
```

## 🗂️ Structure

```
trading-backtest/
├── bin/cli.js
├── lib/
│   ├── indicators.js
│   ├── strategies.js
│   ├── engine.js
│   └── metrics.js
└── demo.csv
```

## 👤 Author

**Inshamul Haque**
Built for **Code Olympics Hackathon** 🏆
