# 🗺️ RouteGuide

**RouteGuide** — это веб-приложение для планирования путешествий, которое помогает находить оптимальные маршруты и интересные места по пути.

## ✨ Основные возможности

- 📍 **Построение маршрутов** — введите начальную и конечную точки для расчета оптимального пути
- 🎯 **Точки интереса (POI)** — автоматический поиск достопримечательностей, кафе, музеев и других интересных мест вдоль маршрута
- 🗺️ **Интерактивная карта** — визуализация маршрута и POI с использованием Leaflet
- 📱 **Современный интерфейс** — отзывчивый дизайн на React

## 🛠️ Технологии

### Frontend

- **React** — UI библиотека
- **Vite** — быстрая сборка и разработка
- **Leaflet** — интерактивные карты
- **React-Leaflet** — интеграция Leaflet с React

### Backend

- **Node.js** + **TypeScript** — серверная логика
- **Fastify** — быстрый веб-фреймворк
- **OSRM API** — расчет маршрутов
- **Overpass API** — получение данных о точках интереса из OpenStreetMap

## 🚀 Быстрый старт

### Установка зависимостей

```bash
# Фронтенд
npm install

# Бэкенд
cd backend
npm install
```

### Запуск приложения

```bash
# Запустить фронтенд (порт 5173)
npm run dev

# Запустить бэкенд (порт 3000)
cd backend
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

## 📂 Структура проекта

```
routeguide/
├── src/                    # Frontend исходный код
│   ├── components/        # React компоненты
│   ├── api/              # API клиенты
│   └── App.jsx           # Главный компонент
├── backend/               # Backend сервер
│   └── src/
│       └── routes/       # API маршруты
└── public/               # Статические файлы
```

## 📝 API Endpoints

- `POST /api/route` — расчет маршрута между двумя точками
- `POST /api/pois` — поиск точек интереса вдоль маршрута

## 🤝 Разработка

Проект использует:

- ESLint для проверки кода
- Hot Module Replacement (HMR) для быстрой разработки

## 📄 Лицензия

MIT

## Export to Google Maps

- Build a route, use the POI list checkboxes to choose stops, and click **Open in Google Maps**.
- The exported link opens origin -> selected POIs (up to 23) -> destination in a new tab.
- Google Maps limits routes to 25 total points (origin + destination + 23 waypoints); extra selections are ignored.

---

# 🗺️ RouteGuide

**RouteGuide** is a travel planning web application that helps you find optimal routes and discover interesting places along the way.

## ✨ Key Features

- 📍 **Route Planning** — enter start and end points to calculate the optimal path
- 🎯 **Points of Interest (POI)** — automatic discovery of attractions, cafes, museums, and other interesting places along your route
- 🗺️ **Interactive Map** — route and POI visualization using Leaflet
- 📱 **Modern Interface** — responsive design built with React

## 🛠️ Tech Stack

### Frontend

- **React** — UI library
- **Vite** — fast build and development
- **Leaflet** — interactive maps
- **React-Leaflet** — Leaflet integration with React

### Backend

- **Node.js** + **TypeScript** — server-side logic
- **Fastify** — fast web framework
- **OSRM API** — route calculation
- **Overpass API** — fetching POI data from OpenStreetMap

## 🚀 Quick Start

### Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Run Application

```bash
# Start frontend (port 5173)
npm run dev

# Start backend (port 3000)
cd backend
npm run dev
```

Application will be available at: `http://localhost:5173`

## 📂 Project Structure

```
routeguide/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── api/              # API clients
│   └── App.jsx           # Main component
├── backend/               # Backend server
│   └── src/
│       └── routes/       # API routes
└── public/               # Static files
```

## 📝 API Endpoints

- `POST /api/route` — calculate route between two points
- `POST /api/pois` — find points of interest along the route

## 🤝 Development

The project uses:

- ESLint for code linting
- Hot Module Replacement (HMR) for fast development

## 📄 License

MIT
