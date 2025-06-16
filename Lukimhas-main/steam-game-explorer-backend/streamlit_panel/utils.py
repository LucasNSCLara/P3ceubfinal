import requests
import os

STEAM_API_BASE = "https://api.steampowered.com"
STEAM_API_KEY = os.environ.get('STEAM_API_KEY', '191216FAB4F49662CE0209FBF2A218FD')

def fetch_achievements(app_id):
    # Busca percentuais globais
    url = f"{STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/"
    params = {"gameid": app_id}
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()
    achievements = data.get("achievementpercentages", {}).get("achievements", [])

    # Busca schema para nomes legíveis e ícones
    schema_url = f"{STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/"
    schema_params = {"key": STEAM_API_KEY, "appid": app_id}
    schema_resp = requests.get(schema_url, params=schema_params)
    schema_data = schema_resp.json()
    schema_achievements = {}
    try:
        for ach in schema_data["game"]["availableGameStats"]["achievements"]:
            schema_achievements[ach["name"]] = {
                "displayName": ach.get("displayName"),
                "description": ach.get("description"),
                "icon": ach.get("icon"),
                "iconGray": ach.get("icongray"),
            }
    except Exception:
        pass

    # Junta os dados
    enriched = []
    for ach in achievements:
        name = ach["name"]
        percent = float(ach["percent"])
        schema = schema_achievements.get(name, {})
        enriched.append({
            "name": name,
            "percent": percent,
            "displayName": schema.get("displayName", name),
            "description": schema.get("description", ""),
            "icon": schema.get("icon", ""),
            "iconGray": schema.get("iconGray", ""),
        })
    return enriched

def fetch_game_details(app_id):
    url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    if str(app_id) in data and data[str(app_id)]["success"]:
        return data[str(app_id)]["data"]
    return {}