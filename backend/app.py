# backend/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import requests
import os
from datetime import datetime, timedelta
import hashlib

app = Flask(__name__)

# Config
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{os.environ['MYSQL_USER']}:{os.environ['MYSQL_PASSWORD']}@{os.environ['MYSQL_HOST']}/{os.environ['MYSQL_DB']}"
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-me'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# ========== DATABASE MODELS ==========
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(100))
    image_url = db.Column(db.String(500))

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    total = db.Column(db.Float)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ========== API ROUTES ==========
@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'backend'})

# Auth
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email exists'}), 400
    
    hashed = hashlib.sha256(data['password'].encode()).hexdigest()
    user = User(email=data['email'], password=hashed, name=data.get('name', ''))
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'user_id': user.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    hashed = hashlib.sha256(data['password'].encode()).hexdigest()
    if user.password != hashed:
        return jsonify({'error': 'Wrong password'}), 401
    
    token = create_access_token(identity=user.id, expires_delta=timedelta(days=1))
    return jsonify({'token': token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}})

# Products
@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'stock': p.stock,
        'category': p.category,
        'image_url': p.image_url
    } for p in products])

@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'stock': product.stock
    })

# Orders
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.json
    
    # Simple order creation
    order_num = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{user_id}"
    order = Order(
        order_number=order_num,
        user_id=user_id,
        total=data['total'],
        status='pending'
    )
    db.session.add(order)
    db.session.commit()
    
    return jsonify({'order_id': order.id, 'order_number': order_num, 'status': 'pending'})

@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    orders = Order.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': o.id,
        'order_number': o.order_number,
        'total': o.total,
        'status': o.status,
        'created_at': o.created_at.isoformat()
    } for o in orders])

# ========== AI CHATBOT with TinyLlama ==========
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    
    # Call Ollama
    try:
        ollama_url = f"{os.environ.get('OLLAMA_URL', 'http://ollama:11434')}/api/generate"
        
        prompt = f"""You are a helpful shopping assistant. Answer briefly and helpfully.
User question: {user_message}
Assistant:"""
        
        response = requests.post(ollama_url, json={
            "model": "tinyllama",
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.7, "max_tokens": 150}
        }, timeout=30)
        
        if response.status_code == 200:
            ai_response = response.json().get('response', 'Sorry, I could not process that.')
            return jsonify({'response': ai_response})
        else:
            return jsonify({'response': 'AI service is busy. Please try again.'})
            
    except Exception as e:
        return jsonify({'response': f'Error: {str(e)}'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Add sample products if empty
        if Product.query.count() == 0:
            sample_products = [
                Product(name='Laptop Pro', description='High performance laptop', price=999.99, stock=10, category='Electronics'),
                Product(name='Wireless Mouse', description='Ergonomic mouse', price=29.99, stock=50, category='Accessories'),
                Product(name='Mechanical Keyboard', description='RGB mechanical keyboard', price=89.99, stock=30, category='Accessories'),
                Product(name='USB-C Cable', description='Fast charging cable', price=12.99, stock=100, category='Cables'),
            ]
            for p in sample_products:
                db.session.add(p)
            db.session.commit()
            print("✅ Sample products added!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
