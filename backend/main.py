import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
VN_TZ = ZoneInfo('Asia/Ho_Chi_Minh')
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from pywebpush import webpush, WebPushException
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import traceback

# 1. Tải môi trường
load_dotenv()

app = FastAPI()

@app.on_event("startup")
async def startup_db_client():
    scheduler.start()

# 2. CẤU HÌNH CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Khởi tạo OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 4. Kết nối MongoDB
client_db = AsyncIOMotorClient("mongodb://localhost:27017")
db = client_db["agribot"]
users_col = db["users"]
chat_col = db["chat_history"]
agri_col = db["agri_data"]
stats_col = db["usage_stats"]

VAPID_PUBLIC_KEY = "BBnjqdVwXti2bEQsrrBsZAy_xYS4OR0oQnt-HvSm_Z8PIInaXzRlSlj7vwDwXxNWzXWOnAAmIPdCaMbsX1IqrwM"
VAPID_PRIVATE_KEY = "5UTljMfDeBNbWzfJNpsIITHnaA9JyyNibM9Sr53W9lE"
VAPID_CLAIMS = {"sub": "mailto:admin@nns.id.vn"}
scheduler = AsyncIOScheduler()

# 5. Auth config
SECRET_KEY = os.getenv("SECRET_KEY", "agribot-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 ngày
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

# 6. Models
class ChatRequest(BaseModel):
    user_message: str

class RegisterRequest(BaseModel):
    ho_ten: str
    so_dien_thoai: str
    password: str
    pin: str = ""
    dia_chi: dict = {}
    ngay_sinh: str = ""
    cccd: str = ""
    thon: str = "" ""

class AgriData(BaseModel):
    category: str
    title: str
    content: str
    region: str = "Lâm Đồng"

# 7. Helpers
def create_token(data: dict):
    expire = datetime.now(VN_TZ) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = await users_col.find_one({"so_dien_thoai": payload.get("sub")})
        if user and user.get("active") == False:
            raise HTTPException(status_code=403, detail="Tai khoan bi khoa")
        return user
    except JWTError:
        return None
async def update_stats():
    today = datetime.now(VN_TZ).strftime("%Y-%m-%d")
    await stats_col.update_one(
        {"date": today},
        {"$inc": {"total_messages": 1}},
        upsert=True
    )

# 8. Routes
@app.get("/")
async def root():
    return {"status": "Online", "service": "AgriBot API"}

# REGISTER
@app.post("/register")
async def register(req: RegisterRequest):
    if await users_col.find_one({"so_dien_thoai": req.so_dien_thoai}):
        raise HTTPException(status_code=400, detail="Số điện thoại đã tồn tại")
    await users_col.insert_one({
        "ho_ten": req.ho_ten,
        "so_dien_thoai": req.so_dien_thoai,
        "password_hash": pwd_context.hash(req.password),
        "dia_chi": req.dia_chi,
        "ngay_sinh": req.ngay_sinh,
        "cccd": req.cccd,
        "created_at": datetime.now(VN_TZ),
        "last_login": None,
        "pin_hash": pwd_context.hash(req.pin) if req.pin else ""
    })
    return {"message": "Đăng ký thành công!"}
# LOGIN
@app.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await users_col.find_one({"so_dien_thoai": form.username})
    if not user or not pwd_context.verify(form.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Sai số điện thoại hoặc mật khẩu")
    await users_col.update_one(
        {"so_dien_thoai": form.username},
        {"$set": {"last_login": datetime.now(VN_TZ)}}
    )
    token = create_token({"sub": form.username})
    return {"access_token": token, "token_type": "bearer", "ho_ten": user["ho_ten"]}
# CHAT - giữ nguyên endpoint /ask như cũ, thêm lưu DB
@app.post("/ask")
async def ask_ai(request: ChatRequest, current_user=Depends(get_current_user)):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Bạn là AgriBot - Trợ lý nông nghiệp Lâm Đồng."},
                {"role": "user", "content": request.user_message}
            ]
        )
        answer = response.choices[0].message.content

        # Lưu lịch sử chat vào MongoDB
        await chat_col.insert_one({
            "user_id": str(current_user["_id"]) if current_user else "anonymous",
            "username": current_user["username"] if current_user else "anonymous",
            "question": request.user_message,
            "answer": answer,
            "timestamp": datetime.now(VN_TZ)
        })

        # Cập nhật thống kê
        await update_stats()

        return {"answer": answer}
    except Exception as e:
        print(f"Lỗi OpenAI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# LỊCH SỬ CHAT
@app.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    chats = await chat_col.find(
        {"user_id": str(current_user["_id"])}
    ).sort("timestamp", -1).limit(50).to_list(50)
    return [{"question": c["question"], "answer": c["answer"],
             "time": c["timestamp"].strftime("%Y-%m-%d %H:%M")} for c in chats]

# THỐNG KÊ
@app.get("/stats")
async def get_stats():
    today = datetime.now(VN_TZ).strftime("%Y-%m-%d")
    stat = await stats_col.find_one({"date": today})
    total_users = await users_col.count_documents({})
    total_chats = await chat_col.count_documents({})
    return {
        "today_messages": stat["total_messages"] if stat else 0,
        "total_users": total_users,
        "total_chats": total_chats
    }

# DỮ LIỆU NÔNG NGHIỆP
@app.post("/agri-data")
async def add_agri_data(data: AgriData):
    await agri_col.insert_one({**data.dict(), "created_at": datetime.now(VN_TZ)})
    return {"message": "Đã thêm dữ liệu nông nghiệp"}

@app.get("/agri-data")
async def get_agri_data(category: str = None):
    query = {"category": category} if category else {}
    data = await agri_col.find(query).to_list(100)
    return [{"title": d["title"], "content": d["content"],
             "category": d["category"], "region": d["region"]} for d in data]




# Thêm vào main.py — endpoint tỷ giá Vietcombank
# Paste đoạn này vào cuối file main.py (trước if __name__ == '__main__')

import httpx
from xml.etree import ElementTree as ET

@app.get("/exchange-rate")
async def get_exchange_rate():
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get("https://open.er-api.com/v6/latest/USD")
        data = resp.json()
        vnd = data["rates"]["VND"]
        from datetime import datetime
        return {
            "usd_vnd": vnd,
            "updated_at": datetime.now().strftime("%H:%M %d/%m/%Y"),
            "source": "ExchangeRate-API"
        }
    except:
        return {"usd_vnd": 25450, "updated_at": "fallback", "source": "fallback"}

# ── THÊM VÀO CUỐI main.py (trước if __name__ == '__main__') ──
# pip install yfinance

import yfinance as yf
from functools import lru_cache
import time

# Cache giá 5 phút để tránh gọi quá nhiều
_coffee_cache = {"data": None, "ts": 0}

@app.get("/coffee-price")
async def get_coffee_price():
    global _coffee_cache
    now = time.time()

    # Trả cache nếu còn trong 5 phút
    if _coffee_cache["data"] and now - _coffee_cache["ts"] < 300:
        return _coffee_cache["data"]

    try:
        # KC=F = Arabica New York (USc/lb)
        # RC=F = Robusta London  (USD/tonne)
        kc = yf.Ticker("KC=F")
        rc = yf.Ticker("RC=F")

        kc_hist = kc.history(period="1d", interval="15m")
        rc_hist = rc.history(period="1d", interval="15m")

        # Fallback to daily data if 15m intraday is empty (e.g., outside market hours or delisted temporarily)
        if kc_hist.empty:
            kc_hist = kc.history(period="2d")
        if rc_hist.empty:
            rc_hist = rc.history(period="2d")

        def parse(hist, decimals=2):
            if hist.empty:
                return {"price": 0, "prev": 0, "change": 0, "pct": 0}
            closes = hist["Close"].dropna().tolist()
            curr  = round(closes[-1], decimals)
            if len(closes) > 1:
                prev = round(closes[-2], decimals)
            else:
                prev = curr
            chg   = round(curr - prev, decimals)
            pct   = round((chg / prev * 100), 2) if prev else 0
            return {"price": curr, "prev": prev, "change": chg, "pct": pct}

        result = {
            "arabica": {**parse(kc_hist, 2), "unit": "USc/lb",   "market": "New York · ICE", "symbol": "KC=F"},
            "robusta": {**parse(rc_hist, 0), "unit": "USD/t", "market": "London · ICE",   "symbol": "RC=F"},
            "updated_at": datetime.now().strftime("%H:%M %d/%m/%Y")
        }

        _coffee_cache = {"data": result, "ts": now}
        return result

    except Exception as e:
        # Trả fallback nếu lỗi
        return {
            "arabica": {"price": 295.2, "prev": 293.3, "change": 1.9,  "pct": 0.65, "unit": "USc/lb", "market": "New York · ICE", "symbol": "KC=F"},
            "robusta": {"price": 3747,  "prev": 3772,  "change": -25,  "pct": -0.66, "unit": "USD/t",  "market": "London · ICE",   "symbol": "RC=F"},
            "updated_at": "fallback"
        }

# AGENTS - lấy danh sách đại lý, sort theo khoảng cách nếu có tọa độ
import math

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@app.get("/agents")
async def get_agents(lat: float = None, lng: float = None, limit: int = 50):
    agents = await db["agents"].find({}, {"password_hash": 0, "pin_hash": 0}).to_list(200)
    for a in agents:
        a["_id"] = str(a["_id"])
    if lat and lng:
        for a in agents:
            a["distance"] = round(haversine(lat, lng, a["lat"], a["lng"]), 1)
        agents.sort(key=lambda x: x["distance"])
    else:
        agents.sort(key=lambda x: x["price"], reverse=True)
    return agents[:limit]






from bson import ObjectId

@app.get("/agents/{agent_id}")
async def get_agent_detail(agent_id: str):
    try:
        agent = await db["agents"].find_one({"_id": ObjectId(agent_id)}, {"password_hash": 0, "pin_hash": 0})
        if not agent:
            raise HTTPException(status_code=404, detail="Khong tim thay dai ly")
        agent["_id"] = str(agent["_id"])
        await db["agents"].update_one({"_id": ObjectId(agent_id)}, {"$inc": {"views": 1}})
        return agent
    except:
        raise HTTPException(status_code=400, detail="ID khong hop le")



# ── AGENT AUTH & MANAGEMENT ──────────────────────────────
from typing import Optional
from pydantic import BaseModel as BM

class AgentLoginRequest(BM):
    phone: str
    password: str

class AgentPriceUpdate(BM):
    price: int
    note: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None

class AgentProfileUpdate(BM):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    phone2: Optional[str] = None
    zalo: Optional[str] = None
    email: Optional[str] = None
    facebook: Optional[str] = None

class Product(BM):
    name: str
    category: str
    price: int
    unit: str
    description: str = ""

async def get_current_agent(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Chua dang nhap")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone = payload.get("sub")
        if payload.get("type") != "agent":
            raise HTTPException(status_code=403, detail="Khong phai tai khoan dai ly")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token khong hop le")
    agent = await db["agents"].find_one({"phone": phone})
    if not agent:
        raise HTTPException(status_code=404, detail="Khong tim thay dai ly")
    if agent.get("active") == False:
        raise HTTPException(status_code=403, detail="Tai khoan bi khoa. Lien he 0963025264 de mo lai")
    agent["_id"] = str(agent["_id"])
    return agent

class PushSubscriptionReq(BaseModel):
    endpoint: str
    keys: dict

@app.post("/agent/push-subscribe")
async def agent_push_subscribe(sub: PushSubscriptionReq, user=Depends(get_current_agent)):
    from bson import ObjectId
    await db["agents"].update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"push_subscription": sub.dict()}}
    )
    return {"message": "Subscribed successfully"}

async def send_push_to_agents(message: str):
    import json as _json
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    payload = _json.dumps({"title": "NNS Thông báo", "body": message, "url": "/agent"})
    agents_list = await db["agents"].find({"push_subscription": {"$exists": True}, "active": True}).to_list(500)
    def do_push(sub, name):
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": "mailto:admin@nns.id.vn"}
            )
            print(f"Push OK for {name}")
        except WebPushException as e:
            print(f"Push failed for {name}: {e}")
            print(f"Response body:{e.response.text if hasattr(e, 'response') and e.response else ''}")
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor() as pool:
        tasks = [loop.run_in_executor(pool, do_push, a["push_subscription"], a.get("name","")) for a in agents_list]
        await asyncio.gather(*tasks)

@app.post("/agent/login")
async def agent_login(req: AgentLoginRequest):
    agent = await db["agents"].find_one({"phone": req.phone})
    if not agent:
        raise HTTPException(status_code=404, detail="So dien thoai khong ton tai")
    if agent.get("active") == False:
        raise HTTPException(status_code=403, detail="Tai khoan bi khoa. Lien he 0963025264 de mo lai")
    if not pwd_context.verify(req.password, agent.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Mat khau khong dung")
    token = create_token({"sub": req.phone, "type": "agent"})
    return {"access_token": token, "token_type": "bearer", "name": agent["name"]}

@app.post("/agent/register")
async def agent_register(req: AgentLoginRequest):
    agent = await db["agents"].find_one({"phone": req.phone})
    if not agent:
        raise HTTPException(status_code=404, detail="SĐT chua duoc dang ky trong he thong")
    if agent.get("password_hash"):
        raise HTTPException(status_code=400, detail="Tai khoan da duoc kich hoat")
    hashed = pwd_context.hash(req.password)
    await db["agents"].update_one({"phone": req.phone}, {"$set": {"password_hash": hashed}})
    token = create_token({"sub": req.phone, "type": "agent"})
    return {"access_token": token, "token_type": "bearer", "name": agent["name"]}

@app.get("/agent/me")
async def agent_me(agent=Depends(get_current_agent)):
    return agent

@app.put("/agent/price")
async def agent_update_price(req: AgentPriceUpdate, agent=Depends(get_current_agent)):
    now = datetime.now(VN_TZ)
    history_entry = {"price": req.price, "note": req.note, "at": now}
    await db["agents"].update_one(
        {"_id": ObjectId(agent["_id"])},
        {
            "$set": {"price": req.price, "updated_at": now},
            "$push": {"price_history": {"$each": [history_entry], "$slice": -30}}
        }
    )
    loc_str = f" | Tọa độ: {req.lat}, {req.lng}" if req.lat and req.lng else ""
    await db["agent_logs"].insert_one({
        "agent_id": agent["_id"],
        "agent_name": agent.get("name", ""),
        "action": "update_price",
        "detail": f"Cập nhật giá: {req.price:,}đ/kg" + (f" — {req.note}" if req.note else "") + loc_str,
        "lat": req.lat,
        "lng": req.lng,
        "at": now
    })
    return {"ok": True}

@app.put("/agent/profile")
async def agent_update_profile(req: AgentProfileUpdate, agent=Depends(get_current_agent)):
    update = {k: v for k, v in req.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Khong co gi de cap nhat")
    update["updated_at"] = datetime.now(VN_TZ)
    await db["agents"].update_one({"_id": ObjectId(agent["_id"])}, {"$set": update})
    return {"ok": True}

@app.post("/agent/products")
async def agent_add_product(product: Product, agent=Depends(get_current_agent)):
    p = product.dict()
    p["id"] = str(ObjectId())
    p["created_at"] = datetime.now(VN_TZ)
    await db["agents"].update_one(
        {"_id": ObjectId(agent["_id"])},
        {"$push": {"products": p}}
    )
    await db["agent_logs"].insert_one({
        "agent_id": agent["_id"],
        "agent_name": agent.get("name", ""),
        "action": "add_product",
        "detail": f"Thêm sản phẩm: {product.name} — {product.price:,}đ/{product.unit}",
        "at": datetime.now(VN_TZ)
    })
    return {"ok": True, "id": p["id"]}

@app.delete("/agent/products/{product_id}")
async def agent_delete_product(product_id: str, agent=Depends(get_current_agent)):
    # Lấy tên sản phẩm trước khi xóa
    agent_doc = await db["agents"].find_one({"_id": ObjectId(agent["_id"])})
    prod_name = next((p["name"] for p in (agent_doc.get("products") or []) if p["id"] == product_id), product_id)
    await db["agents"].update_one(
        {"_id": ObjectId(agent["_id"])},
        {"$pull": {"products": {"id": product_id}}}
    )
    await db["agent_logs"].insert_one({
        "agent_id": agent["_id"],
        "agent_name": agent.get("name", ""),
        "action": "delete_product",
        "detail": f"Xóa sản phẩm: {prod_name}",
        "at": datetime.now(VN_TZ)
    })
    return {"ok": True}


@app.post("/agent/set-pin")
async def agent_set_pin(req: dict, agent=Depends(get_current_agent)):
    pin = req.get("pin", "")
    if len(str(pin)) != 6:
        raise HTTPException(status_code=400, detail="PIN phai la 6 so")
    pin_hash = pwd_context.hash(str(pin))
    from bson import ObjectId
    await db["agents"].update_one({"_id": ObjectId(agent["_id"])}, {"$set": {"pin_hash": pin_hash}})
    return {"ok": True}

@app.post("/agent/verify-pin")
async def agent_verify_pin(req: dict, agent=Depends(get_current_agent)):
    pin = req.get("pin", "")
    pin_hash = agent.get("pin_hash", "")
    if not pin_hash:
        raise HTTPException(status_code=400, detail="Chua cai PIN")
    if not pwd_context.verify(str(pin), pin_hash):
        raise HTTPException(status_code=401, detail="PIN khong dung")
    return {"ok": True}


# ── ADMIN ──────────────────────────────────────────────
import hashlib
from datetime import datetime

ADMIN_PASSWORD_HASH = hashlib.sha256("admin@nns2026".encode()).hexdigest()

class AdminLoginRequest(BM):
    password: str

class AddAgentRequest(BM):
    name: str
    address: str
    phone: str
    phone2: str = ""
    zalo: str = ""
    email: str = ""
    facebook: str = ""
    lat: float
    lng: float
    loc: str = "Lam Dong"

class AdUpdateRequest(BM):
    banner_title: str = ""
    banner_body: str = ""
    popup_title: str = ""
    popup_body: str = ""
    popup_enabled: bool = False

def verify_admin(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Chua dang nhap")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "admin":
            raise HTTPException(status_code=403, detail="Khong phai admin")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token khong hop le")
    return payload

@app.post("/admin/login")
async def admin_login(req: AdminLoginRequest):
    hashed = hashlib.sha256(req.password.encode()).hexdigest()
    if hashed != ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=401, detail="Mat khau khong dung")
    token = create_token({"sub": "admin", "type": "admin"})
    return {"access_token": token, "token_type": "bearer"}

class ScheduleNotificationReq(BaseModel):
    message: str
    send_at: str

@app.post("/admin/notifications/schedule")
async def schedule_agent_notification(req: ScheduleNotificationReq, admin=Depends(verify_admin)):
    try:
        from zoneinfo import ZoneInfo
        VN = ZoneInfo("Asia/Ho_Chi_Minh")
        # Lưu thông báo vào DB để agent polling
        await db["announcements"].insert_one({
            "type": "announcement",
            "message": req.message,
            "send_at": req.send_at,
            "read_by": [],
            "at": datetime.now(VN)
        })
        # Thử schedule Web Push nếu có
        try:
            run_date = datetime.fromisoformat(req.send_at.replace("Z", "+00:00"))
            scheduler.add_job(send_push_to_agents, "date", run_date=run_date, args=[req.message])
        except:
            pass
        return {"ok": True, "status": "Scheduled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/agents")
async def admin_get_agents(admin=Depends(verify_admin)):
    agents = await db["agents"].find({}, {"password_hash": 0, "pin_hash": 0}).to_list(500)
    for a in agents:
        a["_id"] = str(a["_id"])
    return agents

@app.post("/admin/agents")
async def admin_add_agent(req: AddAgentRequest, admin=Depends(verify_admin)):
    now = datetime.now(VN_TZ)
    agent = req.dict()
    agent.update({"active": True, "verified": False, "price": 0, "change": 0,
                  "rank": 0, "views": 0, "price_history": [], "products": [],
                  "created_at": now, "updated_at": now})
    result = await db["agents"].insert_one(agent)
    return {"ok": True, "id": str(result.inserted_id)}

@app.put("/admin/agents/{agent_id}/lock")
async def admin_lock_agent(agent_id: str, admin=Depends(verify_admin)):
    agent = await db["agents"].find_one({"_id": ObjectId(agent_id)})
    if not agent:
        raise HTTPException(status_code=404, detail="Khong tim thay")
    new_status = not agent.get("active", True)
    await db["agents"].update_one({"_id": ObjectId(agent_id)}, {"$set": {"active": new_status}})
    return {"ok": True, "active": new_status}

@app.put("/admin/agents/{agent_id}/price")
async def admin_update_agent_price(agent_id: str, req: AgentPriceUpdate, admin=Depends(verify_admin)):
    from datetime import datetime
    now = datetime.now(VN_TZ)
    history_entry = {"price": req.price, "note": req.note, "at": now}
    await db["agents"].update_one(
        {"_id": ObjectId(agent_id)},
        {
            "$set": {"price": req.price, "updated_at": now},
            "$push": {"price_history": {"$each": [history_entry], "$slice": -30}}
        }
    )
    loc_str = f" | Tọa độ: {req.lat}, {req.lng}" if req.lat and req.lng else ""
    await db["agent_logs"].insert_one({
        "agent_id": agent_id,
        "agent_name": "Admin",
        "action": "admin_update_price",
        "detail": f"Cập nhật giá: {req.price:,}đ/kg" + (f" — {req.note}" if req.note else "") + loc_str,
        "lat": req.lat,
        "lng": req.lng,
        "at": now
    })
    return {"ok": True}

@app.get("/admin/logs")
async def admin_get_logs(agent_id: str = None, admin=Depends(verify_admin)):
    query = {"agent_id": agent_id} if agent_id else {}
    logs = await db["agent_logs"].find(query).sort("at", -1).to_list(500)
    for l in logs:
        l["_id"] = str(l["_id"])
    return logs

@app.get("/admin/users")
async def admin_get_users(admin=Depends(verify_admin)):
    users = await db["users"].find({}, {"password": 0}).to_list(500)
    for u in users:
        u["_id"] = str(u["_id"])
    return users

@app.put("/admin/users/{user_id}/lock")
async def admin_lock_user(user_id: str, admin=Depends(verify_admin)):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Khong tim thay")
    new_status = not user.get("active", True)
    await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": {"active": new_status}})
    return {"ok": True, "active": new_status}

@app.get("/ads")
async def get_ads_public():
    ad = await db["ads"].find_one({"_id": "main"})
    if not ad:
        return {"banner_title": "Phân bón Đầu Trâu", "banner_body": "Giảm 15% đơn từ 1 tấn", "popup_title": "", "popup_body": "", "popup_enabled": False}
    ad.pop("_id", None)
    return ad

@app.get("/admin/ads")
async def admin_get_ads(admin=Depends(verify_admin)):
    ad = await db["ads"].find_one({"_id": "main"})
    if not ad:
        return {"banner_title": "Phân bón Đầu Trâu", "banner_body": "Giảm 15% đơn từ 1 tấn", "popup_title": "", "popup_body": "", "popup_enabled": False}
    ad.pop("_id", None)
    return ad

@app.put("/admin/ads")
async def admin_update_ads(req: AdUpdateRequest, admin=Depends(verify_admin)):
    await db["ads"].update_one({"_id": "main"}, {"$set": req.dict()}, upsert=True)
    return {"ok": True}

@app.get("/admin/traffic")
async def admin_get_traffic(admin=Depends(verify_admin)):
    pipeline = [
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d %H:00", "date": "$at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
        {"$limit": 48}
    ]
    data = await db["traffic"].aggregate(pipeline).to_list(48)
    return data

@app.post("/track")
async def track_visit():
    await db["traffic"].insert_one({"at": datetime.now(VN_TZ)})
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# ── AGENT LOGS ──────────────────────────────────────────
@app.get("/agent/logs")
async def agent_get_logs(agent=Depends(get_current_agent)):
    logs = await db["agent_logs"].find(
        {"agent_id": agent["_id"]}
    ).sort("at", -1).to_list(100)
    for l in logs:
        l["_id"] = str(l["_id"])
    return logs

# ── NOTIFICATIONS & UNLOCK REQUEST ──────────────────────
@app.post("/unlock-request")
async def unlock_request(req: dict, current_user=Depends(get_current_user)):
    phone = req.get("phone", "")
    reason = req.get("reason", "")
    await db["notifications"].insert_one({
        "type": "unlock_request",
        "phone": phone,
        "reason": reason,
        "read": False,
        "at": datetime.now(VN_TZ)
    })
    return {"ok": True}

@app.get("/admin/notifications")
async def admin_get_notifications(admin=Depends(verify_admin)):
    nots = await db["notifications"].find({}).sort("at", -1).to_list(100)
    for n in nots:
        n["_id"] = str(n["_id"])
    return nots

@app.put("/admin/notifications/{nid}/read")
async def admin_read_notification(nid: str, admin=Depends(verify_admin)):
    await db["notifications"].update_one({"_id": ObjectId(nid)}, {"$set": {"read": True}})
    return {"ok": True}

@app.put("/admin/notifications/{nid}/approve")
async def admin_approve_unlock(nid: str, admin=Depends(verify_admin)):
    noti = await db["notifications"].find_one({"_id": ObjectId(nid)})
    if noti and noti.get("phone"):
        await users_col.update_one({"so_dien_thoai": noti["phone"]}, {"$set": {"active": True}})
    await db["notifications"].update_one({"_id": ObjectId(nid)}, {"$set": {"read": True, "approved": True}})
    return {"ok": True}

# ── FOLLOW / UNFOLLOW ──────────────────────────────────
@app.post("/agents/{agent_id}/follow")
async def follow_agent(agent_id: str, current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Chua dang nhap")
    phone = current_user.get("so_dien_thoai")
    agent = await db["agents"].find_one({"_id": ObjectId(agent_id)})
    if not agent:
        raise HTTPException(status_code=404, detail="Khong tim thay dai ly")
    followers = agent.get("followers", [])
    if phone in followers:
        await db["agents"].update_one({"_id": ObjectId(agent_id)}, {"$pull": {"followers": phone}})
        return {"ok": True, "following": False, "followers": len(followers) - 1}
    else:
        await db["agents"].update_one({"_id": ObjectId(agent_id)}, {"$addToSet": {"followers": phone}})
        return {"ok": True, "following": True, "followers": len(followers) + 1}

@app.get("/agents/{agent_id}/follow-status")
async def follow_status(agent_id: str, current_user=Depends(get_current_user)):
    if not current_user:
        return {"following": False, "followers": 0}
    phone = current_user.get("so_dien_thoai")
    agent = await db["agents"].find_one({"_id": ObjectId(agent_id)}, {"followers": 1})
    if not agent:
        return {"following": False, "followers": 0}
    followers = agent.get("followers", [])
    return {"following": phone in followers, "followers": len(followers)}

# ── AGENT NOTIFICATIONS (thông báo từ admin) ──
@app.get("/agent/announcements")
async def agent_get_announcements(agent=Depends(get_current_agent)):
    # Lấy thông báo dạng broadcast từ admin (type=announcement)
    nots = await db["announcements"].find({}).sort("at", -1).to_list(20)
    for n in nots:
        n["_id"] = str(n["_id"])
    return nots

# ── CATALOG (Admin quản lý sản phẩm toàn hệ thống) ──────
class CatalogProduct(BaseModel):
    name: str
    category: str
    price: int
    unit: str
    description: str = ""
    image_url: str = ""

@app.get("/catalog")
async def get_catalog():
    products = await db["catalog"].find({}).to_list(200)
    for p in products:
        p["_id"] = str(p["_id"])
    return products

@app.post("/admin/catalog")
async def admin_add_catalog(product: CatalogProduct, admin=Depends(verify_admin)):
    p = product.dict()
    p["id"] = str(ObjectId())
    p["created_at"] = datetime.now(VN_TZ)
    await db["catalog"].insert_one(p)
    return {"ok": True, "id": p["id"]}

@app.delete("/admin/catalog/{product_id}")
async def admin_delete_catalog(product_id: str, admin=Depends(verify_admin)):
    await db["catalog"].delete_one({"id": product_id})
    return {"ok": True}

@app.post("/agent/catalog/{product_id}/add")
async def agent_add_catalog_product(product_id: str, agent=Depends(get_current_agent)):
    product = await db["catalog"].find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    product.pop("_id", None)
    existing = await db["agents"].find_one({"_id": ObjectId(agent["_id"]), "products.id": product_id})
    if existing:
        raise HTTPException(status_code=400, detail="Sản phẩm đã có trong danh sách")
    await db["agents"].update_one(
        {"_id": ObjectId(agent["_id"])},
        {"$push": {"products": product}}
    )
    return {"ok": True}

@app.delete("/agent/catalog/{product_id}/remove")
async def agent_remove_catalog_product(product_id: str, agent=Depends(get_current_agent)):
    await db["agents"].update_one(
        {"_id": ObjectId(agent["_id"])},
        {"$pull": {"products": {"id": product_id}}}
    )
    return {"ok": True}

# ── UPLOAD ẢNH SẢN PHẨM (Admin) ──────────────────────────
from fastapi import UploadFile, File
import base64, uuid

@app.post("/admin/catalog/upload-image")
async def admin_upload_catalog_image(file: UploadFile = File(...), admin=Depends(verify_admin)):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg","jpeg","png","webp"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ jpg, png, webp")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File quá lớn (tối đa 5MB)")
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = "/root/NNS/frontend/dist/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    with open(f"{upload_dir}/{filename}", "wb") as f:
        f.write(data)
    return {"url": f"https://nns.id.vn/uploads/{filename}"}
