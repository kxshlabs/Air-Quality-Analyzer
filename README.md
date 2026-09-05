# India Air Quality Analyzer Dashboard 🌫️

An interactive, data-driven dashboard analyzing real-time and historical air quality metrics across 20 major Indian cities. Built using Python, Pandas, Plotly, Folium, and Streamlit.

---

## 🌟 Key Features
- **🗺️ Live Interactive Map**: Folium map showing color-coded AQI severity markers across 20 Indian cities.
- **🔍 City Explorer**: Detailed breakdown of PM2.5, PM10, NO2, and CO levels compared to National Averages and WHO Guidelines.
- **🏆 City Risk Rankings**: Ranked risk score leaderboards highlighting hazardous days and worst-polluted cities.
- **⚠️ Spike Event Timeline**: Automated detection of sudden AQI surges (>= 50 point jump over 7-day rolling average).
- **📅 Seasonal Patterns & Diwali Impact**: Time-series seasonal trends illustrating stubble burning, winter fog inversion, and Diwali pyrotechnic spikes.
- **🏥 Health Advisory Matrix**: Real-time health severity advisories and vulnerable population exposure estimates.

---

## 📁 Project Structure
```text
air-quality-analyzer/
├── data/
│   ├── raw/              ← Raw OpenAQ API CSV outputs
│   └── processed/        ← Cleaned, scored, and fingerprinted datasets
├── notebooks/
│   ├── 01_EDA.ipynb
│   ├── 02_feature_engineering.ipynb
│   └── 03_correlation_analysis.ipynb
├── src/
│   ├── data_fetch.py     ← OpenAQ API fetching pipeline
│   ├── cleaning.py       ← Data cleaning & imputation pipeline
│   └── analysis.py       ← Analytics loader & scoring engine
├── app/
│   └── streamlit_app.py  ← Master 6-tab Streamlit dashboard
├── .env                  ← Environment variables (API keys)
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 🚀 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/air-quality-analyzer.git
   cd air-quality-analyzer
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Data Pipelines**:
   ```bash
   python src/data_fetch.py
   python src/cleaning.py
   ```

4. **Launch the Dashboard**:
   ```bash
   python -m streamlit run app/streamlit_app.py
   ```

---

## ☁️ Streamlit Cloud Deployment
This project is configured for instant 1-click deployment on **Streamlit Cloud**:
1. Push this repository to GitHub.
2. Connect repository to [Streamlit Community Cloud](https://streamlit.io/cloud).
3. Set Main file path to `app/streamlit_app.py`.
