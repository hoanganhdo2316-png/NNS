import pymongo
from bson.objectid import ObjectId

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["agribot"]

updates = {
    "69bf73b4cb7490572d930aaf": {"name": "Công ty TNHH Bảo Anh", "address": "Tân Hà - Lâm Đồng"},
    "69bf73b4cb7490572d930ab0": {"name": "An coffee farm", "address": "Hoài Đức - Lâm Đồng"},
    "69bf73b4cb7490572d930ab1": {"name": "Công ty cà phê Như Tùng", "address": "Hoài Đức - Lâm Đồng"},
    "69bf73b4cb7490572d930ab2": {"name": "Đại lý Trung Bé", "address": "Hoài Đức - Lâm Đồng"},
    "69bf73b4cb7490572d930ab3": {"name": "Công ty TNHH MTV Nông Sản Sơn Định", "address": "Thôn 1B xã Eaktur, Đắk Lắk"},
    "69bf73b4cb7490572d930ae9": {"name": "Công Ty TNHH TM Và Nông Sản Giao Nga", "address": "Buôn Hồ - Đắk Lắk"},
    "69bf73b4cb7490572d930aea": {"name": "Đại lý Thọ Than", "address": "Liên Hà - Cư M'gar - Đắk Lắk"},
    "69bf73b4cb7490572d930ae7": {"name": "Thu mua nông sản Thu Nguyệt", "address": "Đắk Mil - Đắk Nông"}
}

for _id, data in updates.items():
    db.agents.update_one({"_id": ObjectId(_id)}, {"$set": {"name": data["name"], "address": data["address"], "loc": data["address"]}})

print("Cập nhật tiếng Việt có dấu thành công!")
