import streamlit as st
import pandas as pd
# Importação absoluta (considerando sua estrutura de pastas)
from utils import fetch_achievements, fetch_game_details

# Paleta de cores inspirada no Steam
STEAM_COLORS = {
    "background": "#171a21",
    "primary": "#1b2838",
    "accent": "#66c0f4",
    "text": "#c7d5e0"
}

st.set_page_config(
    page_title="Painel de Estatísticas Steam",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown(
    f"""
    <style>
        .reportview-container {{
            background-color: {STEAM_COLORS['background']};
            color: {STEAM_COLORS['text']};
        }}
        .sidebar .sidebar-content {{
            background-color: {STEAM_COLORS['primary']};
        }}
        .st-bb, .st-at, .st-c6, .st-cg, .st-cj, .st-cq, .st-cr, .st-cs, .st-ct, .st-cu, .st-cv, .st-cw, .st-cx, .st-cy, .st-cz {{
            color: {STEAM_COLORS['text']} !important;
        }}
        .stButton>button {{
            background-color: {STEAM_COLORS['accent']};
            color: {STEAM_COLORS['primary']};
        }}
    </style>
    """,
    unsafe_allow_html=True
)

st.title("🎮 Painel de Estatísticas Steam")

app_id = st.text_input("Digite o App ID do jogo Steam:", "")

if app_id:
    with st.spinner("Buscando dados..."):
        try:
            details = fetch_game_details(app_id)
            achievements = fetch_achievements(app_id)
        except Exception as e:
            st.error(f"Erro ao buscar dados: {e}")
            st.stop()

    if details:
        st.header(details.get("name", "Jogo Steam"))
        st.image(details.get("header_image", ""), use_column_width=True)
        st.markdown(details.get("short_description", ""))

        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Informações Gerais")
            st.write(f"**Desenvolvedores:** {', '.join(details.get('developers', []))}")
            st.write(f"**Publicadoras:** {', '.join(details.get('publishers', []))}")
            st.write(f"**Data de Lançamento:** {details.get('release_date', {}).get('date', 'N/A')}")
            st.write(f"**Gêneros:** {', '.join([g['description'] for g in details.get('genres', [])])}")

        with col2:
            st.subheader("Metacritic & Preço")
            if details.get("metacritic"):
                st.metric("Metacritic", details["metacritic"]["score"])
            if details.get("price_overview"):
                st.metric("Preço", f"{details['price_overview']['final']/100:.2f} {details['price_overview']['currency']}")

        st.subheader("Estatísticas de Conquistas Globais")
        if achievements:
            df = pd.DataFrame(achievements)
            df = df.sort_values("percent", ascending=False)
            st.bar_chart(df.set_index("name")["percent"], color=STEAM_COLORS["accent"])
        else:
            st.info("Nenhuma conquista encontrada para este jogo.")
    else:
        st.warning("Jogo não encontrado ou sem detalhes disponíveis.")
else:
    st.info("Digite um App ID para visualizar estatísticas.")