import pymongo
import re

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["agribot"]

agents = list(db.agents.find({}))
count = 0

for a in agents:
    raw = a.get("phone", "")
    if not isinstance(raw, str):
        raw = str(raw)
        
    # Extract all sequences of digits
    digits = "".join(re.findall(r"\d+", raw))
    
    # If the text originally had a format like `0975 010 499 & 0903 970 356`, `digits` is `09750104990903970356`
    # It's better to split by non-digits
    parts = re.split(r"\D+", raw)
    
    # Try to extract the first valid phone number
    valid_phones = []
    for p in parts:
        if not p: continue
        if len(p) >= 9:
            # If starts with 0, fine, else add 0
            if p.startswith("0"):
                valid_phones.append(p)
            else:
                valid_phones.append("0" + p)
        # Handle cases where user typed spaces: "0975" "010" "499" -> "0975010499"
    
    # Wait, splitting by non-digits breaks spaces!
    # Let's extract digits, and if length is 10, perfect.
    # If >10, maybe it's 2 phones.
    
    # A better approach
    # Find all phones looking like 0xxxxxxxxx or 9xxxxxxx with spaces
    # regex to find phone numbers with optional spaces/dots/dashes
    pattern = r'(?:\b0|\b[1-9])(?:\s*[\d\.\-]){8,10}\b'
    matches = re.findall(pattern, raw)
    
    new_phone = ""
    new_phone2 = ""
    
    if matches:
        cleaned = [re.sub(r"\D", "", m) for m in matches]
        final = []
        for c in cleaned:
            if c.startswith("0"): final.append(c)
            else: final.append("0" + c)
            
        if len(final) > 0:
            new_phone = final[0]
        if len(final) > 1:
            new_phone2 = final[1]
    else:
        # Fallback: just remove non-digits
        v = re.sub(r"\D", "", raw)
        if len(v) == 9 and not v.startswith("0"):
            v = "0" + v
        if len(v) > 20: 
            new_phone = v[:10]
            new_phone2 = v[10:20]
        elif len(v) >= 9:
            new_phone = v[:10] if len(v) > 10 else v
        else:
            new_phone = v
            
    # Sometimes it's totally empty
    
    update = {"phone": new_phone}
    if new_phone2:
        update["phone2"] = new_phone2
        
    db.agents.update_one({"_id": a["_id"]}, {"$set": update})
    count += 1
    print(f"[{a.get('name')}] '{raw}' -> {new_phone} | {new_phone2}")

print(f"Done updating {count} agents")
