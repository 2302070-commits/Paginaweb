"""CompuMax API tests - auth, products, cart, orders, reviews"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

TEST_USER_EMAIL = "TEST_pytest@compumax.com"
TEST_USER_PASS = "pytest123"
TEST_USER_NAME = "Pytest User"

ADMIN_EMAIL = "admin@compumax.com"
ADMIN_PASS = "admin123"

SAMPLE_SLUG = "macbook-air-m3"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(session):
    """Session authenticated as test user"""
    # Register or login
    r = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASS,
        "name": TEST_USER_NAME,
    })
    if r.status_code == 409:
        r = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASS,
        })
    assert r.status_code == 200, f"Auth failed: {r.text}"
    return session


class TestAuth:
    def test_register_duplicate(self, session):
        # admin already exists
        r = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "admin123",
            "name": "Admin",
        })
        assert r.status_code == 409

    def test_login_success(self, session):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_login_bad_password(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpass",
        })
        assert r.status_code == 401

    def test_me_authenticated(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == TEST_USER_EMAIL

    def test_me_unauthenticated(self, session):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_logout(self, session):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        r = s.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200


class TestProducts:
    def test_list_all(self, session):
        r = session.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_filter_laptops(self, session):
        r = session.get(f"{BASE_URL}/api/products?category=laptops")
        assert r.status_code == 200
        data = r.json()
        assert all(p["category"] == "laptops" for p in data)

    def test_filter_components(self, session):
        r = session.get(f"{BASE_URL}/api/products?category=components")
        assert r.status_code == 200

    def test_sort_price_asc(self, session):
        r = session.get(f"{BASE_URL}/api/products?sort=price_asc&limit=10")
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices)

    def test_sort_price_desc(self, session):
        r = session.get(f"{BASE_URL}/api/products?sort=price_desc&limit=10")
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices, reverse=True)

    def test_search(self, session):
        r = session.get(f"{BASE_URL}/api/products?search=MacBook")
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0

    def test_product_detail(self, session):
        r = session.get(f"{BASE_URL}/api/products/{SAMPLE_SLUG}")
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] == SAMPLE_SLUG
        assert "_id" not in data

    def test_product_not_found(self, session):
        r = session.get(f"{BASE_URL}/api/products/nonexistent-slug-xyz")
        assert r.status_code == 404


class TestReviews:
    def test_list_reviews(self, session):
        r = session.get(f"{BASE_URL}/api/products/{SAMPLE_SLUG}/reviews")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_post_review_auth_required(self, session):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/products/{SAMPLE_SLUG}/reviews", json={"rating": 5, "comment": "Test"})
        assert r.status_code == 401

    def test_post_review(self, auth_session):
        r = auth_session.post(f"{BASE_URL}/api/products/{SAMPLE_SLUG}/reviews", json={
            "rating": 4,
            "comment": "Excelente producto de prueba",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["rating"] == 4
        assert "_id" not in data


class TestCart:
    def test_get_cart_unauth(self, session):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/cart")
        assert r.status_code == 401

    def test_get_cart(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/cart")
        assert r.status_code == 200
        assert "items" in r.json()

    def test_add_to_cart(self, auth_session):
        # Get a product id first
        products = auth_session.get(f"{BASE_URL}/api/products?category=laptops&limit=1").json()
        assert len(products) > 0
        pid = products[0]["id"]
        r = auth_session.post(f"{BASE_URL}/api/cart", json={"product_id": pid, "quantity": 1})
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(it["product_id"] == pid for it in items)

    def test_update_cart_item(self, auth_session):
        products = auth_session.get(f"{BASE_URL}/api/products?category=laptops&limit=1").json()
        pid = products[0]["id"]
        r = auth_session.put(f"{BASE_URL}/api/cart/{pid}", json={"product_id": pid, "quantity": 3})
        assert r.status_code == 200

    def test_remove_from_cart(self, auth_session):
        products = auth_session.get(f"{BASE_URL}/api/products?category=laptops&limit=1").json()
        pid = products[0]["id"]
        r = auth_session.delete(f"{BASE_URL}/api/cart/{pid}")
        assert r.status_code == 200


class TestOrders:
    def test_place_order(self, auth_session):
        # Add item to cart first
        products = auth_session.get(f"{BASE_URL}/api/products?limit=1").json()
        pid = products[0]["id"]
        auth_session.post(f"{BASE_URL}/api/cart", json={"product_id": pid, "quantity": 1})

        r = auth_session.post(f"{BASE_URL}/api/orders", json={
            "shipping_name": "Test User",
            "shipping_address": "Calle Falsa 123",
            "shipping_city": "Madrid",
            "shipping_zip": "28001",
            "payment_method": "card",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "confirmada"
        assert "_id" not in data
        assert len(data["items"]) > 0

    def test_cart_cleared_after_order(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/cart")
        assert r.status_code == 200
        assert r.json()["items"] == []

    def test_list_orders(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/orders")
        assert r.status_code == 200
        orders = r.json()
        assert len(orders) > 0

    def test_order_unauth(self):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/orders")
        assert r.status_code == 401
