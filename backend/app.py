from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from flask_cors import CORS
import os
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load .env file
load_dotenv()

app = Flask(__name__)

# Config - using .env variables
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.environ.get('MYSQL_USER', 'root')}:"
    f"{os.environ.get('MYSQL_PASSWORD', 'root123')}@"
    f"{os.environ.get('MYSQL_HOST', 'mysql')}/"
    f"{os.environ.get('MYSQL_DB', 'ecommerce')}"
)
app.config['JWT_SECRET_KEY'] = os.environ.get(
    'JWT_SECRET',
    'super-secret-key-change-me-to-at-least-32-bytes-long!!'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins='*', supports_credentials=True)


# Models
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
    total = db.Column(db.Float, default=0)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Routes
@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})


@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email exists'}), 400
        hashed = hashlib.sha256(data['password'].encode()).hexdigest()
        user = User(
            email=data['email'],
            password=hashed,
            name=data.get('name', '')
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'User created', 'user_id': user.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        hashed = hashlib.sha256(data['password'].encode()).hexdigest()
        if user.password != hashed:
            return jsonify({'error': 'Wrong password'}), 401
        token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=1)
        )
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description or '',
        'price': p.price,
        'stock': p.stock,
        'category': p.category or '',
        'image_url': p.image_url or ''
    } for p in products])


@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = int(get_jwt_identity())
        data = request.json

        order_num = (
            f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{user_id}"
        )

        order = Order(
            order_number=order_num,
            user_id=user_id,
            total=data.get('total', 0),
            status='pending'
        )
        db.session.add(order)
        db.session.commit()

        if 'items' in data and data['items']:
            for item in data['items']:
                product = Product.query.get(item['id'])
                if product:
                    product.stock -= item['quantity']
            db.session.commit()

        return jsonify({
            'success': True,
            'order_id': order.id,
            'order_number': order_num,
            'message': 'Order placed successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    try:
        user_id = int(get_jwt_identity())
        orders = Order.query.filter_by(user_id=user_id).order_by(
            Order.created_at.desc()
        ).all()

        return jsonify([{
            'id': o.id,
            'order_number': o.order_number,
            'total': o.total,
            'status': o.status,
            'created_at': o.created_at.isoformat()
        } for o in orders]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)