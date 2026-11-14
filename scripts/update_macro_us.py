#!/usr/bin/env python3
"""Fetch public FRED CSV exports and publish dated US macro series.
No API key. Never replace last good data with incomplete results."""
import csv, io, json, pathlib, urllib.request
from datetime import datetime, timezone
SERIES = {
 "M2SL": ("US M2", "USD billions", 100),
 "WALCL": ("Fed assets", "USD millions", 30),
 "WTREGEN": ("Treasury General Account", "USD millions", 30),
 "RRPONTSYD": ("Overnight reverse repo", "USD billions", 14),
 "DGS2": ("US Treasury 2Y", "percent", 14),
 "DGS10": ("US Treasury 10Y", "percent", 14),
 "CPIAUCSL": ("US CPI", "index", 70),
 "PCEPI": ("US PCE price index", "index", 70),
 "DEXUSEU": ("USD per EUR", "USD/EUR", 14),
 "DTWEXBGS": ("Trade weighted broad USD index (not DXY)", "index", 14),
}
out = {"updatedAt": datetime.now(timezone.utc).isoformat(), "provider":"FRED graph CSV", "series":{}, "errors":{}, "units":{}}
for sid,(label,unit,max_age) in SERIES.items():
 try:
  url="https://fred.stlouisfed.org/graph/fredgraph.csv?id="+sid+"&cosd=2015-01-01"
  req=urllib.request.Request(url,headers={"User-Agent":"CrystalBallBTC-MacroData/1.0"})
  with urllib.request.urlopen(req,timeout=30) as response:
   body=response.read().decode("utf-8-sig")
  values=[]
  for row in csv.reader(io.StringIO(body)):
   if len(row)<2 or row[0].lower() in ("date","observation_date") or row[1] in ("","."): continue
   try: values.append([row[0],float(row[1])])
   except ValueError: continue
  if len(values)<20:raise ValueError("insufficient observations")
  age=(datetime.now(timezone.utc).date()-datetime.fromisoformat(values[-1][0]).date()).days
  if age>max_age:raise ValueError("stale "+str(age)+" days")
  out["series"][sid]=values
  out["units"][sid]={"label":label,"unit":unit,"lastDate":values[-1][0],"ageDays":age}
 except Exception as e:out["errors"][sid]=str(e)
required={"M2SL","WALCL","WTREGEN","DGS2","DGS10"}
if not required.issubset(out["series"]):raise SystemExit("Missing required fresh macro series: "+str(out["errors"]))
path=pathlib.Path("data/macro-us.json");path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(out,separators=(",",":"))+"\n",encoding="utf-8")
print("Saved",path,"with",len(out["series"]),"series",out["errors"])
