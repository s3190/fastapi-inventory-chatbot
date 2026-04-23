from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from openai import OpenAI
import os

from models import Product, ChatRequest, ChatResponse
from database_config import SessionLocal, engine
import database_models


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
database_models.Base.metadata.create_all(bind=engine)


@app.get("/")
def greet():
    return {"message": "Welcome to Susmitha Demo"}


products = [
    Product(id=1, name="phone", description="budget friendly", price=99, quantity=10),
    Product(id=2, name="laptop", description="gaming laptop", price=999, quantity=6),
    Product(id=3, name="headphones", description="noise cancelling", price=199, quantity=15),
    Product(id=4, name="keyboard", description="mechanical keyboard", price=120, quantity=8),
    Product(id=5, name="mouse", description="wireless mouse", price=40, quantity=20),
    Product(id=6, name="monitor", description="4K display", price=350, quantity=5),
    Product(id=7, name="tablet", description="lightweight tablet", price=300, quantity=12),
    Product(id=8, name="smartwatch", description="fitness tracking", price=150, quantity=18),
]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    db = SessionLocal()
    try:
        count = db.query(database_models.Product).count()
        if count == 0:
            for product in products:
                db.add(database_models.Product(**product.model_dump()))
            db.commit()
    finally:
        db.close()


init_db()


@app.get("/products")
def get_all_products(db: Session = Depends(get_db)):
    db_products = db.query(database_models.Product).all()
    return db_products


@app.get("/products/{id}")
def get_product_by_id(id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product:
        return db_product
    return {"message": "product not found"}


@app.post("/products")
def add_product(product: Product, db: Session = Depends(get_db)):
    db_product = database_models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.put("/products/{id}")
def update_product(id: int, product: Product, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()

    if db_product:
        db_product.name = product.name
        db_product.description = product.description
        db_product.price = product.price
        db_product.quantity = product.quantity
        db.commit()
        db.refresh(db_product)
        return db_product

    return {"message": "product not found"}


@app.delete("/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()

    if db_product:
        db.delete(db_product)
        db.commit()
        return {"message": "product deleted successfully"}

    return {"message": "product not found"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_message = request.message.strip()

    products = db.query(database_models.Product).all()

    if not products:
        return {"reply": "No products are available in the inventory right now."}

    product_context = "\n\n".join(
        [
            f"""Product ID: {p.id}
Name: {p.name}
Description: {p.description}
Price: ${p.price}
Quantity: {p.quantity}"""
            for p in products
        ]
    )

    system_prompt = f"""
You are a smart inventory assistant for a product management application.

Your job:
- Answer user questions only using the inventory data provided below.
- Help with prices, stock, comparisons, affordable items, expensive items, low stock, high stock, and product suggestions.
- If the user asks for recommendations, infer from product description, price, and quantity.
- If the user asks to compare products, compare them clearly.
- If the user asks unrelated questions, politely say that you only help with inventory and products.
- Keep answers natural, clear, and short.
- Do not make up products that are not in the data.

Inventory data:
{product_context}
"""

    try:
        conversation = [{"role": "system", "content": system_prompt}]

        for msg in request.history:
            conversation.append(
                {"role": msg.role, "content": msg.content}
            )

        conversation.append({"role": "user", "content": user_message})

        response = client.responses.create(
            model="gpt-5.4",
            input=conversation
        )

        return {"reply": response.output_text}

    except Exception:

        lower_msg = user_message.lower()

        # Cheapest product
        if "cheapest" in lower_msg or "lowest price" in lower_msg:
            cheapest = min(products, key=lambda p: p.price)
            return {"reply": f"The cheapest product is {cheapest.name} at ${cheapest.price}."}

        # Most expensive product
        if "expensive" in lower_msg or "highest price" in lower_msg:
            expensive = max(products, key=lambda p: p.price)
            return {"reply": f"The most expensive product is {expensive.name} at ${expensive.price}."}

        # Low stock
        if "low stock" in lower_msg or "least stock" in lower_msg:
            low = min(products, key=lambda p: p.quantity)
            return {"reply": f"{low.name} has the lowest stock with {low.quantity} items."}

        # Price lookup
        if "price" in lower_msg:
            for p in products:
                if p.name.lower() in lower_msg:
                    return {"reply": f"The price of {p.name} is ${p.price}."}

        # Stock lookup
        if "stock" in lower_msg or "quantity" in lower_msg:
            for p in products:
                if p.name.lower() in lower_msg:
                    return {"reply": f"{p.name} has {p.quantity} items in stock."}

        # Show all products
        if "all products" in lower_msg or "show products" in lower_msg:
            names = [p.name for p in products]
            return {"reply": "Available products are: " + ", ".join(names)}

        return {"reply": "AI is temporarily unavailable, but I can still help with basic inventory queries."}