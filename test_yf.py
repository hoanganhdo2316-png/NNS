import yfinance as yf

# KC=F = Arabica, RC=F = Robusta (often RC=F doesn't have 15m data or something? Let's check)
kc = yf.Ticker("KC=F")
rc = yf.Ticker("RC=F")

kc_hist = kc.history(period="1d", interval="15m")
print("KC=F")
print(kc_hist)

rc_hist = rc.history(period="1d", interval="15m")
print("\nRC=F")
print(rc_hist)
