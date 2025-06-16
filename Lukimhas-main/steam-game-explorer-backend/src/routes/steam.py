from flask import Blueprint, jsonify, request
import requests
import os
from urllib.parse import quote
from functools import lru_cache
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from streamlit_panel.utils import fetch_achievements

steam_bp = Blueprint('steam', __name__)

# Steam API key - Quanto por em produ troca pra .env pelo amor de deus
STEAM_API_KEY = os.environ.get('STEAM_API_KEY', '191216FAB4F49662CE0209FBF2A218FD')

# Cache para a lista de apps
_apps_cache = {
    'data': None,
    'timestamp': None
}

# Cache timeout de 1 hora
CACHE_TIMEOUT = timedelta(hours=1)

def get_apps_list():
    """
    Obtém a lista de apps da Steam com cache.
    """
    global _apps_cache
    
    # Verifica se o cache é válido
    if (_apps_cache['data'] is not None and 
        _apps_cache['timestamp'] is not None and 
        datetime.now() - _apps_cache['timestamp'] < CACHE_TIMEOUT):
        return _apps_cache['data']
    
    # Se não houver cache válido, busca nova lista
    app_list_url = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/'
    response = requests.get(app_list_url)
    response.raise_for_status()
    
    data = response.json()
    apps = data.get('applist', {}).get('apps', [])
    
    # Atualiza o cache
    _apps_cache['data'] = apps
    _apps_cache['timestamp'] = datetime.now()
    
    return apps

def get_game_details_minimal(app_id):
    """
    Obtém apenas os detalhes mínimos necessários de um jogo.
    """
    try:
        store_url = f'https://store.steampowered.com/api/appdetails?appids={app_id}'
        response = requests.get(store_url)
        response.raise_for_status()
        
        data = response.json()
        
        if (str(app_id) in data and 
            data[str(app_id)]['success'] and 
            data[str(app_id)]['data'].get('type') == 'game'):
            
            return {
                'header_image': data[str(app_id)]['data'].get('header_image')
            }
    except:
        pass
    return None

@steam_bp.route('/games/search', methods=['GET'])
def search_games():
    """
    Busca jogos na Steam por nome.
    Retorna uma lista apenas de jogos válidos que correspondem ao termo de busca.
    """
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter "q" is required'}), 400
    
    try:
        # Usa a função com cache
        apps = get_apps_list()
        query_lower = query.lower()
        
        # Otimiza a busca limitando desde o início
        matching_games = []
        for app in apps:
            if query_lower in app['name'].lower():
                matching_games.append(app)
                if len(matching_games) >= 50:  # Limita durante a busca
                    break
        
        # Busca detalhes em paralelo
        valid_games = []
        max_workers = 10  # Limita o número de requisições paralelas
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_game = {
                executor.submit(get_game_details_minimal, game['appid']): game 
                for game in matching_games[:20]  # Limita a 20 jogos para detalhes
            }
            
            for future in as_completed(future_to_game):
                game = future_to_game[future]
                try:
                    details = future.result()
                    if details:
                        game['header_image'] = details.get('header_image')
                        valid_games.append(game)
                except Exception:
                    continue
                
                if len(valid_games) >= 20:
                    break
        
        return jsonify({
            'games': valid_games,
            'total': len(valid_games)
        })
        
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch data from Steam API: {str(e)}'}), 500

@steam_bp.route('/games/<int:app_id>/details', methods=['GET'])
def get_game_details(app_id):
    """
    Obtém detalhes de um jogo específico usando o app_id.
    """
    try:
        # Obtemos informações básicas do jogo da Steam Store API
        store_url = f'https://store.steampowered.com/api/appdetails?appids={app_id}'
        response = requests.get(store_url)
        response.raise_for_status()
        
        data = response.json()
        
        if str(app_id) not in data or not data[str(app_id)]['success']:
            return jsonify({'error': 'Game not found'}), 404
        
        game_data = data[str(app_id)]['data']
        
        # Extraímos as informações relevantes
        game_details = {
            'app_id': app_id,
            'name': game_data.get('name'),
            'description': game_data.get('short_description'),
            'detailed_description': game_data.get('detailed_description'),
            'header_image': game_data.get('header_image'),
            'website': game_data.get('website'),
            'developers': game_data.get('developers', []),
            'publishers': game_data.get('publishers', []),
            'release_date': game_data.get('release_date', {}),
            'genres': game_data.get('genres', []),
            'categories': game_data.get('categories', []),
            'screenshots': game_data.get('screenshots', []),
            'movies': game_data.get('movies', []),
            'price_overview': game_data.get('price_overview'),
            'platforms': game_data.get('platforms'),
            'metacritic': game_data.get('metacritic'),
            'recommendations': game_data.get('recommendations')
        }
        
        # Adicionar processamento dos requisitos do sistema
        if 'pc_requirements' in game_details:
            # Processar requisitos mínimos
            min_reqs = game_details['pc_requirements'].get('minimum', '')
            # Processar requisitos recomendados se disponíveis
            rec_reqs = game_details['pc_requirements'].get('recommended', '')
            
            # Função para extrair informações específicas dos requisitos
            def parse_requirements(req_text):
                if not req_text:
                    return {
                        'processor': 'Não especificado',
                        'memory': 'Não especificado',
                        'graphics': 'Não especificado',
                        'os': 'Não especificado',
                        'storage': 'Não especificado'
                    }
                
                try:
                    # Remove tags HTML
                    clean_text = req_text.replace('<br>', '\n').replace('<strong>', '').replace('</strong>', '')
                    # Expressões regulares para extrair informações
                    import re
                    
                    requirements = {
                        'processor': 'Não especificado',
                        'memory': 'Não especificado',
                        'graphics': 'Não especificado',
                        'os': 'Não especificado',
                        'storage': 'Não especificado'
                    }
                    
                    # CPU
                    cpu_pattern = r'Processor:?(.*?)(?:[\n\r]|Memory|RAM|$)'
                    cpu_match = re.search(cpu_pattern, clean_text, re.IGNORECASE | re.DOTALL)
                    if cpu_match:
                        requirements['processor'] = cpu_match.group(1).strip()

                    # RAM
                    ram_pattern = r'Memory:?(.*?)(?:[\n\r]|Graphics|$)'
                    ram_match = re.search(ram_pattern, clean_text, re.IGNORECASE | re.DOTALL)
                    if ram_match:
                        requirements['memory'] = ram_match.group(1).strip()

                    # GPU
                    gpu_pattern = r'Graphics:?(.*?)(?:[\n\r]|DirectX|Storage|$)'
                    gpu_match = re.search(gpu_pattern, clean_text, re.IGNORECASE | re.DOTALL)
                    if gpu_match:
                        requirements['graphics'] = gpu_match.group(1).strip()

                    # Storage
                    storage_pattern = r'Storage:?(.*?)(?:[\n\r]|Additional|$)'
                    storage_match = re.search(storage_pattern, clean_text, re.IGNORECASE | re.DOTALL)
                    if storage_match:
                        requirements['storage'] = storage_match.group(1).strip()

                    # OS
                    os_pattern = r'OS:?(.*?)(?:[\n\r]|Processor|$)'
                    os_match = re.search(os_pattern, clean_text, re.IGNORECASE | re.DOTALL)
                    if os_match:
                        requirements['os'] = os_match.group(1).strip()

                    return requirements
                except Exception as e:
                    print(f"Erro ao processar requisitos: {e}")
                    return {
                        'processor': 'Não especificado',
                        'memory': 'Não especificado',
                        'graphics': 'Não especificado',
                        'os': 'Não especificado',
                        'storage': 'Não especificado'
                    }
            
            game_details['pc_requirements'] = {
                'minimum': parse_requirements(min_reqs),
                'recommended': parse_requirements(rec_reqs)
            }
        
        return jsonify(game_details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@steam_bp.route('/games/<int:app_id>/reviews', methods=['GET'])
def get_game_reviews(app_id):
    """
    Obtém avaliações de usuários para um jogo específico.
    """
    try:
        # Parâmetros para a API de reviews
        filter_type = request.args.get('filter', 'all')  # all, recent, updated
        language = request.args.get('language', 'all')
        review_type = request.args.get('review_type', 'all')  # all, positive, negative
        num_per_page = min(int(request.args.get('num_per_page', 20)), 100)
        cursor = request.args.get('cursor', '*')
        
        # URL da API de reviews da Steam
        reviews_url = f'https://store.steampowered.com/appreviews/{app_id}'
        params = {
            'json': 1,
            'filter': filter_type,
            'language': language,
            'review_type': review_type,
            'num_per_page': num_per_page,
            'cursor': cursor
        }
        
        response = requests.get(reviews_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get('success'):
            return jsonify({'error': 'Failed to fetch reviews'}), 404
        
        # Processamos os dados das reviews
        reviews_data = {
            'query_summary': data.get('query_summary', {}),
            'reviews': [],
            'cursor': data.get('cursor')
        }
        
        for review in data.get('reviews', []):
            processed_review = {
                'recommendationid': review.get('recommendationid'),
                'author': {
                    'steamid': review.get('author', {}).get('steamid'),
                    'num_games_owned': review.get('author', {}).get('num_games_owned'),
                    'num_reviews': review.get('author', {}).get('num_reviews'),
                    'playtime_forever': review.get('author', {}).get('playtime_forever'),
                    'playtime_last_two_weeks': review.get('author', {}).get('playtime_last_two_weeks'),
                    'playtime_at_review': review.get('author', {}).get('playtime_at_review'),
                    'last_played': review.get('author', {}).get('last_played')
                },
                'language': review.get('language'),
                'review': review.get('review'),
                'timestamp_created': review.get('timestamp_created'),
                'timestamp_updated': review.get('timestamp_updated'),
                'voted_up': review.get('voted_up'),
                'votes_up': review.get('votes_up'),
                'votes_funny': review.get('votes_funny'),
                'weighted_vote_score': review.get('weighted_vote_score'),
                'comment_count': review.get('comment_count'),
                'steam_purchase': review.get('steam_purchase'),
                'received_for_free': review.get('received_for_free'),
                'written_during_early_access': review.get('written_during_early_access')
            }
            reviews_data['reviews'].append(processed_review)
        
        return jsonify(reviews_data)
        
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch reviews from Steam API: {str(e)}'}), 500
    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400

@steam_bp.route('/games/<int:app_id>/stats', methods=['GET'])
def get_game_stats(app_id):
    try:
        achievements = fetch_achievements(app_id)
        return jsonify({"achievements": achievements})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@steam_bp.route('/games/<int:app_id>/news', methods=['GET'])
def get_game_news(app_id):
    """
    Obtém notícias relacionadas a um jogo específico.
    """
    try:
        count = min(int(request.args.get('count', 5)), 20)
        
        news_url = f'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/'
        params = {
            'appid': app_id,
            'count': count,
            'maxlength': 300,
            'format': 'json'
        }
        
        response = requests.get(news_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        news_items = []
        for item in data.get('appnews', {}).get('newsitems', []):
            news_item = {
                'gid': item.get('gid'),
                'title': item.get('title'),
                'url': item.get('url'),
                'is_external_url': item.get('is_external_url'),
                'author': item.get('author'),
                'contents': item.get('contents'),
                'feedlabel': item.get('feedlabel'),
                'date': item.get('date'),
                'feedname': item.get('feedname')
            }
            news_items.append(news_item)
        
        return jsonify({
            'app_id': app_id,
            'news': news_items
        })
        
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch news from Steam API: {str(e)}'}), 500
    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400

