from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from seed_data import SAMPLE_PRODUCTS


# -----------------------------------------------------------------------------
# MongoDB setup
# -----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MIN = 60 * 24  # 1 day
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MIN),
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MIN * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
    }


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    name: str
    brand: str
    category: str
    sub_category: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    rating: float
    rating_count: int
    purchased_count: int
    stock: int
    image: str
    gallery: List[str] = []
    short_desc: str
    description: str
    specs: dict = {}


class ReviewInput(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime


class CartItemInput(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=20)


class OrderInput(BaseModel):
    shipping_name: str = Field(min_length=1, max_length=120)
    shipping_address: str = Field(min_length=1, max_length=300)
    shipping_city: str = Field(min_length=1, max_length=100)
    shipping_zip: str = Field(min_length=1, max_length=20)
    payment_method: Literal["card", "paypal", "transfer"] = "card"


# -----------------------------------------------------------------------------
# Auth dependency
# -----------------------------------------------------------------------------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
app = FastAPI(title="CompuMax API")
api = APIRouter(prefix="/api")

# CORS: allow specific frontend origin (required for cookies w/ credentials)
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
cors_origins = [
    frontend_url, 
    "http://localhost:3000",
    "https://compumax.vercel.app",
    "https://paginaweb-beryl.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Startup: indexes + seed
# -----------------------------------------------------------------------------
async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@compumax.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        if not verify_password(password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hash_password(password)}},
            )


async def seed_test_user():
    email = "test@compumax.com"
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password("test123"),
            "name": "Usuario de Prueba",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


async def seed_products():
    for p in SAMPLE_PRODUCTS:
        await db.products.update_one(
            {"slug": p["slug"]},
            {
                "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()},
                "$set": {k: v for k, v in p.items() if k != "slug"} | {"slug": p["slug"]},
            },
            upsert=True,
        )


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("id", unique=True)
    await db.reviews.create_index("product_id")
    await db.carts.create_index("user_id", unique=True)
    await db.orders.create_index("user_id")
    await db.login_attempts.create_index("identifier")

    await seed_admin()
    await seed_test_user()
    await seed_products()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# -----------------------------------------------------------------------------
# Auth endpoints
# -----------------------------------------------------------------------------
@api.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Este correo ya está registrado")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name.strip(),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_doc["id"], email)
    refresh = create_refresh_token(user_doc["id"])
    set_auth_cookies(response, access, refresh)
    return public_user(user_doc)


@api.post("/auth/login")
async def login(data: LoginInput, request: Request, response: Response):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("failures", 0) >= MAX_FAILED_ATTEMPTS:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Demasiados intentos, intenta más tarde")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        failures = (attempt.get("failures", 0) if attempt else 0) + 1
        lock = {}
        if failures >= MAX_FAILED_ATTEMPTS:
            lock = {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()}
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$set": {"identifier": identifier, "failures": failures, **lock}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    await db.login_attempts.delete_one({"identifier": identifier})
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return public_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# -----------------------------------------------------------------------------
# Products
# -----------------------------------------------------------------------------
SORT_MAP = {
    "most_purchased": [("purchased_count", -1)],
    "best_rated": [("rating", -1), ("rating_count", -1)],
    "worst_rated": [("rating", 1), ("rating_count", -1)],
    "price_asc": [("price", 1)],
    "price_desc": [("price", -1)],
    "newest": [("created_at", -1)],
}


@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "most_purchased",
    limit: int = Query(100, ge=1, le=200),
):
    q: dict = {}
    if category:
        q["category"] = category
    if sub_category:
        q["sub_category"] = sub_category
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"short_desc": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sub_category": {"$regex": search, "$options": "i"}},
        ]
    sort_spec = SORT_MAP.get(sort, SORT_MAP["most_purchased"])
    cursor = db.products.find(q, {"_id": 0}).sort(sort_spec).limit(limit)
    return await cursor.to_list(limit)


@api.get("/products/categories/stats")
async def category_stats():
    pipe = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    result = await db.products.aggregate(pipe).to_list(None)
    return {r["_id"]: r["count"] for r in result}


@api.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


# -----------------------------------------------------------------------------
# Reviews
# -----------------------------------------------------------------------------
@api.get("/products/{slug}/reviews")
async def list_reviews(slug: str):
    product = await db.products.find_one({"slug": slug}, {"id": 1, "_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    reviews = await db.reviews.find({"product_id": product["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return reviews


@api.post("/products/{slug}/reviews")
async def create_review(slug: str, data: ReviewInput, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"slug": slug}, {"id": 1, "_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    review = {
        "id": str(uuid.uuid4()),
        "product_id": product["id"],
        "user_id": user["id"],
        "user_name": user.get("name", "Usuario"),
        "rating": data.rating,
        "comment": data.comment.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)

    # Recalculate rating
    all_reviews = await db.reviews.find({"product_id": product["id"]}).to_list(None)
    total = len(all_reviews)
    avg = sum(r["rating"] for r in all_reviews) / total if total else 0
    await db.products.update_one(
        {"id": product["id"]},
        {"$set": {"rating": round(avg, 2), "rating_count": total}},
    )
    review.pop("_id", None)
    return review


# -----------------------------------------------------------------------------
# Cart
# -----------------------------------------------------------------------------
async def _hydrate_cart(cart_items: list) -> list:
    out = []
    for item in cart_items:
        prod = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if prod:
            out.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "product": prod,
            })
    return out


@api.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    items = cart.get("items", []) if cart else []
    return {"items": await _hydrate_cart(items)}


@api.post("/cart")
async def add_to_cart(data: CartItemInput, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0, "id": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cart = await db.carts.find_one({"user_id": user["id"]})
    items = cart.get("items", []) if cart else []
    found = False
    for it in items:
        if it["product_id"] == data.product_id:
            it["quantity"] = min(20, it["quantity"] + data.quantity)
            found = True
            break
    if not found:
        items.append({"product_id": data.product_id, "quantity": data.quantity})
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "items": items}},
        upsert=True,
    )
    return {"items": await _hydrate_cart(items)}


@api.put("/cart/{product_id}")
async def update_cart_item(product_id: str, data: CartItemInput, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    items = cart.get("items", []) if cart else []
    for it in items:
        if it["product_id"] == product_id:
            it["quantity"] = data.quantity
            break
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "items": items}},
        upsert=True,
    )
    return {"items": await _hydrate_cart(items)}


@api.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    items = [it for it in (cart.get("items", []) if cart else []) if it["product_id"] != product_id]
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "items": items}},
        upsert=True,
    )
    return {"items": await _hydrate_cart(items)}


@api.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "items": []}},
        upsert=True,
    )
    return {"items": []}


# -----------------------------------------------------------------------------
# Orders
# -----------------------------------------------------------------------------
@api.post("/orders")
async def place_order(data: OrderInput, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    items = cart.get("items", []) if cart else []
    if not items:
        raise HTTPException(status_code=400, detail="Tu carrito está vacío")

    hydrated = await _hydrate_cart(items)
    order_items = []
    subtotal = 0.0
    for it in hydrated:
        line_total = it["product"]["price"] * it["quantity"]
        subtotal += line_total
        order_items.append({
            "product_id": it["product_id"],
            "name": it["product"]["name"],
            "image": it["product"]["image"],
            "price": it["product"]["price"],
            "quantity": it["quantity"],
            "line_total": line_total,
        })
    shipping = 0.0 if subtotal > 500 else 25.0
    tax = round(subtotal * 0.08, 2)
    total = round(subtotal + shipping + tax, 2)

    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "shipping": shipping,
        "tax": tax,
        "total": total,
        "status": "confirmada",
        "shipping_info": {
            "name": data.shipping_name,
            "address": data.shipping_address,
            "city": data.shipping_city,
            "zip": data.shipping_zip,
        },
        "payment_method": data.payment_method,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)

    # Increase purchased_count
    for it in order_items:
        await db.products.update_one(
            {"id": it["product_id"]},
            {"$inc": {"purchased_count": it["quantity"]}},
        )

    # Clear cart
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
    order.pop("_id", None)
    return order


@api.get("/orders")
async def list_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@api.get("/")
async def root():
    return {"message": "CompuMax API"}


@app.get("/")
async def home():
    return {
        "status": "online",
        "message": "CompuMax Backend is running",
        "api_docs": "/docs",
        "api_root": "/api"
    }


app.include_router(api)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
