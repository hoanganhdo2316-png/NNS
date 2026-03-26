import pymongo
from bson.objectid import ObjectId

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["agribot"]

agents = list(db.agents.find({}, {"name": 1, "address": 1}))
for a in agents:
    print(f"{a['_id']} | {a.get('name', '')} | {a.get('address', '')}")
