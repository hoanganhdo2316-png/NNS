import yfinance as yf

print("Downloading KC=F, RC=F with period=1d, interval=15m")
data = yf.download(tickers="KC=F RC=F", period="1d", interval="15m")
print(data)

kc = yf.Ticker("KC=F")
rc = yf.Ticker("RC=F")

print("\nHistory KC=F")
try:
    print(kc.history(period="1d", interval="15m"))
except Exception as e:
    print(e)
    
print("\nHistory RC=F")
try:
    print(rc.history(period="1d", interval="15m"))
except Exception as e:
    print(e)
