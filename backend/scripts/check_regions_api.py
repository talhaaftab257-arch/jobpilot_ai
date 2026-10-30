import httpx

base = "http://127.0.0.1:8000/api/v1"
for r in ["PK", "ASIA", "EU", "ARAB"]:
    d = httpx.get(f"{base}/jobs", params={"region": r, "limit": 20}, timeout=90).json()
    print(r, "count=", len(d))
    for j in d[:3]:
        print(" ", (j.get("title") or "")[:55], "|", j.get("location"), "|", j.get("region_code"))
