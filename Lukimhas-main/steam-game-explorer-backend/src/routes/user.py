from flask import Blueprint, jsonify, request
from src.models.user import User, db
import jwt
import datetime

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400

        # Validar dados
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo {field} é obrigatório"}), 400

        # Verificar se usuário já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email já cadastrado"}), 400

        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Nome de usuário já existe"}), 400

        # Criar novo usuário
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        # Gerar token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, 'asdf#FGSgvasgf$5$WGT', algorithm='HS256')

        return jsonify({
            "message": "Usuário registrado com sucesso",
            "token": token,
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro no registro: {str(e)}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400

        # Validar dados
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email e senha são obrigatórios"}), 400

        # Buscar usuário
        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({"error": "Email ou senha inválidos"}), 401

        # Gerar token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, 'asdf#FGSgvasgf$5$WGT', algorithm='HS256')

        return jsonify({
            "message": "Login realizado com sucesso",
            "token": token,
            "user": user.to_dict()
        }), 200

    except Exception as e:
        print(f"Erro no login: {str(e)}")
        return jsonify({"error": "Erro interno do servidor"}), 500

# Outras rotas...

